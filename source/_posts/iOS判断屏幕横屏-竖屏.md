---
title: iOS判断屏幕横屏/竖屏
categories:
  - iOS
abbrlink: 4eef1362
date: 2015-08-16 13:09:36
tags:
---

- 在屏幕发生翻转的时候会调用一些方法:
```objc
- (void)viewWillLayoutSubviews;
- (void)viewDidLayoutSubviews;
- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id <UIViewControllerTransitionCoordinator>)coordinator
```

- 注意:这些方法都是在`ViewController`里面,在`view`中没有的

<!-- more -->

#### 方法一:
- 使用`- (void)viewWillLayoutSubviews;`方法:

```objc
- (void)viewWillLayoutSubviews {

     [self _shouldRotateToOrientation:(UIDeviceOrientation)[UIApplication sharedApplication].statusBarOrientation];
}

-(void)_shouldRotateToOrientation:(UIDeviceOrientation)orientation {
   if (orientation == UIDeviceOrientationPortrait ||orientation ==
                UIDeviceOrientationPortraitUpsideDown) { // 竖屏
          
    } else { // 横屏

    }
}
```

#### 方法二:
- 使用`- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id <UIViewControllerTransitionCoordinator>)coordinator`
    - `size` : 屏幕翻转后的新的尺寸;
    - `coordinator` : 屏幕翻转过程中的一些信息,比如翻转时间等;

```objc
#pragma mark - 屏幕翻转就会调用
- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator {

    // 记录当前是横屏还是竖屏
    BOOL isLandscape = size.width == kLandscapeWidth;
    
    // 翻转的时间
    CGFloat duration = [coordinator transitionDuration];
    
    [UIView animateWithDuration:duration animations:^{
       
        // 1.设置dockview的frame
        [self.dockView rotateToLandscape:isLandscape];
        
        // 2.屏幕翻转后(设置完dockview的frame)要重新设置contentView的x值
        self.contentView.x = self.dockView.width;
        
    }];
}
```
   - 子控件提供了一个方法`- (void)rotateToLandscape:(BOOL)isLandscape;`根据传入的`isLandscape`参数即可知道当前的屏幕状态,便于设置子控件在不同屏幕状态下的`frame`


