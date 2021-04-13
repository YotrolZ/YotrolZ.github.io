---
title: YYCache源码学习-内存缓存分析
description: >-
  YYMemoryCache 是一个快速的内存缓存，用于存储键值对。API和性能类似于`NSCache`。所有方法都是`线程安全`的；采用`LRU`来移除数据；可配置为当收到`内存警告`或`app进入后台`时自动清除对象；读取操作相关的api的时间复杂度为O(1)。
date: 2019-10-29 13:11:43
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

> 本篇文章我们介绍一下 `YYMemoryCache` 磁盘缓存的实现

# YYMemoryCache 简介

先来看一下官方介绍(可在源码中查阅):
```
`YYMemoryCache`是一种快速的`内存缓存`，用于存储`键值对`。
与NSDictionary不同，key是retain的，而不是copy(必须符合NSCopying协议)的。
API和性能类似于`NSCache`，所有方法都是`线程安全`的。

YYMemoryCache对象与NSCache在以下几个方面有所不同:
- 它使用LRU(最近最少使用)删除对象;NSCache驱逐的方法
是不确定的。
- 可通过cost、count、age进行控制;NSCache的限制并不精确。
- 可配置为当收到内存警告或app进入后台时自动清除对象。

`YYMemoryCache`中读取操作相关的api的时间复杂度O(1)。
```

# YYMemoryCache 源码总览

![YYMemoryCache API](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/YYCache/YYMemoryCache.png) 


# YYMemoryCache 初始化

```objc
@implementation YYMemoryCache {
    pthread_mutex_t _lock;
    _YYLinkedMap *_lru;
    dispatch_queue_t _queue;
}

- (instancetype)init {
    self = super.init;

    // 初始化锁
    pthread_mutex_init(&_lock, NULL);

    // 双向链表结构(下文深入分析)
    _lru = [_YYLinkedMap new];

    // 自定义的一个串行队列
    _queue = dispatch_queue_create("com.ibireme.cache.memory", DISPATCH_QUEUE_SERIAL);
    
    // 缓存极限值
    _countLimit = NSUIntegerMax;
    _costLimit = NSUIntegerMax;
    _ageLimit = DBL_MAX;

    // 自动检查时间间隔；默认：5秒
    // 一个内部计时器，来检查缓存是否到达极限，如果达到极限，就开始删除数据
    _autoTrimInterval = 5.0;

    // 配置是否在内存警告及进入后台时清除数据；默认：开启
    _shouldRemoveAllObjectsOnMemoryWarning = YES;
    _shouldRemoveAllObjectsWhenEnteringBackground = YES;
    
    // 监听了内存警告及进入后台的两个通知
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_appDidReceiveMemoryWarningNotification) name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_appDidEnterBackgroundNotification) name:UIApplicationDidEnterBackgroundNotification object:nil];
    
    // 递归删减数据(和上文的 _autoTrimInterval 配合使用)
    [self _trimRecursively];
    return self;
}
```

# YYMemoryCache 定时探测机制

- `YYMemoryCache` 内部有一个定时任务，用来检查缓存是否到达极限，如果达到极限，就开始删除数据
- 在`YYMemoryCache`初始化的时候，初始化了 `_autoTrimInterval = 5.0;` 即：定时周期默认为5秒。

```objc
// YYMemoryCache.m
- (void)_trimRecursively {
    __weak typeof(self) _self = self;

    // dispatch_after: 5秒后调用
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(_autoTrimInterval * NSEC_PER_SEC)), dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0), ^{
        __strong typeof(_self) self = _self;
        if (!self) return;
        [self _trimInBackground]; // 删减数据的操作
        [self _trimRecursively];  // 递归调用
    });
}

// 删减数据的操作
- (void)_trimInBackground {
    dispatch_async(_queue, ^{
        [self _trimToCost:self->_costLimit];
        [self _trimToCount:self->_countLimit];
        [self _trimToAge:self->_ageLimit];
    });
}
```

`YYMemoryCache`定时探测机制：

- 默认5秒一次探测；`_autoTrimInterval = 5.0;`
- 使用`dispatch_after` + `递归调用` 实现定时探测；
- `dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0)`：低优先级的全局队列


# _YYLinkedMap & _YYLinkedMapNode

`_YYLinkedMap` & `_YYLinkedMapNode`为内部私有类；

```objc
@interface _YYLinkedMap : NSObject {
    @package
    CFMutableDictionaryRef _dic; // do not set object directly
    NSUInteger _totalCost;
    NSUInteger _totalCount;
    _YYLinkedMapNode *_head; // MRU, do not change it directly
    _YYLinkedMapNode *_tail; // LRU, do not change it directly
    BOOL _releaseOnMainThread;
    BOOL _releaseAsynchronously;
}

/// 在头部插入一个node，并更新 total cost
- (void)insertNodeAtHead:(_YYLinkedMapNode *)node;

/// 将node移动到头部(这个节点需要已经存在于dic中)
- (void)bringNodeToHead:(_YYLinkedMapNode *)node;

/// 移除一个node(这个节点需要已经存在于dic中)
- (void)removeNode:(_YYLinkedMapNode *)node;

/// 移除尾部node(如果存在的话)
- (_YYLinkedMapNode *)removeTailNode;

/// 移除全部node，并且在后台队列
- (void)removeAll;

@end
```

```objc
@interface _YYLinkedMapNode : NSObject {
    @package
    __unsafe_unretained _YYLinkedMapNode *_prev; // retained by dic
    __unsafe_unretained _YYLinkedMapNode *_next; // retained by dic
    id _key;
    id _value;
    NSUInteger _cost;
    NSTimeInterval _time;
}
@end
```
- 由于 `_YYLinkedMapNode`对象已经存在于`_dic`内，且被`retain` ,`_YYLinkedMapNode`对象内部的`_prev` 和 `_next` 使用的是`__unsafe_unretained`;

![_YYLinkedMapNode](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/YYCache/YYLinkedMap.jpg)


# YYMemoryCache LRU

从以下`四个`API来讲解 `YYMemoryCache` `LRU`;

```objc
- (void)trimToCount:(NSUInteger)count;  // YYMemoryCache

- (_YYLinkedMapNode *)removeTailNode;   // _YYLinkedMap

- (nullable id)objectForKey:(id)key;    // YYMemoryCache

- (void)bringNodeToHead:(_YYLinkedMapNode *)node; // _YYLinkedMap
```

## trimToCount

- 内部会调用`removeTailNode`, 下文分析

```objc
// YYMemoryCache.m
- (void)trimToCount:(NSUInteger)count {
    if (count == 0) {
        [self removeAllObjects];
        return;
    }
    [self _trimToCount:count];
}
```

```objc
// YYMemoryCache.m
- (void)_trimToCount:(NSUInteger)countLimit {
    BOOL finish = NO;
    pthread_mutex_lock(&_lock);
    if (countLimit == 0) {
        [_lru removeAll];
        finish = YES;
    } else if (_lru->_totalCount <= countLimit) {
        finish = YES;
    }
    pthread_mutex_unlock(&_lock);
    if (finish) return;
    
    NSMutableArray *holder = [NSMutableArray new];
    while (!finish) {
        if (pthread_mutex_trylock(&_lock) == 0) {
            // 如果当前存储的 count 超标 就移除尾部节点， 直到符合要求
            if (_lru->_totalCount > countLimit) {
                _YYLinkedMapNode *node = [_lru removeTailNode];
                if (node) [holder addObject:node];
            } else {
                finish = YES;
            }
            pthread_mutex_unlock(&_lock);
        } else {
            usleep(10 * 1000); //10 ms
        }
    }
    if (holder.count) {
        dispatch_queue_t queue = _lru->_releaseOnMainThread ? dispatch_get_main_queue() : YYMemoryCacheGetReleaseQueue();
        dispatch_async(queue, ^{
            [holder count]; // release in queue
        });
    }
}
```

> 在`iOS 保持界面流畅的技巧`文章中作者提到:
```objc
/*
对象的销毁虽然消耗资源不多，但累积起来也是不容忽视的。
通常当容器类持有大量对象时，其销毁时的资源消耗就非常明显。
同样的，如果对象可以放到后台线程去释放，那就挪到后台线程去。

这里有个小 Tip：
把对象捕获到 block 中，然后扔到后台队列去随便发送个消息以避免编译器警告
就可以让对象在后台线程销毁了。
 */

NSArray *tmp = self.array;
self.array = nil;
dispatch_async(queue, ^{
    [tmp class];
});
```

## removeTailNode

```objc
// YYMemoryCache.m
- (_YYLinkedMapNode *)removeTailNode {
    if (!_tail) return nil;

    // 获取 _tail 尾部节点
    _YYLinkedMapNode *tail = _tail;
    
    // 从CFDictionary中移除
    CFDictionaryRemoveValue(_dic, (__bridge const void *)(_tail->_key));
    
    // 更新容量等信息
    _totalCost -= _tail->_cost;
    _totalCount--;

    // 重新计算 _tail 尾部节点 
    if (_head == _tail) {
        _head = _tail = nil;
    } else {
        _tail = _tail->_prev;
        _tail->_next = nil;
    }

    // 将 _tail 尾部节点返回(更新前的_tail)
    return tail;
}
```

## objectForKey

- 内部会调用`bringNodeToHead`, 下文分析

```objc
// YYMemoryCache.m
- (id)objectForKey:(id)key {
    if (!key) return nil;

    // 锁：保证线程安全
    pthread_mutex_lock(&_lock);
    _YYLinkedMapNode *node = CFDictionaryGetValue(_lru->_dic, (__bridge const void *)(key));
    if (node) {
        // 更新 _time
        node->_time = CACurrentMediaTime();
        // 将节点移动到头部
        [_lru bringNodeToHead:node];
    }
    pthread_mutex_unlock(&_lock);

    // 将数据返回
    return node ? node->_value : nil;
}
```

## bringNodeToHead

```objc
// YYMemoryCache.m
- (void)bringNodeToHead:(_YYLinkedMapNode *)node {
    if (_head == node) return;
    
    if (_tail == node) {
        _tail = node->_prev;
        _tail->_next = nil;
    } else {
        node->_next->_prev = node->_prev;
        node->_prev->_next = node->_next;
    }
    node->_next = _head;
    node->_prev = nil;
    _head->_prev = node;
    _head = node;
}
```


# YYMemoryCache读取操作时间复杂度O(1)

在官方的文档中，我们得知 `YYMemoryCache` 读取操作相关api的时间复杂度为 `O(1)`,那么是如何做到的呢？

```objc
@interface _YYLinkedMap : NSObject {
    @package
    CFMutableDictionaryRef _dic; // do not set object directly
    NSUInteger _totalCost;
    NSUInteger _totalCount;
    _YYLinkedMapNode *_head; // MRU, do not change it directly
    _YYLinkedMapNode *_tail; // LRU, do not change it directly
    BOOL _releaseOnMainThread;
    BOOL _releaseAsynchronously;
}
```

其实就是这个 `CFMutableDictionaryRef` 类型的 `_dic`;
`CFMutableDictionaryRef` 本质是一个 `哈希结构`;

```objc
- (id)objectForKey:(id)key {
    if (!key) return nil;
    pthread_mutex_lock(&_lock);

    // 直接从 CFMutableDictionaryRef 中取出数据
    _YYLinkedMapNode *node = CFDictionaryGetValue(_lru->_dic, (__bridge const void *)(key));
    if (node) {
        node->_time = CACurrentMediaTime();
        [_lru bringNodeToHead:node];
    }
    pthread_mutex_unlock(&_lock);
    return node ? node->_value : nil;
}
```