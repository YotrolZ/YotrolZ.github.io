---
title: self和super关键字
abbrlink: a1b1e2bc
date: 2019-02-25 17:41:23
tags:
---


```objc
@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    NSLog(@"self:%@", NSStringFromClass([self class]));
    NSLog(@"super:%@", NSStringFromClass([super class]));
}

@end

/* 打印结果：
self:ViewController
super:ViewController
*/
```

<!-- more -->

> 分析

```shell
xcrun -sdk iphoneos clang -arch arm64 -rewrite-objc ViewController.m -o ViewController.cpp
```

```objc
// 核心代码如下

// NSStringFromClass([self class])
NSStringFromClass(
  objc_msgSend(
    (id)self, 
    sel_registerName("class")
  )
)

// NSStringFromClass([super class])
NSStringFromClass(
  objc_msgSendSuper(
    {
      (id)self, 
      (id)class_getSuperclass(objc_getClass("ViewController"))
    }, 
    sel_registerName("class")
  )
)
```

看一下`objc_msgSend`的定义：

## [objc_msgSend](https://developer.apple.com/documentation/objectivec/1456712-objc_msgsend)
- Sends a message with a simple return value to an instance of a class.
- Declaration
  ```objc
  void objc_msgSend(void);
  ```
- Parameters
  - self
    ```
    A pointer that points to the instance of the class that is to receive the message.
    译：指向要接收消息的类的实例的指针。
    ```
  - op
    ```
    The selector of the method that handles the message.
    译：处理消息的方法的选择器。
    ```


  - ...
    ```
    A variable argument list containing the arguments to the method.
    译：包含该方法参数的可变参数列表。
    ```

- Return Value
  ```
  The return value of the method.
  译：方法的返回值。
  ```


## [objc_msgSendSuper](https://developer.apple.com/documentation/objectivec/1456716-objc_msgsendsuper)
- Sends a message with a simple return value to the superclass of an instance of a class.
- Declaration
  ```objc
  void objc_msgSendSuper(void);
  ```
- Parameters
  - self
    ```
    A pointer to an objc_super data structure. Pass values identifying the context the message was sent to, including the instance of the class that is to receive the message and the superclass at which to start searching for the method implementation.
    译：指向结构体objc_super的指针。传递用于标识消息发送到的上下文的值，包括将接收消息的类的实例以及从其开始搜索方法实现的父类。
    ```
  - op
    ```
    A pointer of type SEL. Pass the selector of the method that will handle the message.
    译：类型的指针SEL。传递将处理消息的方法的选择器。
    ```


  - ...
    ```
    A variable argument list containing the arguments to the method.
    译：包含该方法参数的可变参数列表。
    ```

- Return Value
  ```
  The return value of the method identified by op.
  译：由标识的方法的返回值op。
  ```


所以核心代码也就是如下：

```objc
// 核心代码如下

// NSStringFromClass([self class])
NSStringFromClass(
  objc_msgSend(
    (id)self, // 指向要接收消息的类的实例的指针
    sel_registerName("class")
  )
)

// NSStringFromClass([super class])
NSStringFromClass(
  objc_msgSendSuper(
    {
      (id)self, // 指向要接收消息的类的实例的指针
      (id)class_getSuperclass(objc_getClass("ViewController"))
    }, 
    sel_registerName("class")
  )
)
```

由于指向要接收消息的类的实例的指针都是`self`,所以打印都是`ViewController`

区别：

`[self class]` 从`当前类`开始找`class`方法

`[super class]` 从`当前类的父类`开始找`class`方法

