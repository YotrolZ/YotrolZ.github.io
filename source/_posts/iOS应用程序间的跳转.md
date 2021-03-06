---
title: iOS应用程序间的跳转
comments: true
categories: iOS
abbrlink: 83e2933b
date: 2015-08-13 23:50:06
tags: 
keywords:
description:
---

# 一.从`应用A`直接跳转到`应用B`

- 以应用A(网易)与应用B(微信)说明,`网易`应用跳转至`微信`应用;

<!-- more -->
## 1.设置应用B的`URL Types`中的`URL Schemes`
![设置URL Schemes](http://upload-images.jianshu.io/upload_images/590107-9a1e80511b9ca7b0.png?imageMogr2/auto-orient/strip|imageView2/2/w/1240)

## 2.在应用A中添加一个跳转的按钮,并监听点击
```
- (IBAction)skipToWechat:(id)sender { 

    NSURL *url = [NSURL URLWithString:@"wechat://"];
    // 如果已经安装了这个应用,就跳转
    if ([[UIApplication sharedApplication] canOpenURL:url]) {
        [[UIApplication sharedApplication] openURL:url];
    }
}
```

- 注意点:
 - 一个`URL`是可以没有路径的,但是`协议头`必须的完整;
 - 只要协议头和对应的应用的`URL Schemes`一致,就可知跳转到对应的应用,与URL路径无关


# 二.从 *应用A* 跳转到 *应用B* 的制定的页面

## 1.设置应用B的`URL Types`中的`URL Schemes`,(这里不再赘述)
## 2.在应用A中添加一个跳转的按钮,并监听点击

```objc
// 跳转到微信的朋友圈页面
- (IBAction)skipToSession:(id)sender {

    NSURL *url = [NSURL URLWithString:@"wechat://session"];
    // 如果已经安装了这个应用,就跳转
    if ([[UIApplication sharedApplication] canOpenURL:url]) {
        [[UIApplication sharedApplication] openURL:url];
    }   
}

// 跳转到微信的好友列表页面
- (IBAction)skipToSession:(id)sender {

    NSURL *url = [NSURL URLWithString:@"wechat://timeLine"];
    // 如果已经安装了这个应用,就跳转
    if ([[UIApplication sharedApplication] canOpenURL:url]) {
        [[UIApplication sharedApplication] openURL:url];
    }
}
```
- 备注:`session`和`timeLine `是我们自定义的,到时候根据这两个不同的路径分别进行不同的跳转(见下文)


## 3.在应用B中监听跳转,进行判断,执行不同的跳转
- 在`AppDelegate`中实现下面的方法监听;

```objc
// 这个方法快失效了
//- (BOOL)application:(UIApplication *)application handleOpenURL:(NSURL *)url {
//
//    return YES;
//}

// 如果通过URL打开的这个应用就会调用这个方法,我们在这个方法里面进行判断并跳转到不同的页面
// url就是执行跳转时的url
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation {

    // 将URL转成字符串
    NSString *urlString = url.absoluteString;
    
    // 获取跟控制器
    UINavigationController *nav = (UINavigationController *)application.keyWindow.rootViewController;
    ViewController *vc = [nav.childViewControllers firstObject];
    
    // 每次跳转前必须是在跟控制器(细节)
    [nav popToRootViewControllerAnimated:NO];
    
    if ([urlString containsString:@"timeLine"]) { // 跳转到朋友圈
        // 根据segue标示进行跳转
        [vc performSegueWithIdentifier:@"jump2tiemLine" sender:nil];
    } else if ([urlString containsString:@"session"]) { // 跳转到好友列表
        // 根据segue标示进行跳转
        [vc performSegueWithIdentifier:@"jump2session" sender:nil];
    }
    
    return YES;
}
```
- 注意点:我们通过`URL打开`的应用就会调用这个方法,不管这个应用是在后台还是杀死状态;

# 三.从 *应用B* 反跳转到 *应用A* 
- 细节分析:
 - 1.我们进行反跳的时候,要根据是谁跳转来的,然后跳转到相应的应用;也就是说,我们在进行跳转时要还要携带自身的一些数据,根据这个数据反跳到对应的应用;
 -  2.制作一个规定:我们跳转的时候将自己的`URL Schemes`携带过来,如下:
```objc
@"wechat://timeLine?news"
```
     - 说明:
          `wechat://`:将要跳转到的应用的`URL Schemes`;
          `timeLine`:用于区分跳转到应用的哪个页面;
          `?`:分隔符
          `news`:自身的`URL Schemes`,配置方法与上面的一样
 - 3.获取数据应用跳转前的数据,并反跳回去
    - 1.在应用B的`- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation;`方法中,我们能够获取完整的URL(也就是`wechat://timeLine?news`),所以在跳转前的控制器中添加一个属性,用于保存;
    - 2.重写这个控制器的`- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender;`方法,这样我们能够根据`segue.destinationViewController`获取要跳转到的控制器;
    - 3.在要跳转到的控制器中定义一个属性,用于接受,并截取,拼接成合法的URL(此时的URL已经是跳转前的那个应用的`URL Schemes`),执行跳转即可返回对应的应用

