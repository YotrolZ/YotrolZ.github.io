---
title: 自定义View的创建、添加、移除执行过程分析
abbrlink: 1e6befc2
date: 2015-06-28 01:18:16
categories:
  - iOS
tags:
---

## 1.创建自定义view的类文件
![创建自定义view的类文件.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-0db614e19b98a250.png)

<!-- more -->
## 2.创建一个xib文件来表述自定义view(也可以通过代码)
- 创建一个xib文件
![创建一个xib文件.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-075576863465d320.png)
- 设置xib文件名(`xib文件名称和类文件保持一致`)
![设置xib文件名.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-7798e6520a5c5581.png)

- 编辑xib文件:(`绑定class、添加子控件`)也就是给自定义的view添加几个子控件这里我们添加了四个系统的控件(label、button、switch、textFiled)
![编辑xib文件.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-dcd32e28daa028c6.png)

- 声明一个`类方法`，快速创建一个自定义的view
![声明类方法.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-8d8a5e08286d150e.png)

- 实现类方法
![实现类方法.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-6607da4a94cfd5ca.png)

- 创建一个自定义view(子控件)并添加到控制器的view(父控件)上面
![创建+添加自定义view.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-adbbb8261b1614d1.png)
 - `问题`：为什么viewDidLoad函数执行完毕后创建的customView对象没有销毁呢？
`答`：当您通过`addSubview:`方法将一个视图作为子视图添加时，父视图会对其进行`保持`操作。

- 从控制器的view(父控件)上面移除自定义的view(子控件)
![移除自定义view.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-f527a4a67f8c851f.png)
 - 调用`removeFromSuperview`方法，会自动将自定义view对象`销毁`.

- 重写自定义view的`dealloc`方法，监听其销毁
![重写自定义view的dealloc.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-fd1a6c46bcff4ef4.png)
 - 官方对`removeFromSuperview`方法的说明：
![removeFromSuperview1.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-1bfd2f2461302175.png)
![removeFromSuperview2.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-7e03b429a2a3d385.png)


## 调用顺序详细说明：
### 1.创建自定义view的时候
- 创建自定义view
![创建自定义view.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-f3b0ec97560dc340.png)

- 重写`didAddSubview:`方法
![重写didAddSubview:.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-d7b6425c74a57758.png)

- 调用顺序
![执行顺序.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-1a0a5abe174d704f.png)
 - 备注： `- didAddSubview:`方法会按照自定义view内部的子控件`循环调用`

### 2.添加自定义view的时候
- 添加自定义view
![添加自定义view.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-21f7c21c4cbbcdaf.png)

- 重写相应的方法，监听其执行顺序
![重写添加时相应的方法.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-6b88aa073ce1092c.png)

- 调用顺序
![调用顺序1.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-8da7ca14234a9577.png)
![调用顺序2.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-fdc65ca27151ae87.png)


### 3.从父控件移除自定义view(子控件)的时候
- 移除自定义view
![移除自定义view.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-06f823fb4be7d51f.png)

- 重写相应的方法，监听其执行顺序
![执行顺序.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-7006dcd41a1a08a5.png)

- 调用顺序
![调用顺序.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-615d271bea0e92df.png)
 - 备注：`- (void)willRemoveSubview:(UIView *)subview;`会按照自定义view内部的子控件`循环调用`























