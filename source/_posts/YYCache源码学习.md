---
title: YYCache源码学习
date: '2019-10-19 15:26:28'
abbrlink: ba9af90f
tags:
---


# YYCache 简介

先来看一下官方介绍
- **LRU**: 缓存支持 LRU (least-recently-used) 淘汰算法。
- **缓存控制**: 支持多种缓存控制方法：总数量、总大小、存活时间、空闲空间。
- **兼容性**: API 基本和 `NSCache` 保持一致, 所有方法都是`线程安全`的。
- **内存缓存**
  - **对象释放控制**: 对象的释放(release) 可以配置为同步或异步进行，可以配置在主线程或后台线程进行。
  - **自动清空**: 当收到内存警告或 App 进入后台时，缓存可以配置为自动清空。
- **磁盘缓存**
  - **可定制性**: 磁盘缓存支持自定义的归档解档方法，以支持那些没有实现 NSCoding 协议的对象。
  - **存储类型控制**: 磁盘缓存支持对每个对象的存储类型 (SQLite/文件) 进行自动或手动控制，以获得更高的存取性能。

## 文件目录
```c++
├── YYCache
    ├── YYCache.h
    ├── YYCache.m
    ├── YYDiskCache.h
    ├── YYDiskCache.m
    ├── YYKVStorage.h
    ├── YYKVStorage.m
    ├── YYMemoryCache.h
    └── YYMemoryCache.m
```

## 相关API
```objc
@interface YYCache : NSObject
/// 三个只读属性
//  ① Cache名称
@property (copy, readonly) NSString *name;
//  ② 内存缓存
@property (strong, readonly) YYMemoryCache *memoryCache;
//  ③ 磁盘缓存
@property (strong, readonly) YYDiskCache *diskCache;

/// 初始化相关方法
- (nullable instancetype)initWithName:(NSString *)name;
- (nullable instancetype)initWithPath:(NSString *)path NS_DESIGNATED_INITIALIZER;
+ (nullable instancetype)cacheWithName:(NSString *)name;
+ (nullable instancetype)cacheWithPath:(NSString *)path;

- (instancetype)init UNAVAILABLE_ATTRIBUTE;
+ (instancetype)new UNAVAILABLE_ATTRIBUTE;

#pragma mark - Access Methods
/// 是否包含某个缓存对象
- (BOOL)containsObjectForKey:(NSString *)key;
- (void)containsObjectForKey:(NSString *)key withBlock:(nullable void(^)(NSString *key, BOOL contains))block;

/// 获取缓存对象
- (nullable id<NSCoding>)objectForKey:(NSString *)key;
- (void)objectForKey:(NSString *)key withBlock:(nullable void(^)(NSString *key, id<NSCoding> object))block;

/// 保存缓存对象
- (void)setObject:(nullable id<NSCoding>)object forKey:(NSString *)key;
- (void)setObject:(nullable id<NSCoding>)object forKey:(NSString *)key withBlock:(nullable void(^)(void))block;

/// 删除某个缓存对象
- (void)removeObjectForKey:(NSString *)key;
- (void)removeObjectForKey:(NSString *)key withBlock:(nullable void(^)(NSString *key))block;

/// 删除所有缓存对象
- (void)removeAllObjects;
- (void)removeAllObjectsWithBlock:(void(^)(void))block;
- (void)removeAllObjectsWithProgressBlock:(nullable void(^)(int removedCount, int totalCount))progress
                                 endBlock:(nullable void(^)(BOOL error))end;

@end
```

- `YYCache` 中 `memoryCache` 和 `diskCache` 均为 `strong` 且 `readonly`；
- 也就是说当我们外界使用`YYCache`对象的时候，对其内部的 `memoryCache` 和 `diskCache` 成员是 `强引用`

> 知识点: NS_DESIGNATED_INITIALIZER 和 NS_UNAVAILABLE

我们都知道，一个类可能会有多个工厂方法或者初始化方法，当外界调用时，难免会傻傻分不清楚，这个时候就可以使用苹果为开发者提供的两个宏 `NS_DESIGNATED_INITIALIZER` 和 `NS_UNAVAILABLE` 来进行描述；

```c++
#define NS_DESIGNATED_INITIALIZER __attribute__((objc_designated_initializer))
#define UNAVAILABLE_ATTRIBUTE __attribute__((unavailable))
```

- **NS_DESIGNATED_INITIALIZER**

[苹果官方文档](https://developer.apple.com/library/archive/documentation/General/Conceptual/DevPedia-CocoaCore/MultipleInitializers.html)给出了一个调用顺序，而我们也应该遵守这种调用顺序，以确保无论外部调用者从哪个入口进入，都能够正确的初始化：
![](https://developer.apple.com/library/archive/documentation/General/Conceptual/DevPedia-CocoaCore/Art/multiple_initializers_2x.png)

如上图所示：无论调用哪种初始化方法，最终都会调用 `designed initializer`, 具体代码如下：
```objc
- (instancetype)initWithTitle:(NSString *)title 
                         date:(NSDate *)date NS_DESIGNATED_INITIALIZER;
```

- **NS_UNAVAILABLE**
使用 `NS_UNAVAILABLE` 后代表`直接禁用`，如果使用该方法，编译器就会报错；


# YYCache 初始化

我们从`NS_DESIGNATED_INITIALIZER`的初始化方法进行分析:

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

当然了，如果我们直接使用`- (instancetype)initWithName:(NSString *)name`进行初始化，可以看一下，默认存储的`path`
```objc
- (instancetype)initWithName:(NSString *)name {
    if (name.length == 0) return nil;
    NSString *cacheFolder = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
    NSString *path = [cacheFolder stringByAppendingPathComponent:name];
    return [self initWithPath:path];
}
```

# YYDiskCache 磁盘缓存

## YYDiskCache  初始化

```objc
@interface YYDiskCache : NSObject

// Cache name
@property (nullable, copy) NSString *name;
// Cache path
@property (readonly) NSString *path;
// 磁盘缓存方式的一个阈值，默认是20KB
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

- 这里主要是对 inlineThreshold 阈值进行了初始化(20KB)
  ```objc
  - (instancetype)initWithPath:(NSString *)path {
    return [self initWithPath:path inlineThreshold:1024 * 20]; // 20KB
  }
  ```

- 真正的初始化方法(NS_DESIGNATED_INITIALIZER)
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
- `dispatch_semaphore_t`：用来保证`线程安全`


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
- 在调用`_YYDiskCacheGetGlobal`时会调用`_YYDiskCacheInitGlobal` 进行初始化；
- 由于`_YYDiskCacheInitGlobal`内部使用`dispatch_once`，可保证只初始化了一次；

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
- 在调用`_YYDiskCacheGetGlobal`时会调用`_YYDiskCacheInitGlobal` 进行初始化；
- 由于`_YYDiskCacheInitGlobal`内部使用`dispatch_once`，可保证只初始化了一次；


## 真正的创建YYDiskCache对象
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


# YYMemoryCache 初始化
