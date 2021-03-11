---
title: 神奇的IB_DESIGNABLE和IBInspectable(xib中设置圆角)
date: '2015-08-16 16:07'
categories:
  - iOS
abbrlink: aec6074c
tags:
---

- 情景:在很多中情况下我们需要设置`UIView`或者`UIImageView`的圆角以及边框等,我们通常的做法是:
   -  1.代码创建的控件:利用代码设置`cornerRadius`(别忘记设置裁剪哦`masksToBounds = YES`)和`borderWidth`属性;
   - 2.在xib中你还有一种做法就是设置`Key Paht`;(注意:这里虽然设置了我们并不能立即在xib中看到设置后圆角效果,这是本文重点)
![设置Key Paht](http://upload-images.jianshu.io/upload_images/590107-9b78c886c474176c.png?imageMogr2/auto-orient/strip|imageView2/2/w/1240)
   - 3.设置圆形图片的话,还可以画一个圆形图片,详情可以移步[这里](http://www.jianshu.com/p/068d6f493547);

<!-- more -->

- 下面以在xib中设置圆角为例,说明`IB_DESIGNABLE`和`IBInspectable`的神奇之处:

<!-- more -->

#### `IB_DESIGNABLE`  的具体使用方法:
   - `IB_DESIGNABLE`的`宏`的功能就是让XCode`动态渲染`出该类图形化界面;
   - 使用`IB_DESIGNABLE`的方式，把该宏加在自定义类的前面;

- 1.自定义一个`UIview`---`YCCustomView`

```objc
#import <UIKit/UIKit.h>

// 在定义类的前面加上IB_DESIGNABLE宏
IB_DESIGNABLE

@interface YCCustomView : UIView

@end
```

- 2.在xib中拖一个`UIView`,并修改类名为`YCCustomView`
   - 这里还是利用`key Paht`设置圆角,即可`动态刷新`我们的自定义View,效果图如下:
![IB_DESIGNABLE](http://upload-images.jianshu.io/upload_images/590107-327612aea0f1fe33.gif?imageView2/2/w/1240)

   - 说明:别忘记设置view的class为我们自定义的哦

![说明](http://upload-images.jianshu.io/upload_images/590107-93c68ae8e5a256b1.png?imageMogr2/auto-orient/strip|imageView2/2/w/1240)

#### `IBInspectable`  的具体使用方法:
- 我们在上面已经知道了`IB_DESIGNABLE`的使用,我们能立即看到设置的圆角效果(`动态刷新`),但是有一个问题,我们通过设置`Key Path`来设置是不是很麻烦~,下面我们通过一种更加直观的方式来设置,如下:

![默认是没有这些选项的,不信你瞅瞅你的~.~](http://upload-images.jianshu.io/upload_images/590107-d08bab6e9a7ea34d.png?imageMogr2/auto-orient/strip|imageView2/2/w/1240)

废话不多说,直接上代码:
```objc
#import <UIKit/UIKit.h>

IB_DESIGNABLE  // 动态刷新

@interface YCCustomView : UIView

// 注意: 加上IBInspectable就可以可视化显示相关的属性哦
/** 可视化设置边框宽度 */
@property (nonatomic, assign)IBInspectable CGFloat borderWidth;
/** 可视化设置边框颜色 */
@property (nonatomic, strong)IBInspectable UIColor *borderColor;

/** 可视化设置圆角 */
@property (nonatomic, assign)IBInspectable CGFloat cornerRadius;

@end
```

重写set方法,根据可视化设置的值设置相关的属性

```objc
#import "YCCustomView.h"

@implementation YCCustomView

/**
 *  设置边框宽度
 *
 *  @param borderWidth 可视化视图传入的值
 */
- (void)setBorderWidth:(CGFloat)borderWidth {
    
    if (borderWidth < 0) return;

    self.layer.borderWidth = borderWidth;
}

/**
 *  设置边框颜色
 *
 *  @param borderColor 可视化视图传入的值
 */
- (void)setBorderColor:(UIColor *)borderColor {

    self.layer.borderColor = borderColor.CGColor;
}

/**
 *  设置圆角
 *
 *  @param cornerRadius 可视化视图传入的值
 */
- (void)setCornerRadius:(CGFloat)cornerRadius {

    self.layer.cornerRadius = cornerRadius;
    self.layer.masksToBounds = cornerRadius > 0;
}

@end
```

- 效果演示
![IBInspectable](http://upload-images.jianshu.io/upload_images/590107-c7612e1c5332ea3e.gif?imageView2/2/w/1240)
