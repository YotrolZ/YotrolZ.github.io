---
title: iOS开发中设置圆角的几种方法
categories:
  - iOS
abbrlink: 428e23d5
date: 2015-08-16 13:09:36
tags:
---

#### 方式一:设置*layer*相关的属性

<!-- more -->

- 如果这样的设置的view很多,`影响流畅性`

![网友图片](http://upload-images.jianshu.io/upload_images/590107-0a4471b92a90771d.png?imageMogr2/auto-orient/strip|imageView2/2/w/1240)


- 情景一:使用`代码`设置

```objc
UIImageView *imageView = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"friendsRecommentIcon"]];
    
// 设置圆角的大小
imageView.layer.cornerRadius = 5;
[imageView.layer setMasksToBounds:YES];
```

- 情景二:在`xib`中设置
   - 利用`KVC`设置,如下图:


![设置 Key Path](http://upload-images.jianshu.io/upload_images/590107-a87f9b0efd9911c5.png?imageMogr2/auto-orient/strip|imageView2/2/w/1240)


![展示效果](http://upload-images.jianshu.io/upload_images/590107-bcee34d817290cb6.png?imageMogr2/auto-orient/strip|imageView2/2/w/1240)

#### 方式二:画
- 性能高
- 可以给`UIImage`添加一个分类`UIImage+Extension`
- 分类中增加一个返回圆形图片的方法,扩展性强

```objc
#import <UIKit/UIKit.h>

@interface UIImage (Extension)

- (UIImage *)circleImage;

@end
```

```objc
#import "UIImage+Extension.h"

@implementation UIImage (Extension)

- (UIImage *)circleImage {

    // 开始图形上下文
    UIGraphicsBeginImageContextWithOptions(self.size, NO, 0.0);
    
    // 获得图形上下文
    CGContextRef ctx = UIGraphicsGetCurrentContext();
    
    // 设置一个范围
    CGRect rect = CGRectMake(0, 0, self.size.width, self.size.height);
    
    // 根据一个rect创建一个椭圆
    CGContextAddEllipseInRect(ctx, rect);

    // 裁剪
    CGContextClip(ctx);
    
    // 将原照片画到图形上下文
    [self drawInRect:rect];
    
    // 从上下文上获取剪裁后的照片
    UIImage *newImage = UIGraphicsGetImageFromCurrentImageContext();
    
    // 关闭上下文
    UIGraphicsEndImageContext();
    
    return newImage;
}
```
具体使用:
```objc
// 获得的就是一个圆形的图片
UIImage *placeHolder = [[UIImage imageNamed:@"defaultUserIcon"] circleImage];
```
