---
title: UIWindow
abbrlink: 94fd4f29
date: 2015-08-25 10:38:26
tags:
---


### UIWindow
- 1.`UIWindow`是一种特殊的UIView(继承自UIView)
```
@interface UIWindow : UIView
```
- 2.一个iOS程序之所以能显示到屏幕上，完全是因为它有UIWindow，也就说,`没有UIWindow，就看不见任何UI界面`,

- 3.AppDelegate内部默认有一个UIWindow对象
```
@property (strong, nonatomic) UIWindow *window; // 注意这里是strong
```

- 4.只有一个UIWindow也可以显示

<!-- more -->

![只有UIWindow的情况](http://upload-images.jianshu.io/upload_images/590107-50aa2d50410d9617.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 5.给UIWindow添加一个view---`不能用该做法`

![在window上添加view](http://upload-images.jianshu.io/upload_images/590107-0b2f159d608cb4f2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 6.给UIWindow设置根控制器(会自动将控制器的view添加到UIWindow上)

![给window设置根控制器](http://upload-images.jianshu.io/upload_images/590107-1450d63dc1862631.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


- 7.`addSubView`和`rootViewController`的区别
    - 直接用addSubView,控制器会被释放,控制器就不能处理事件(出现野指针错误)
    - 直接用addSubView,控制器的view不会跟随屏幕旋转而自动旋转。
    - 用rootViewController,控制器不会被释放,而且控制器的view会跟随屏幕旋转而自动旋转
    - 旋转事件->UIApplication ->Window->rootViewController ->旋转控制器的view