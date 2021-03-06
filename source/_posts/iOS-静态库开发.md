---
title: iOS--静态库开发
abbrlink: ebd65253
date: 2015-09-16 10:39:23
tags:
---

##### 概述:

- 1.静态库和动态库的存在形式
   - 静态库：`.a` 和  `.framework`
   - 动态库：`.dylib`  和 `.framework`

- 2.静态库和动态库在使用上的区别
   - 静态库：链接时，静态库会被完整地复制到可执行文件中，被多次使用就有多份`冗余拷贝`（左图所示）
   - 动态库：链接时不复制，程序`运行时`由系统动态加载到内存，供程序调用，系统`只加载一次`，多个程序共用，`节省内存`（右图所示）
![静态库与动态库](http://upload-images.jianshu.io/upload_images/590107-67b569c29fedf09d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
   - `注意`:项目中如果使用了自制的动态库，不能被上传到AppStore

- 3.静态库的使用场合
   - 不公开源代码，不想让他人看到具体实现.

#### 静态库的创建方法

- 1. 新建一个项目(和我们平时的做法一样)

- 2.点击`项目`,添加一个`TARGET`,选择`静态库`(如下图)
![添加项目](http://upload-images.jianshu.io/upload_images/590107-c6ef3596f5612f49.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


![添加静态库](http://upload-images.jianshu.io/upload_images/590107-c0550880a31adedf.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


![设置静态库的名称](http://upload-images.jianshu.io/upload_images/590107-f858357b4d112f2c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

*此时我们看到项目中多出了几个文件*


![系统生成了几个文件](http://upload-images.jianshu.io/upload_images/590107-df411b7ac59b1a4d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


- 2.创建要生成静态库的文件(要在特定的文件夹中哦)
*在`MyLib文件`下自动生成的 `MyLib.h` 和 `MyLib.m` 文件,我们一般不直接使用,此时我们删除即可,这是我们就要在  `MyLib文件`中添加我们要生成静态库的文件*

![新建要生成静态库的文件](http://upload-images.jianshu.io/upload_images/590107-54e573740a559f20.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 3.暴漏静态库的头文件,便于外界使用
![暴漏静态库头文件](http://upload-images.jianshu.io/upload_images/590107-041c89cbedec6000.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 4.编译静态库(默认生成的是Debug下的静态库)
![编译静态库--真机](http://upload-images.jianshu.io/upload_images/590107-47df5e45975ec08c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



![编译静态库--模拟器](http://upload-images.jianshu.io/upload_images/590107-4566ce72084541cc.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


*此时我们可以在Finder中查看生成的静态库文件*

![静态库文件](http://upload-images.jianshu.io/upload_images/590107-5ed1805b12a29ae7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

*注意:编译默认生成的是Debug环境下的静态库文件,且CPU架构仅仅是选中的模拟器(如此是的iPhone6)的CPU架构*,(如何查看静态库文件支持的CPU架构,见下文)


![修改为NO即可支持所有型号的模拟器的CPU架构](http://upload-images.jianshu.io/upload_images/590107-a640af37a03f0871.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

*修改后再次重复编译即可*


- 5.编译静态库(生成的是Release下的静态库)


![修改编译配置为Release](http://upload-images.jianshu.io/upload_images/590107-bacdb24a011c7583.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

*再次编译即可生成Release环境下的静态库*


*此时我们一共生成了4种类型的静态库文件*

![4种类型的静态库文件](http://upload-images.jianshu.io/upload_images/590107-e5411685ca27a397.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



- 6.为开发方便我们有可能还要将模拟和真机的静态库合并
   - 首先利用终端进入静态库所在的文件目录
   - `lipo` `-create` Release-iphoneos/静态库.a     Release-iphonesimulator/静态库.a      `-output`    静态库.a

   - 此时生成的就是就是合并后的静态库文件(即可用在`真机`又可用在`模拟器`上)


- 7.查看静态库支持的CPU架构
   - 首先利用终端进入静态库所在的文件目录
   - `lipo` `-info`  静态库.a

- 8.静态库的引入和使用
   - 如果没有引入静态库,就会出错(如下)
![没有引入静态库直接使用-->报错](http://upload-images.jianshu.io/upload_images/590107-598f13ec129a9827.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

   - 引入静态库
![引入静态库](http://upload-images.jianshu.io/upload_images/590107-749aa7c741ec18ea.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)





