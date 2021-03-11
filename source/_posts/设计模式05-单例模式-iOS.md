---
title: 设计模式05--单例模式(iOS)
abbrlink: 1ba78291
date: 2018-01-05 10:58:45
tags:
---


> **1、单例模式简述**
- 一个类有且仅有`一个实例`，并且自行实例化向整个系统提供。

> **2、单例模式UML类图**
- ![单例模式](http://upload-images.jianshu.io/upload_images/590107-c019777dc26e8a1a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

<!-- more -->

> **3、单例模式示意代码**
-  **`SingletonA`**
```
/*********  SingletonA.h   **********/
@interface YSingletonA : NSObject
+ (instancetype)sharedInstance;
@end

/*********  SingletonA.m   **********/
@implementation YSingletonA

static YSingletonA *_instance = nil;
+ (instancetype)sharedInstance {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _instance = [[[self class] alloc] init];
    });
    return _instance;
}
@end

/*********  使用   **********/
YSingletonA *singleton1 = [YSingletonA sharedInstance];
NSLog(@"%@", singleton1);
YSingletonA *singleton2 = [YSingletonA sharedInstance];
NSLog(@"%@", singleton2);

YSingletonA *singleton3 = [[YSingletonA alloc] init];
NSLog(@"%@", singleton3);
YSingletonA *singleton4 = [[YSingletonA alloc] init];
NSLog(@"%@", singleton4);

YSingletonA *singleton5 = [YSingletonA new];
NSLog(@"%@", singleton5);
YSingletonA *singleton6 = [YSingletonA new];
NSLog(@"%@", singleton6);

/*
 运行结果：
 <YSingletonA: 0x60000000b550>
 <YSingletonA: 0x60000000b550>
 
 <YSingletonA: 0x60c00000bc30>
 <YSingletonA: 0x60400000b440>
 
 <YSingletonA: 0x60400000b450>
 <YSingletonA: 0x60c00000a9f0>

YSingletonA调用sharedInstance方法可以做到多次创建的实例是同一个
但是<无法做到>调用原有的init方法或者new方法创建的实例也是同一个
YSingletonA违背了单例类有且仅有一个实例的定义,或者说做的不够完善
 */
```

- SingletonB
```
/*********  SingletonB.h   **********/
@interface YSingletonB : NSObject <NSCopying, NSMutableCopying>
+ (instancetype)sharedInstance;
@end

/*********  SingletonB.m   **********/
@implementation YSingletonB

static YSingletonB *_instance = nil;
+ (instancetype)sharedInstance {
    return [[self alloc] init];
}

+ (instancetype)allocWithZone:(struct _NSZone *)zone {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _instance = [super allocWithZone:zone];
    });
    return _instance;
}

- (id)copyWithZone:(NSZone *)zone {
    return _instance;
}

- (id)mutableCopyWithZone:(NSZone *)zone {
    return _instance;
}

@end

/*********  使用   **********/
YSingletonB *singleton1 = [YSingletonB sharedInstance];
NSLog(@"%@", singleton1);
YSingletonB *singleton2 = [YSingletonB sharedInstance];
NSLog(@"%@", singleton2);

YSingletonB *singleton3 = [[YSingletonB alloc] init];
NSLog(@"%@", singleton3);
YSingletonB *singleton4 = [[YSingletonB alloc] init];
NSLog(@"%@", singleton4);

YSingletonB *singleton5 = [YSingletonB new];
NSLog(@"%@", singleton5);
YSingletonB *singleton6 = [YSingletonB new];
NSLog(@"%@", singleton6);


YSingletonB *singleton7 = [singleton5 copy];
NSLog(@"%@", singleton7);
YSingletonB *singleton8 = [singleton5 mutableCopy];
NSLog(@"%@", singleton8);

/*
 <YSingletonB: 0x6080000069a0>
 <YSingletonB: 0x6080000069a0>
 
 <YSingletonB: 0x6080000069a0>
 <YSingletonB: 0x6080000069a0>
 
 <YSingletonB: 0x6080000069a0>
 <YSingletonB: 0x6080000069a0>
 
 <YSingletonB: 0x6080000069a0>
 <YSingletonB: 0x6080000069a0>

YSingletonB调用sharedInstance方法，alloc，init方法，new方法，甚至包括copy、mutableCopy方法我们得到的都是用一个实例
 */
```

- [完整Demo](https://github.com/YotrolZ/DesignPatterns-OC)