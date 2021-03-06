---
title: iOS程序启动过程（生命周期）
categories:
  - iOS
abbrlink: 428e23d5
date: 2015-08-25 10:11:30
tags:
---

### 1.main函数
### 2.UIApplicationMain
```objc
int UIApplicationMain(int argc, char *argv[], NSString *principalClassName, NSString *delegateClassName);
```
- 此函数会根据`principalClassName`创建`UIApplication`对象
- 此函数会根据`delegateClassName`创建一个`delegate`对象
- 并将该`delegate`对象赋值给`UIApplication`对象中的`delegate`属性

<!-- more -->

```objc
UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]))
```

- `principalClassName`传`nil`,默认是`UIApplication`,创建一个 `UIApplication对象`
- `delegateClassName`不能传`nil`,这里传`nil`,意味着`application`没有`代理`,就无法监听系统的事件,系统的事件都没法监听,窗口都不知道什么时候去加载,因为视图都是懒加载的,因此就不会创建窗口,什么东西都没有。
- `argc`,`argv` : ISO C标准main函数的参数,直接传递给`UIApplicationMain`进行相关处理即可



### 3.delegate对象开始监听(处理)系统事件(没有storyboard)，手动执行
- 程序启动完毕的时候,就会调用代理的`application:didFinishLaunchingWithOptions:`方法
- 在`application:didFinishLaunchingWithOptions:`中创建UIWindow
- 创建和设置UIWindow的rootViewController
- 显示窗口

### 4.delegate对象开始监听(处理)系统事件(有storyboard)，系统自动执行
- 根据`info.plist`文件获得最主要的storyboard的文件名，加载最主要的storyboard
- 创建UIWindow
- 创建和设置UIWindow的rootViewController
- 显示窗口

![mian.storyboard的加载过程.png](http://upload-images.jianshu.io/upload_images/590107-5ec9b0d8d673c0c7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 内部实现原理(`由系统自动完成`)：

![main.storyboard内部实现原理.png](http://upload-images.jianshu.io/upload_images/590107-2c09df9846d07cdc.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
