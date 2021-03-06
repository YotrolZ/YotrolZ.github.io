---
title: YYCache源码学习
date: '2019-10-19 15:26:28'
abbrlink: ba9af90f
tags:
---

```objc
@interface YYCache : NSObject

@property (copy, readonly) NSString *name;
@property (strong, readonly) YYMemoryCache *memoryCache;
@property (strong, readonly) YYDiskCache *diskCache;

- (nullable instancetype)initWithName:(NSString *)name;
- (nullable instancetype)initWithPath:(NSString *)path NS_DESIGNATED_INITIALIZER;
+ (nullable instancetype)cacheWithName:(NSString *)name;
+ (nullable instancetype)cacheWithPath:(NSString *)path;

- (instancetype)init UNAVAILABLE_ATTRIBUTE;
+ (instancetype)new UNAVAILABLE_ATTRIBUTE;

#pragma mark - Access Methods
// 是否包含某个缓存对象
- (BOOL)containsObjectForKey:(NSString *)key;
- (void)containsObjectForKey:(NSString *)key withBlock:(nullable void(^)(NSString *key, BOOL contains))block;

// 获取缓存对象
- (nullable id<NSCoding>)objectForKey:(NSString *)key;
- (void)objectForKey:(NSString *)key withBlock:(nullable void(^)(NSString *key, id<NSCoding> object))block;

// 保存缓存对象
- (void)setObject:(nullable id<NSCoding>)object forKey:(NSString *)key;
- (void)setObject:(nullable id<NSCoding>)object forKey:(NSString *)key withBlock:(nullable void(^)(void))block;

// 删除某个缓存对象
- (void)removeObjectForKey:(NSString *)key;
- (void)removeObjectForKey:(NSString *)key withBlock:(nullable void(^)(NSString *key))block;

// 删除所有缓存对象
- (void)removeAllObjects;
- (void)removeAllObjectsWithBlock:(void(^)(void))block;
- (void)removeAllObjectsWithProgressBlock:(nullable void(^)(int removedCount, int totalCount))progress
                                 endBlock:(nullable void(^)(BOOL error))end;

@end
```
