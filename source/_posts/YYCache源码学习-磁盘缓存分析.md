---
title: YYCache源码学习-磁盘缓存分析
description: >-
  YYDiskCache 是一个`线程安全`的，用于存储由`SQLite`支持的键值对和`文件系统`（类似于 `NSURLCache`
  的磁盘缓存）。采用LRU来移除数据；不同数据自动采用不同的存储机制：`sqlite` 或 `file`；支持`同步`与`异步`的方式调用等特性。
abbrlink: 5c5f8fb2
date: 2019-10-22 13:52:50
tags:
---


在上一篇文章中，我们对`YYCache`的初始化操作了做了见得分析，具体代码如下：

```objc
- (instancetype)initWithPath:(NSString *)path {
    if (path.length == 0) return nil;

    // ① 初始化磁盘缓存
    YYDiskCache *diskCache = [[YYDiskCache alloc] initWithPath:path];
    if (!diskCache) return nil;
    NSString *name = [path lastPathComponent];

    // ② 初始化内存缓存
    YYMemoryCache *memoryCache = [YYMemoryCache new];
    memoryCache.name = name;
    
    // ③ 初始化本身并对内部的三个只读属性进行赋值
    self = [super init];
    _name = name;
    _diskCache = diskCache;
    _memoryCache = memoryCache;
    return self;
}
```

> 本篇文章我们介绍一下 `YYDiskCache` 磁盘缓存的实现

# YYDiskCache 简介

先来看一下官方介绍(可在源码中查阅):
```
`YYDiskCache` 是一个`线程安全`的，用于存储由`SQLite`支持的键值对和`文件系统`（类似于 `NSURLCache` 的磁盘缓存）

- 使用`LRU(least-recently-used)`来移除对象；
- 可以通过 `cost`，`count` 和 `age` 来控制；
- 可以配置为当`没有空闲磁盘空间`时`自动删除对象`；
- 可以`自动决定`每个对象的`存储类型(sqlite/file)`，以获得更好的性能；

在iOS系统上可以直接从官网下载最新的 `SQLite` 源码编译编译并忽略系统的`libsqlite3.dylib`可以获得`2x~4x`的速度。
```

我们对上面的信息进行提炼一下关键信息：
- ① 线程安全；
- ② 采用`LRU`移除对象；
- ③ 多维度的控制: `cost`，`count` 和 `age` ；
- ④ 不同数据自动采用不同的存储机制：`sqlite` 或 `file`；
- ⑤ 磁盘不足时可自动删除；
- ⑥ 支持`同步`与`异步`的方式调用(源码API层面)；

> 在提到`YYCache`的`LRU`时，网上大部分的文章都是再谈`双链表 + hash表`，该结构只是`YYCache`内存缓存(`YYMemoryCache`) 所采用的`LRU`方案，我们需要知道：YYCache 的磁盘缓存(`YYDiskCache`)也是支持`LRU`的;


# YYDiskCache 源码总览



# YYDiskCache 初始化


```objc
@interface YYDiskCache : NSObject

// Cache name
@property (nullable, copy) NSString *name;
// Cache path
@property (readonly) NSString *path;
// 磁盘缓存方式的一个阈值，默认是20480字节(20KB)
// 🔔❗️❗️❗️如果要存储的数据大小(以字节为单位)大于该阈值，则将其存储为文件，否则将其存储在sqlite中
@property (readonly) NSUInteger inlineThreshold;

······

// 初始化 (NS_DESIGNATED_INITIALIZER)
- (nullable instancetype)initWithPath:(NSString *)path
                      inlineThreshold:(NSUInteger)threshold NS_DESIGNATED_INITIALIZER;

······

@end
```


初始化`YYCache`时调用了 `YYDiskCache` 的 `initWithPath` 方法

- 这里主要是对 `inlineThreshold` 阈值进行了初始化(20KB)
  ```objc
  - (instancetype)initWithPath:(NSString *)path {
    return [self initWithPath:path inlineThreshold:1024 * 20]; // 20KB
  }
  ```

- 真正的初始化方法`NS_DESIGNATED_INITIALIZER`
  ```objc
  - (instancetype)initWithPath:(NSString *)path
              inlineThreshold:(NSUInteger)threshold {
      self = [super init];
      if (!self) return nil;
      
      // ① 根据path利用_YYDiskCacheGetGlobal获取YYDiskCache对象
      YYDiskCache *globalCache = _YYDiskCacheGetGlobal(path);
      // 存在的话直接返回，不需创建
      if (globalCache) return globalCache;
      
      // ② 真正的初始化操作
      ······ // 下文分析
      
      [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_appWillBeTerminated) name:UIApplicationWillTerminateNotification object:nil];
      return self;
  }
  ```


## 从缓存中获取YYDiskCache对象

在上文中我们得知，`YYDiskCache`在初始化的时候，首先会根据`path` 调用 `_YYDiskCacheGetGlobal`来进行查找，如果查到，就直接返回，如果没有找到就执行一系列的初始化操作，然后又调用 `_YYDiskCacheSetGlobal` 将创建好的`YYDiskCache` 对象存入，现在我们来分析一下 `_YYDiskCacheGetGlobal` 和 `_YYDiskCacheSetGlobal`；

```c++
/// weak reference for all instances
static NSMapTable *_globalInstances;
static dispatch_semaphore_t _globalInstancesLock;
```
- 定义了一个全局的 `NSMapTable` 类型的 `_globalInstances` 和 一个 `dispatch_semaphore_t` 类型的 `_globalInstancesLock`;
- `_globalInstances`：存放所有的 `YYDiskCache` 对象
- `dispatch_semaphore_t`：用来保证读写`YYDiskCache`对象的`线程安全`


### _YYDiskCacheInitGlobal

```c++
static void _YYDiskCacheInitGlobal() {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _globalInstancesLock = dispatch_semaphore_create(1);
        _globalInstances = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory valueOptions:NSPointerFunctionsWeakMemory capacity:0];
    });
}
```

- 使用`dispatch_once`保证只初始化一次；
- 🔔❗️❗️❗️ `_globalInstances` 用来存放所有的 `YYDiskCache`对象， 使用 `NSMapTable` + `NSPointerFunctionsWeakMemory`， `弱引用` 内部的 `YYDiskCache`对象；
- 🔔❗️❗️❗️ `_globalInstancesLock` 用来保证读取`YYDiskCache`对象的线程安全；

### _YYDiskCacheGetGlobal
```c++
static YYDiskCache *_YYDiskCacheGetGlobal(NSString *path) {
    if (path.length == 0) return nil;
    _YYDiskCacheInitGlobal();
    dispatch_semaphore_wait(_globalInstancesLock, DISPATCH_TIME_FOREVER);
    id cache = [_globalInstances objectForKey:path];
    dispatch_semaphore_signal(_globalInstancesLock);
    return cache;
}
```

### _YYDiskCacheSetGlobal
```c++
static void _YYDiskCacheSetGlobal(YYDiskCache *cache) {
    if (cache.path.length == 0) return;
    _YYDiskCacheInitGlobal();
    dispatch_semaphore_wait(_globalInstancesLock, DISPATCH_TIME_FOREVER);
    [_globalInstances setObject:cache forKey:cache.path];
    dispatch_semaphore_signal(_globalInstancesLock);
}
```
- 在调用`_YYDiskCacheGetGlobal` 或 `_YYDiskCacheSetGlobal` 时会调用`_YYDiskCacheInitGlobal` 进行初始化；
- 由于`_YYDiskCacheInitGlobal`内部使用`dispatch_once`，可保证只初始化了一次；


> dispatch_semaphore_t 线程同步方案
```objc
// creat：初始化，信号量初始值 1
_globalInstancesLock = dispatch_semaphore_create(1);
// wait：对信号量数值减1，如果结果值`小于0`，则该函数处于等待状态， 直到超时或等待一个`唤醒信号`。
dispatch_semaphore_wait(_globalInstancesLock, DISPATCH_TIME_FOREVER);
// signal：对信号量数值加1。如果`前一个值小于0`，这个函数在返回之前`唤醒`一个等待的线程(主要是针对上面的wait)。
dispatch_semaphore_signal(_globalInstancesLock);
```

## 真正的创建YYDiskCache对象

- 根据`path` 和存储方式 `YYKVStorageType`  初始化 `YYKVStorage`；
- 初始化了一个 `dispatch_semaphore` 信号量；
- 初始化了一个 `dispatch_queue` 自定义的`并发队列`；
- 初始化一些额外的控制属性；
- 将上述初始化好的数据挂载到 `YYDiskCache` 对象上，并存入全局的 `_globalInstances` 中；

```objc
- (instancetype)initWithPath:(NSString *)path
            inlineThreshold:(NSUInteger)threshold {
    self = [super init];
    if (!self) return nil;
    
    // ① 根据path利用_YYDiskCacheGetGlobal获取YYDiskCache对象
    YYDiskCache *globalCache = _YYDiskCacheGetGlobal(path);
    // 存在的话直接返回，不需创建
    if (globalCache) return globalCache;
    
    // ② YYDiskCache 真正的初始化操作
    YYKVStorageType type;
    if (threshold == 0) {
        type = YYKVStorageTypeFile;
    } else if (threshold == NSUIntegerMax) {
        type = YYKVStorageTypeSQLite;
    } else {
        type = YYKVStorageTypeMixed;
    }
    
    // 真正实现数据存取的对象
    YYKVStorage *kv = [[YYKVStorage alloc] initWithPath:path type:type];
    if (!kv) return nil;
    
    _kv = kv;
    _path = path;
    // 使用GCD 信号量 创建了一把锁，保证线程安全
    _lock = dispatch_semaphore_create(1);
    // 创建了一个自定义的并发队列
    _queue = dispatch_queue_create("com.ibireme.cache.disk", DISPATCH_QUEUE_CONCURRENT);
    _inlineThreshold = threshold;
    _countLimit = NSUIntegerMax;
    _costLimit = NSUIntegerMax;
    _ageLimit = DBL_MAX;
    _freeDiskSpaceLimit = 0;
    _autoTrimInterval = 60;
    
    [self _trimRecursively];

    // ③ 存入：_YYDiskCacheSetGlobal
    _YYDiskCacheSetGlobal(self);
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_appWillBeTerminated) name:UIApplicationWillTerminateNotification object:nil];
    return self;
}
```


# YYDiskCache 线程安全

在上文 `YYDiskCache` 初始化的时候，创建了一个 `dispatch_semaphore` 信号量；我们从API来分析 `YYDiskCache` 的线程安全；

> 以 `- (void)removeObjectForKey:(NSString *)key` 为例:

```objc
// self->_lock：初始化 YYDiskCache 时，创建的 dispatch_semaphore
#define Lock()   dispatch_semaphore_wait(self->_lock, DISPATCH_TIME_FOREVER)
#define Unlock() dispatch_semaphore_signal(self->_lock)

// 同步删除方式
- (void)removeObjectForKey:(NSString *)key {
    if (!key) return;
    Lock();
    [_kv removeItemForKey:key]; // 线程安全
    Unlock();
}
// 异步删除方式
- (void)removeObjectForKey:(NSString *)key withBlock:(void(^)(NSString *key))block {
    __weak typeof(self) _self = self;
    // _queue：初始化 YYDiskCache 时，创建的并发队列
    dispatch_async(_queue, ^{
        __strong typeof(_self) self = _self;
        [self removeObjectForKey:key];
        if (block) block(key);
    });
}
```

> 初始化 `YYDiskCache` 时，创建的 `dispatch_semaphore` 和 `dispatch_queue` 作用:

- `dispatch_semaphore` 用来保证`操作缓存数据`时的`线程安全`；
- 并发的`dispatch_queue` 用来实现`操作缓存数据`时的`同步`还是`异步`方式；

我们只是以`删除操作`为例进行了说明：别的`操作`类似；


