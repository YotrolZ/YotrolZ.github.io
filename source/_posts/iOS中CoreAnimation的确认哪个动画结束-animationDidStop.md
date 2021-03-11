---
title: iOS中CoreAnimation的确认哪个动画结束(animationDidStop)
abbrlink: da9fb1fe
date: 2017-03-13 10:52:42
tags:
---


在CoreAnimation中我们可以通过CAAnimation对象的delegate方法 ` - (void)animationDidStop:(CAAnimation *)anim finished:(BOOL)flag `来完成动画结束后的一些操作,但是有时候会出现点问题,比如多个CAAnimation对象的delegate为同一个对象,这样就要区分是哪一个CAAnimation对象,我们可以通过`[xxx.layer animationForKey:@"key"]`来获取到一个CAAnimation对象,然后与` - (void)animationDidStop:(CAAnimation *)anim finished:(BOOL)flag `方法中的`anim `来比较,但是有时候总是不对,这是就要添加如下代码
```  
yourAnimtion.removedOnCompletion = NO;
```
这样就可以通过`[xxx.layer animationForKey:@"key"];`查找到对应key的animation,接下来就可以接着添加你所需的该动画结束后的操作

- 注意上面的方法是 `animationForKey :`

<!-- more -->

解决了上面的问题,不过一个循环引用的问题已可能悄悄发生了......

如果我们给这段动画设置了:
```
yourAnimtion.delegate = self;  
```
同时又让动画结束后不移除:
```  
yourAnimtion.removedOnCompletion = NO;
```

于是……
self持有yourView --> yourView持有yourView.layer --> yourView.layer持有yourAnimtion，yourAnimtion又持有self   ==>  `循环引用`

那么为什么yourAnimtion会持有self 呢?

是因为
```
yourAnimtion.delegate = self;  
```

你肯定会想,delegate不会强引用self的,但是错了....请看下面的官方代码

```
/* The delegate of the animation. This object is retained for the
 * lifetime of the animation object. Defaults to nil. See below for the
 * supported delegate methods. */

@property(nullable, strong) id <CAAnimationDelegate> delegate;
```

上面用的  `strong `   有木有......

解决循环引用的问题

在动画结束的delegate方法中:
```
[yourView.layer removeAllAnimations];
```

或者:
```
[yourView.layer removeAnimationForKey:yourKey];
```





