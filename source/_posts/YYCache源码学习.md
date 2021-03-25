---
title: YYCache源码学习
date: '2019-10-19 15:26:28'
abbrlink: ba9af90f
tags:
---



# YYCache API

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

# YYDiskCache 初始化


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
      
      // 根据path从_YYDiskCacheGetGlobal查找是否存在
      YYDiskCache *globalCache = _YYDiskCacheGetGlobal(path);
      // _YYDiskCacheGetGlobal存在的话直接返回，不再创建
      if (globalCache) return globalCache;
      
      // 创建 YYKVStorage
      YYKVStorageType type;
      if (threshold == 0) {
          type = YYKVStorageTypeFile;
      } else if (threshold == NSUIntegerMax) {
          type = YYKVStorageTypeSQLite;
      } else {
          type = YYKVStorageTypeMixed;
      }
      
      YYKVStorage *kv = [[YYKVStorage alloc] initWithPath:path type:type];
      if (!kv) return nil;
      
      _kv = kv;
      _path = path;
      // 使用GCD 信号量 创建了一把锁，用户数据同步
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

      // 存入 _YYDiskCacheSetGlobal
      _YYDiskCacheSetGlobal(self);
      
      [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_appWillBeTerminated) name:UIApplicationWillTerminateNotification object:nil];
      return self;
  }
  ```



# YYMemoryCache 初始化
