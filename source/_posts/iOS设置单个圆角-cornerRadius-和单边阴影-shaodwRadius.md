---
title: iOS设置单个圆角(cornerRadius)和单边阴影(shaodwRadius)
abbrlink: 7e500fcd
date: 2019-01-30 11:00:42
tags:
---


- 平时开发时总会有一些特殊的UI效果会比较烦人，比如单个边的圆角，单个边的阴影等等，下面我们使用一种很easy的方式来完成

- 效果如图：
![example](https://upload-images.jianshu.io/upload_images/590107-976fffd316e98cb3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

<!-- more -->

- 使用方式：
- Installation with CocoaPods：
    - `pod 'YCShadowView'`
    -  `#import <YCShadowView/YCShadowView.h>` 
- Manual import：
    - Drag the YCShadowView folder to project
    - `#import "YCShadowView.h"`

- Use
```Objc
YCShadowView *view = [[YCShadowView alloc] initWithFrame:CGRectMake(200, 250, 100, 100)];
view.backgroundColor = [UIColor whiteColor];
[view yc_shaodwRadius:10 shadowColor:[UIColor colorWithWhite:0 alpha:0.5] shadowOffset:CGSizeMake(0, 0) byShadowSide:(YCShadowSideRight)];
[view yc_cornerRadius:10 byRoundingCorners:(UIRectCornerBottomLeft)];
```
- 如有更好的方式来实现或不当之处，留言讨论，感谢~

- 源码见：[github](https://github.com/YotrolZ/YCShadowView)

