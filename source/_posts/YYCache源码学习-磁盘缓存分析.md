---
title: YYCache源码学习-磁盘缓存分析
description: >-
  YYDiskCache 是一个`线程安全`的，用于存储由`SQLite`支持的键值对和`文件系统`（类似于 `NSURLCache`
  的磁盘缓存）。采用LRU来移除数据；不同数据自动采用不同的存储机制：`sqlite` 或 `file`；支持`同步`与`异步`的方式调用等特性。
abbrlink: 5c5f8fb2
date: 2019-10-22 13:52:50
tags:
---


在[上一篇文章](https://yotrolz.com/posts/ba9af90f/)中，我们对`YYCache`的初始化操作了做了简单分析，具体代码如下：

```objc
// YYCache.m
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
- 至于为何是`20KB`，我们可以参看[YYCache 设计思路
](https://blog.ibireme.com/2015/10/26/yycache/) 和 [ SQLite官方说明](https://www.sqlite.org/intern-v-extern-blob.html)
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

- 可以看出真正在操作数据的其实是`[_kv removeItemForKey:key];`
- `_kv` 就是在初始化 `YYDiskCache` 时，创建的 `YYKVStorage` 对象;

> 初始化 `YYDiskCache` 时，创建的 `dispatch_semaphore` 和 `dispatch_queue` 作用:

- `dispatch_semaphore` 用来保证`操作缓存数据`时的`线程安全`；
- 并发的`dispatch_queue` 用来实现`操作缓存数据`时的`同步`还是`异步`方式；

我们只是以`删除操作`为例进行了说明：别的`操作`类似；


# YYDiskCache 存储操作

> 以 `- (void)setObject:(id<NSCoding>)object forKey:(NSString *)key;` 为例:

```objc
// YYDiskCache.m
- (void)setObject:(id<NSCoding>)object forKey:(NSString *)key {
    if (!key) return;
    // 如果 object 为 nil 就执行删除操作
    if (!object) {
        [self removeObjectForKey:key];
        return;
    }
    
    // extendedData: 其实也就是 object 的一个附加数据；
    // 在保存 object 之前，如果给object设置了这个附加数据，YYDiskCache 也会一并存储；
    // 获取 object 绑定的 extendedData 数据
    NSData *extendedData = [YYDiskCache getExtendedDataFromObject:object];
    // object 对应的 NSData 数据
    // 可以自定义归档方式 或 使用默认的 NSKeyedArchiver
    NSData *value = nil;
    if (_customArchiveBlock) {
        value = _customArchiveBlock(object);
    } else {
        @try {
            value = [NSKeyedArchiver archivedDataWithRootObject:object];
        }
        @catch (NSException *exception) {
            // nothing to do...
        }
    }
    if (!value) return;
    NSString *filename = nil;
    if (_kv.type != YYKVStorageTypeSQLite) {
        // 🔔❗️❗️❗️
        // 如果没有明确标明存储方式为 SQLite 自动进行不同方式的存储机制 SQLite / File
        // 根据存储数据的字节数及阈值进行区分
        if (value.length > _inlineThreshold) {
            // 存储数据的大小超过了阈值 获取一个 filename 用于存储文件时使用
            // filename的生成规则，默认：MD5(key)；也可以通过 `customFileNameBlock(key)` 自定义
            filename = [self _filenameForKey:key];
        }
    }
    
    // 加解锁操作，保证数据访问时的线程安全
    Lock();
    // 正真的存储操作
    [_kv saveItemWithKey:key value:value filename:filename extendedData:extendedData];
    Unlock();
}
```

- 有上述得知：`数据量超过阈值`后，会生成一个 `filename`，我们接着分析；

## 存储机制：inline_data / file

```objc
// YYKVStorage.m
- (BOOL)saveItemWithKey:(NSString *)key value:(NSData *)value filename:(NSString *)filename extendedData:(NSData *)extendedData {
    if (key.length == 0 || value.length == 0) return NO;
    if (_type == YYKVStorageTypeFile && filename.length == 0) {
        return NO;
    }
    
    // 🔔❗️❗️❗️ 🔔❗️❗️❗️
    if (filename.length) {
    // ① 若filename存在(数据量超过了阈值) --> 采用`File`的方式
        // ①-① 写入 文件 的操作
        if (![self _fileWriteWithName:filename data:value]) {
            return NO;
        }
        // ①-② 写入 SQLite 的操作
        if (![self _dbSaveWithKey:key value:value fileName:filename extendedData:extendedData]) {
            // 操作失败后要将①-①中写入的文件删除
            [self _fileDeleteWithName:filename];
            return NO;
        }
        return YES;
    } else {
    // ② 若filename不存在(数据量小于阈值) --> 采用`inline_data`的方式
        if (_type != YYKVStorageTypeSQLite) {
            NSString *filename = [self _dbGetFilenameWithKey:key];
            if (filename) {
                [self _fileDeleteWithName:filename];
            }
        }
        // ②-① 写入 SQLite 的操作
        return [self _dbSaveWithKey:key value:value fileName:nil extendedData:extendedData];
    }
}
```

> 🔔❗️❗️❗️不管数据量超没超过阈值，都会在 `SQLite` 中写入一条数据的
- 超过阈值：`SQLite` + `File`；(不将`data`数据写入`SQLite`)
- 没超过阈值：`SQLite` + `inline_data`；
- 提高存储效率；

我们看一下具体源码实现：
```objc
// YYKVStorage.m (私有方法)
- (BOOL)_dbSaveWithKey:(NSString *)key value:(NSData *)value fileName:(NSString *)fileName extendedData:(NSData *)extendedData {
    NSString *sql = @"insert or replace into manifest (key, filename, size, inline_data, modification_time, last_access_time, extended_data) values (?1, ?2, ?3, ?4, ?5, ?6, ?7);";

    🔔❗️❗️❗️🔔❗️❗️❗️🔔❗️❗️❗️ // 下文分析
    sqlite3_stmt *stmt = [self _dbPrepareStmt:sql];
    if (!stmt) return NO;
    
    int timestamp = (int)time(NULL);
    sqlite3_bind_text(stmt, 1, key.UTF8String, -1, NULL);
    sqlite3_bind_text(stmt, 2, fileName.UTF8String, -1, NULL);
    sqlite3_bind_int(stmt, 3, (int)value.length);
    🔔❗️❗️❗️🔔❗️❗️❗️🔔❗️❗️❗️
    // fileName 存在时，保存的数据其实是 NULL
    if (fileName.length == 0) {
        sqlite3_bind_blob(stmt, 4, value.bytes, (int)value.length, 0);
    } else {
        sqlite3_bind_blob(stmt, 4, NULL, 0, 0);
    }
    sqlite3_bind_int(stmt, 5, timestamp);
    sqlite3_bind_int(stmt, 6, timestamp);
    sqlite3_bind_blob(stmt, 7, extendedData.bytes, (int)extendedData.length, 0);
    
    int result = sqlite3_step(stmt);
    if (result != SQLITE_DONE) {
        if (_errorLogsEnabled) NSLog(@"%s line:%d sqlite insert error (%d): %s", __FUNCTION__, __LINE__, result, sqlite3_errmsg(_db));
        return NO;
    }
    return YES;
}
```

## SQLite DB 操作

看到这里，大家可能会想，`SQLite DB`操作无非就是写几行`SQL` 跑一下而已，有什么可说的。然而并非如此，`YYCache` 同样做了很多`提高性能`的事情!

### sqlite3_stmt

大家都知道`sqlite3` 有一个 执行的 `SQL` 语句的函数`sqlite3_exec`:

```c++
SQLITE_API int sqlite3_exec(
  sqlite3*,                                  /* An open database */
  const char *sql,                           /* SQL to be evaluated */
  int (*callback)(void*,int,char**,char**),  /* Callback function */
  void *,                                    /* 1st argument to callback */
  char **errmsg                              /* Error msg written here */
);
```

其实呢：`SQL`语句可以理解为一种`编程语言`的`源代码`，而想要执行这个`源代码`就必须要进行`编译/解析`，而`sqlite3_stmt`是一个`预编译语句对象`, 该对象的一个`实例`表示一条`SQL`语句，并且`已经被编译成二进制`形式，可以`直接运行`；

`sqlite3_stmt` 的使用流程：
- ① 使用`sqlite3_prepare_v2()`创建预处理语句对象；
- ② 使用`sqlite3_bind()`将值绑定到`SQL`上；
- ③ 通过调用`sqlite3_step()`一次或多次运行`SQL`;
- ④ 使用`sqlite3_reset()`重置准备好的语句，然后返回到步骤2。这样做0次或更多次。
- ⑤ 使用`sqlite3_finalize()`销毁对象。

> YYCache 只有在初始化DB(`- (BOOL)_dbInitialize;`)时使用了`sqlite3_exec`执行`SQL`，而`重复性`的增删改查操作都是使用`sqlite3_stmt`来执行`SQL`;


### 缓存 `SQL` 操作

接着回到我们的源码：
```objc
// 接上文
sqlite3_stmt *stmt = [self _dbPrepareStmt:sql];
```

> 采用 `CFMutableDictionaryRef` 缓存 `sqlite3_stmt` 对象

```objc
// YYKVStorage.m (私有方法)
- (sqlite3_stmt *)_dbPrepareStmt:(NSString *)sql {
    if (![self _dbCheck] || sql.length == 0 || !_dbStmtCache) return NULL;
    // ① 从缓存中查找 sqlite3_stmt 对象
    sqlite3_stmt *stmt = (sqlite3_stmt *)CFDictionaryGetValue(_dbStmtCache, (__bridge const void *)(sql));
    if (!stmt) {
        // ②-① 缓存中没有 --> 调用 sqlite3_prepare_v2 创建
        int result = sqlite3_prepare_v2(_db, sql.UTF8String, -1, &stmt, NULL);
        if (result != SQLITE_OK) {
            if (_errorLogsEnabled) NSLog(@"%s line:%d sqlite stmt prepare error (%d): %s", __FUNCTION__, __LINE__, result, sqlite3_errmsg(_db));
            return NULL;
        }
        // ②-② 将新创建的 sqlite3_stmt 对象 存入缓存
        CFDictionarySetValue(_dbStmtCache, (__bridge const void *)(sql), stmt);
    } else {
        // ③ 缓存中存在 --> 调用 sqlite3_reset 重置一下，供外界使用
        sqlite3_reset(stmt);
    }
    return stmt;
}
```


`[self _dbCheck]`其实是对DB数据库的一个校验与`重试`处理：
```objc
static const NSUInteger kMaxErrorRetryCount = 8;
static const NSTimeInterval kMinRetryTimeInterval = 2.0;
- (BOOL)_dbCheck {
    if (!_db) {
        // _dbOpenErrorCount: `sqlite3_open` 失败就会加一
        if (_dbOpenErrorCount < kMaxErrorRetryCount &&
            CACurrentMediaTime() - _dbLastOpenErrorTime > kMinRetryTimeInterval) {
            // 重新打开 及 初始化
            return [self _dbOpen] && [self _dbInitialize];
        } else {
            return NO;
        }
    }
    return YES;
}
```


`[self _dbOpen]`内部会调用`sqlite3_open`打开数据库，打开成功后会创建了一个`_dbStmtCache`，用来缓存`sqlite3_stmt`对象；

```objc
- (BOOL)_dbOpen {
    if (_db) return YES;
    
    int result = sqlite3_open(_dbPath.UTF8String, &_db);
    if (result == SQLITE_OK) {
        CFDictionaryKeyCallBacks keyCallbacks = kCFCopyStringDictionaryKeyCallBacks;
        CFDictionaryValueCallBacks valueCallbacks = {0};
        _dbStmtCache = CFDictionaryCreateMutable(CFAllocatorGetDefault(), 0, &keyCallbacks, &valueCallbacks);
        _dbLastOpenErrorTime = 0;
        _dbOpenErrorCount = 0;
        return YES;
    } else {
        _db = NULL;
        if (_dbStmtCache) CFRelease(_dbStmtCache);
        _dbStmtCache = NULL;
        _dbLastOpenErrorTime = CACurrentMediaTime();
        _dbOpenErrorCount++;
        
        if (_errorLogsEnabled) {
            NSLog(@"%s line:%d sqlite open failed (%d).", __FUNCTION__, __LINE__, result);
        }
        return NO;
    }
}
```


### sqlite3 WAL

- `WAL`的全称是`Write Ahead Logging`，它是很多数据库中用于实现`原子事务`的一种机制，`SQLite`在`3.7.0`版本引入了该特性。
- 在引入`WAL`机制之前，`SQLite`使用`rollback journal`机制实现`原子事务`。

> `rollback journal` VS `WAL`

- `rollback journal`机制：修改数据之前，先对要修改的数据进行`备份`，如果事务成功，就提交修改并删除备份；如果事务失败：就将备份数据拷贝回去，撤销修改；
- `WAL`机制：当修改数据时，并不直接写入数据库，而是写入到另外一个`WAL`文件中；如果事务成功：将会在随后的`某个时间节点`写回到数据库；如果事务失败：`WAL`文件中的记录会被忽略；
    - 同步`WAL`文件和数据库文件的行为称为`checkpoint`，它有`SQLite`自动执行，默认：`WAL`文件累计到`1000页`修改；
    - 也可以通过`SQLITE_API int sqlite3_wal_checkpoint(sqlite3 *db, const char *zDb);`手动执行并重置`WAL`；

> 可以在 [SQLite官方文档](https://www.sqlite.org/pragma.html#pragma_wal_checkpoint) 查阅相关使用介绍：

-  `SQL`语句中使用
    ```SQL
    // journal_mode 模式；
    // 比如：PRAGMA journal_mode = wal;
    PRAGMA journal_mode
    ```
    ```SQL
    PRAGMA wal_checkpoint
    ```
    ```SQL
    PRAGMA wal_autocheckpoint
    ```

- 函数调用
    ```c++
    // 将WAL中的预写日志转移到数据库文件中，并被重置WAL预写日志
    SQLITE_API int sqlite3_wal_checkpoint(
        sqlite3 *db, 
        const char *zDb
    );
    ```

    ```c++
    // 配置 autocheckpoint
    // 每个新的[database connection] 默认开启 auto-checkpoint，默认值：1000
    SQLITE_API int sqlite3_wal_autocheckpoint(
        sqlite3 *db, 
        int N
    );
    ```

    ```objc
    // 注册一个回调函数，在wal模式下，每次数据提交到数据库时都会调用这个回调函数
    SQLITE_API void *sqlite3_wal_hook(
        sqlite3*, 
        int(*)(void *,sqlite3*,const char*,int),
        void*
    );
    ```

> `YYDiskCache` 中的 `SQLite WAL`

```objc
- (BOOL)_dbInitialize {
    NSString *sql = @"pragma journal_mode = wal; pragma synchronous = normal; create table if not exists manifest (key text, filename text, size integer, inline_data blob, modification_time integer, last_access_time integer, extended_data blob, primary key(key)); create index if not exists last_access_time_idx on manifest(last_access_time);";
    return [self _dbExecute:sql];
}
```

```objc
- (void)_dbCheckpoint {
    if (![self _dbCheck]) return;
    // Cause a checkpoint to occur, merge `sqlite-wal` file to `sqlite` file.
    sqlite3_wal_checkpoint(_db, NULL);
}
```
- 在`YYKVStorage.m`中的部分`remove`操作中使用到了`_dbCheckpoint`


# YYDiskCache LRU

> 以 `- (void)trimToCount:(NSUInteger)count;` 为例:

```objc
// YYDiskCache.m
- (void)trimToCount:(NSUInteger)count {
    Lock(); // 加锁
    [self _trimToCount:count]; // 移除操作
    Unlock(); // 解锁
}
```

```objc
// YYDiskCache.m
- (void)_trimToCount:(NSUInteger)countLimit {
    if (countLimit >= INT_MAX) return;
    [_kv removeItemsToFitCount:(int)countLimit];
}
```

- 真正的移除操作其实还是 `_kv`;

```objc
// YYKVStorage.m
- (BOOL)removeItemsToFitCount:(int)maxCount {
    if (maxCount == INT_MAX) return YES;
    if (maxCount <= 0) return [self removeAllItems];
    
    int total = [self _dbGetTotalItemCount];
    if (total < 0) return NO;
    if (total <= maxCount) return YES;
    
    NSArray *items = nil;
    BOOL suc = NO;
    do {
        // ① 定义每次从 SQLite DB 取出的数据量为：16个
        int perCount = 16;
        // ② 从 SQLite DB 取出相应数量的数据
        items = [self _dbGetItemSizeInfoOrderByTimeAscWithLimit:perCount];
        // ③ 对取出的数据进行遍历删除操作，直到符合删减的要求
        for (YYKVStorageItem *item in items) {
            if (total > maxCount) {
                // ③-① 如果是File方式，还需要将File一并删除
                if (item.filename) {
                    [self _fileDeleteWithName:item.filename];
                }
                // ③-② 删除SQLite DB中的数据
                suc = [self _dbDeleteItemWithKey:item.key];
                total--;
            } else {
                break;
            }
            if (!suc) break;
        }
    } while (total > maxCount && items.count > 0 && suc);
    if (suc) [self _dbCheckpoint];
    return suc;
}
```

- ① 定义每次从 SQLite DB 取出的数据量为：16个
- ② 从 SQLite DB 取出相应数量的数据
- ③ 对取出的数据进行遍历删除操作，直到符合删减的要求
    - ③-① 如果是File方式，还需要将File一并删除
    - ③-② 删除SQLite DB中的数据

> 由上可知：LRU 应该在 `② 从 SQLite DB 取出相应数量的数据；` 中有所体现；

```objc
// YYKVStorage.m
- (NSMutableArray *)_dbGetItemSizeInfoOrderByTimeAscWithLimit:(int)count {
    NSString *sql = @"select key, filename, size from manifest order by last_access_time asc limit ?1;";
    sqlite3_stmt *stmt = [self _dbPrepareStmt:sql];
    if (!stmt) return nil;
    sqlite3_bind_int(stmt, 1, count);
    
    NSMutableArray *items = [NSMutableArray new];
    do {
        int result = sqlite3_step(stmt);
        if (result == SQLITE_ROW) {
            char *key = (char *)sqlite3_column_text(stmt, 0);
            char *filename = (char *)sqlite3_column_text(stmt, 1);
            int size = sqlite3_column_int(stmt, 2);
            NSString *keyStr = key ? [NSString stringWithUTF8String:key] : nil;
            if (keyStr) {
                YYKVStorageItem *item = [YYKVStorageItem new];
                item.key = key ? [NSString stringWithUTF8String:key] : nil;
                item.filename = filename ? [NSString stringWithUTF8String:filename] : nil;
                item.size = size;
                [items addObject:item];
            }
        } else if (result == SQLITE_DONE) {
            break;
        } else {
            if (_errorLogsEnabled) NSLog(@"%s line:%d sqlite query error (%d): %s", __FUNCTION__, __LINE__, result, sqlite3_errmsg(_db));
            items = nil;
            break;
        }
    } while (1);
    return items;
}
```

执行的`SQL`语句是：
`select key, filename, size from manifest order by last_access_time asc limit ?1;`

- 按照`last_access_time`升序排列依次取出；
- 同样使用`sqlite3_stmt`执行`SQL`；

> 那么`last_access_time`升序和`LRU`有什么关系呢？

那我们就不得不在提一个AP，以`- (nullable id<NSCoding>)objectForKey:(NSString *)key;`为例：

```objc
// YYDiskCache.m
- (id<NSCoding>)objectForKey:(NSString *)key {
    if (!key) return nil;
    Lock(); // 加锁
    YYKVStorageItem *item = [_kv getItemForKey:key]; // get 操作(这里主要分析)
    Unlock();// 解锁
    if (!item.value) return nil;
    
    id object = nil;
    if (_customUnarchiveBlock) {
        object = _customUnarchiveBlock(item.value);
    } else {
        @try {
            object = [NSKeyedUnarchiver unarchiveObjectWithData:item.value];
        }
        @catch (NSException *exception) {
            // nothing to do...
        }
    }
    if (object && item.extendedData) {
        [YYDiskCache setExtendedData:item.extendedData toObject:object];
    }
    return object;
}
```

- 真正的读取操作其实还是 `_kv`;


```objc
// YYKVStorage.m
- (YYKVStorageItem *)getItemForKey:(NSString *)key {
    if (key.length == 0) return nil;
    YYKVStorageItem *item = [self _dbGetItemWithKey:key excludeInlineData:NO];
    if (item) {
        // 🔔❗️❗️❗️🔔❗️❗️❗️🔔❗️❗️❗️
        // 更新SQLite DB 中本条数据的 AccessTime
        [self _dbUpdateAccessTimeWithKey:key];
        if (item.filename) {
            item.value = [self _fileReadWithName:item.filename];
            if (!item.value) {
                [self _dbDeleteItemWithKey:key];
                item = nil;
            }
        }
    }
    return item;
}
```

```objc
// YYKVStorage.m
- (BOOL)_dbUpdateAccessTimeWithKey:(NSString *)key {
    NSString *sql = @"update manifest set last_access_time = ?1 where key = ?2;";
    sqlite3_stmt *stmt = [self _dbPrepareStmt:sql];
    if (!stmt) return NO;
    sqlite3_bind_int(stmt, 1, (int)time(NULL));
    sqlite3_bind_text(stmt, 2, key.UTF8String, -1, NULL);
    int result = sqlite3_step(stmt);
    if (result != SQLITE_DONE) {
        if (_errorLogsEnabled) NSLog(@"%s line:%d sqlite update error (%d): %s", __FUNCTION__, __LINE__, result, sqlite3_errmsg(_db));
        return NO;
    }
    return YES;
}
```


执行的`SQL`语句是：
`update manifest set last_access_time = ?1 where key = ?2;`

- 更新本条数据的 `last_access_time`；
- 同样使用`sqlite3_stmt`执行`SQL`；


> 至此：YYDiskCache 中关于 LRU 的实现也就明朗了~

## get 操作：
- 每次在读取数据的时候，都会更新数据的`last_access_time`；

## trim 操作
- ① 当我们删减数据时，根据`last_access_time`升序取出`一定数量(每次16个)`的数据；
- ② 对取出的数据分别进行删除操作；
    - 对于`File`，还需要一并将`File`删除；
- ③ 删除过程中，判断是否已经满足删减要求；未满足的话继续从①开始，直到满足删减要求；