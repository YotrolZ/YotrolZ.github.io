---
title: 'UITextField-修改占位文字和光标的颜色,大小'
comments: true
abbrlink: 552ed0af
date: 2015-08-16 13:09:32
categories: iOS
tags: UITextField
keywords:
description:
---
# 一.设置占位文字的颜色
<!-- more -->
## 方法一:利用`富文本`
```objc
/** 手机号输入框 */
@property (weak, nonatomic) IBOutlet UITextField *phoneTextField;

- (void)viewDidLoad {
    [super viewDidLoad];
    
    // 创建一个富文本对象
    NSMutableDictionary *attributes = [NSMutableDictionary dictionary];
    // 设置富文本对象的颜色
    attributes[NSForegroundColorAttributeName] = [UIColor whiteColor];
    // 设置UITextField的占位文字
    self.phoneTextField.attributedPlaceholder = [[NSAttributedString alloc] initWithString:@"手机号" attributes:attributes];
    
}
```

## 方法二:利用`Runtime`获取私有的属性名称,利用`KVC`设置属性
```
// 设置占位文字的颜色为红色(注意下面的'self'代表你要修改占位文字的UITextField控件)
[self setValue:[UIColor redColor] forKeyPath:@"_placeholderLabel.textColor"];
```
- 注意:`_placeholderLabel.textColor`是不可乱写的哦,我们是怎么获取到这个属性的呢?请看下文:

```objc
// 只调用一次(自定义UITextField)
+ (void)initialize {

    [self getIvars];
    
}

// 获取私有变量名称
+ (void)getIvars {
    
    unsigned int count = 0;
    
    Ivar *ivars = class_copyIvarList([UITextField class], &count);
    
    for (int i = 0; i < count; i++) {
        Ivar ivar = ivars[i];
        
        NSLog(@"%s----%s", ivar_getName(ivar), ivar_getTypeEncoding(ivar));
    }
}
```
查看打印,找出可能的属性名称,试试便知;

- 完整代码:自定义的`UITextField`,获取到焦点(编辑状态)的时候是白色,失去焦点(非编辑状态)的时候是灰色:

```objc
#import "YCTextField.h"
#import <objc/runtime.h>

#define YCplaceholderTextColor @"_placeholderLabel.textColor"

@implementation YCTextField

+ (void)initialize {

    [self getIvars];
    
}

// 获取私有变量名称
+ (void)getIvars {
    
    unsigned int count = 0;
    
    Ivar *ivars = class_copyIvarList([UITextField class], &count);
    
    for (int i = 0; i < count; i++) {
        Ivar ivar = ivars[i];
        
        NSLog(@"%s----%s", ivar_getName(ivar), ivar_getTypeEncoding(ivar));
    }
}

- (void)awakeFromNib {

    // 设置光标的颜色
    self.tintColor = self.textColor;
}

// 获取到焦点
- (BOOL)becomeFirstResponder {

    // 利用运行时获取key,设置占位文字的颜色
    [self setValue:self.textColor forKeyPath:YCplaceholderTextColor];
    
    return [super becomeFirstResponder];
}

// 失去焦点
- (BOOL)resignFirstResponder {

    // 利用运行时获取key,设置占位文字的颜色
    [self setValue:[UIColor grayColor] forKeyPath:YCplaceholderTextColor];
    
    return [super resignFirstResponder];
}

@end
```

## 方法三.将占位文字`画`上去(重写`- (void)drawPlaceholderInRect:(CGRect)rect;`)
```objc
- (void)drawPlaceholderInRect:(CGRect)rect {

    [[UIColor orangeColor] set];
    
    [self.placeholder drawInRect:rect withFont:[UIFont systemFontOfSize:20]];
}
```
# 二.设置光标颜色

```objc
// 设置光标的颜色
self.tintColor = [UIColor redColor];
```

# 三.设置占位文字的偏移
- 重写`-(CGRect)placeholderRectForBounds:(CGRect)bounds;`方法
- 可以用来设置光标与占位的间距
```objc
//控制placeHolder的位置，左右缩20
-(CGRect)placeholderRectForBounds:(CGRect)bounds {

    //return CGRectInset(bounds, 20, 0);
    CGRect inset = CGRectMake(bounds.origin.x+50, bounds.origin.y, bounds.size.width -10, bounds.size.height);//更好理解些
    return inset;
}
```
- 扩充:系统还提供了很多类似的方法
   - 重写来重置文字区域
   ```objc
   – textRectForBounds:　 //重写来重置文字区域
   ```
   - 重写来重置文字区域
   ```objc
   – textRectForBounds:　 //重写来重置文字区域
   ```
   - 改变绘文字属性.重写时调用super
   ```objc
   – drawTextInRect: 　   //改变绘文字属性.重写时调用super可以按默认图形属性绘制,若自己完全重写绘制函数，就不用调用super了.
   ```
   - 重写来重置占位符区域
   ```objc
   – placeholderRectForBounds:  //重写来重置占位符区域
   ```
   - 重写改变绘制占位符属性.重写时调用super可以按默认图形属性绘制,若自己完全重写绘制函数，就不用调用
   ```objc
   – drawPlaceholderInRect:　　//重写改变绘制占位符属性.重写时调用super可以按默认图形属性绘制,若自己完全重写绘制函数，就不用调用super了
   ```
   - 重写来重置边缘区域
   ```objc
   – borderRectForBounds:　　//重写来重置边缘区域
   ```
   - 重写来重置编辑区域
   ```objc
   – editingRectForBounds:　　//重写来重置编辑区域
   ```
   - 重写来重置clearButton位置,改变size可能导致button的图片失真
   ```objc
   – clearButtonRectForBounds:　　//重写来重置clearButton位置,改变size可能导致button的图片失真
   ```
   - leftView Bounds
   ```objc
   – leftViewRectForBounds:
   ```
   - rightView Bounds
   ```objc
   – rightViewRectForBounds:
   ```