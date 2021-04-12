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
与NSDictionary不同，键值是保留的，而不是复制的。
API和性能类似于`NSCache`，所有方法都是`线程安全`的。

YYMemoryCache对象与NSCache在以下几个方面有所不同:
- 它使用LRU(最近最少使用)删除对象;NSCache驱逐的方法
是不确定的。
- 可通过成本、计数、使用年限进行控制;NSCache的限制并不精确。
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

    // 锁
    pthread_mutex_init(&_lock, NULL);

    // 双向链表结构
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
    
    // 添加了 内存警告 及 进入后台 的两个通知
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_appDidReceiveMemoryWarningNotification) name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_appDidEnterBackgroundNotification) name:UIApplicationDidEnterBackgroundNotification object:nil];
    
    [self _trimRecursively];
    return self;
}
```
