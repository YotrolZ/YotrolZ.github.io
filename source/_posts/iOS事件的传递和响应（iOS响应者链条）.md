---
title: iOS事件的传递和响应（iOS响应者链条）
abbrlink: b8556b05
date: 2015-09-01 10:46:54
tags:
---


- iOS中的时间可以分为3大类型:
![iOS中的事件类型](http://upload-images.jianshu.io/upload_images/590107-eb0c16adb01319a4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

<!-- more -->

#### 一 . 响应者对象
   - 在iOS中不是任何对象都能处理事件，只有继承了`UIResponder`的对象才能接收并处理事件。我们称之为`响应者对象`
   - `UIApplication`、`UIViewController`、`UIView`都继承自`UIResponder`，因此它们都是响应者对象，也就能够接收并处理事件(一定要记住上面的这些继承关系哦)
![继承关系图](http://upload-images.jianshu.io/upload_images/590107-a4a9f05f7b29c5b3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

##### UIResponder
- `UIResponder`内部提供了以下`方法`来`处理事件`
- 触摸事件:
```
// 触摸事件
-(void)touchesBegan:(NSSet*)touches withEvent:(UIEvent*)event;
-(void)touchesMoved:(NSSet*)touches withEvent:(UIEvent*)event;
-(void)touchesEnded:(NSSet*)touches withEvent:(UIEvent*)event;
-(void)touchesCancelled:(NSSet*)touches withEvent:(UIEvent*)event;
```

- 加速计事件
```
-(void)motionBegan:(UIEventSubtype)motionwithEvent:(UIEvent*)event;
-(void)motionEnded:(UIEventSubtype)motionwithEvent:(UIEvent*)event;
-(void)motionCancelled:(UIEventSubtype)motionwithEvent:(UIEvent*)event;
```
- 远程控制事件
```
-(void)remoteControlReceivedWithEvent:(UIEvent*)event;
```


##### UITouch
- UITouch的作用
   - 保存着跟手指相关的信息，比如触摸的`位置`、`时间`、`阶段`
   - 常用方法(获取触摸点的位置):
```
-(CGPoint)locationInView:(UIView*)view;
返回值表示触摸在view上的位置
这里返回的位置是针对view的坐标系的（以view的左上角为原点(0,0)）
调用时传入的view参数为nil的话，返回的是触摸点在UIWindow的位置
 - (CGPoint)previousLocationInView:(UIView*)view;
该方法记录了前一个触摸点的位置
```

##### UIEvent
- 作用:
   - `UIEvent`称为事件对象，记录事件产生的`时刻`和`类型`

#### 二 . 事件的产生和传递(重点)

- 1.发生触摸事件后，系统会将该事件加入到一个由UIApplication管理的事件队列中

- 2.`UIApplication`会从`事件队列`中取出`最前面`的事件，并将事件`分发`下去以便`处理`，通常，先发送事件给应用程序的`主窗口`（keyWindow）

- 3.主窗口会在视图层次结构中找到一个`最合适`的视图来处理触摸事件，这也是整个事件处理过程的第一步

- 4.找到合适的视图控件后，就会调用视图控件的`touches方法`来作具体的事件处理(这其实就是`事件的响应`,下面详细介绍)

- 重点:
   - *1.如何找到最合适的控件来处理事件？*
      - 1.自己是否能接收触摸事件？
      - 2.触摸点是否在自己身上？
      - 3.`从后往前`遍历子控件(直属子控件)，重复前面的两个步骤(递归)
      - 4.如果没有符合条件的子控件，那么自己就最适合处理

   - *2.能否接受触摸事件的判断准则:*
      - 1.不接收用户交互   `userInteractionEnabled= NO;`
      - 2.隐藏   `hidden= YES`
      - 3.透明度   `alpha= 0.0~0.01`
   - *3.如果父控件不能接收触摸事件，那么子控件就不可能接收到触摸事件*
   - *4.`UIImageView`的 `userInteractionEnabled `默认就是`NO`，因此 `UIImageView` 以及它的子控件默认是不能接收触摸事件的*

#### 三 . 事件的响应(重点)
- 这里所说的事件的响应其实就是调用`touches方法`
- 找到最合适的视图控件后，就会调用控件的`touches方法`来作具体的事件处理(响应)
   - touchesBegan…
   - touchesMoved…
   - touchedEnded…
- 这些`touches方法`的`默认做法`是将事件顺着响应者链条`向上传递`，将事件交给`上一个响应者`进行处理(响应)
   - 简而言之就是:如果找到了最合适的响应者,但是如果其没有实现`touches方法`,就会调用其上一个响应者对象的`touches方法`

- 响应者链条:由很多响应者(继承了`UIResponder`的对象)链接在一起组合起来的一个链条

- *如何判断当前响应者的上一个响应者是谁呢?*
   - 判断当前是否是控制器的View,如果是控制器的View,那么上一个响应者就是控制器
   - 如果当前不是控制器的view,上一个响应者就是其父控件

- *响应者链条的作用?*
   - 可以让一个触摸事件发生的时候让多个响应者同时响应事件(也就是执行`touches方法`)
   - 做法:在当前响应者的`touches方法`中调用`super`的`touches方法`


![响应者链条.png](http://upload-images.jianshu.io/upload_images/590107-f5823b66fe6a450e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


#### 总结:

###### 事件传递的完整过程:
- 1.事件由上往下传递(由父控件传递给子控件)，找到`最合适的控件`来处理这个事件

- 2.调用最合适控件的touches….方法
   - 如果调用了`[super touches….];` 就会将事件顺着响应者链条往上传递，传递给上一个响应者,此时`两者都能响应事件`

- 3.如果最合适的控件没有实现`touches….方法`,就会将事件顺着响应者链条往上传递，传递给上一个响应者,由上一个响应者来响应事件

- 4.如果依次传递到了`Application`还不能响应,就会丢弃这个事件

###### 简而言之:
1.事件的传递 : 由`UIApplication` --> `UIWindow` --> 递归找到最合适的响应者

2.事件的响应 : 调用最合适的响应者的`touches方法`--> 如果其没有实现,`默认做法`,将事件传递给`上一个响应者`-->找到上一个响应者,调用它的`touches方法`