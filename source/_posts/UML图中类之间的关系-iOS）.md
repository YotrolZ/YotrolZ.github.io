---
title: UML图中类之间的关系(iOS）
abbrlink: c9e7b927
date: 2017-12-12 10:54:26
tags:
---


- 在UML类图中常见的有以下几种关系: `泛化(Generalization)`、`实现(Realization)`、`组合(Composition)`、`聚合(Aggregation)`、`关联(Association)`、`依赖(Dependency)`。
- 各种关系的强弱顺序：
　　泛化 = 实现 > 组合 > 聚合 > 关联 > 依赖

> **1、泛化(Generalization)关系**
- 关系简述:
  - `is-a`关系。
  - `泛化关系`是一种`继承关系`，用于描述父类与子类之间的关系。例如：`学生`属于`人类`，他即有学生的特性也有人类的共性。  

- 关系图形：
  - 带空心三角箭头的实线，箭头指向父类。![泛化关系](http://upload-images.jianshu.io/upload_images/590107-c68df27417e7827f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


> **2、实现(Realization)关系**
- 关系简述
  - 实现关系是一种类与接口的关系，表示类是接口所有特征和行为的实现，在这种关系中，类实现了接口，类中的操作实现了接口中所声明的操作

- 关系图形
  - 带空心三角箭头的虚线，箭头指向接口。![实现关系](http://upload-images.jianshu.io/upload_images/590107-337b381d9b469173.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **3、组合(Composition)关系**
- 关系简述：
  - `contains-a`关系。
  - 整体与部分的关系，但是整体与部分`不可以分开`。
  - 组合关系中部分和整体具有统一的生存期。一旦整体对象不存在，部分对象也将不存在，部分对象与整体对象之间具有`同生共死`的关系。

- 关系图形：
  - 带实心菱形的直线，菱形指向整体。![组合关系](http://upload-images.jianshu.io/upload_images/590107-1a598cc7cdb44f47.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **4、聚合(Aggregation)关系**
- 关系简述：
  - `has-a`关系。
  - 整体和部分的关系，整体与部分`可以分开`。
  - 他们可以具有各自的生命周期。
  

- 关系图形：
  - 带空心菱形的直线，菱形指向整体。![聚合关系](http://upload-images.jianshu.io/upload_images/590107-c924b7fb6b293c3c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **5、关联(Association)关系**
- 关系简述：
  - 一种拥有的关系，它使一个类知道另一个类的属性和方法，通常将一个类的对象作为另一个类的属性。
  - 分为`单向关联`、`双向关联`。
  - 关联有两个端点，在每个端点可以有一个基数，表示这个关联的类可以有几个实例。

- 常见的基数及含义: 
  - `0..1`表示0 或一个实例。
  - `0..*`表示对实例的数目没有限制。
  - `1`表示只能有一个实例。
  - `1..*`表示至少有一个实例。 

- 关系图形：
  - 带普通箭头的实心线，指向被拥有者。
  - 双箭头或不使用箭头表示双向关联。
  - 单箭头表示单向关联。![关联关系](http://upload-images.jianshu.io/upload_images/590107-899052c9a3b28421.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



> **6、依赖(dependency)关系**
- 关系简述：
  - 是一种`使用关系`，表示一个类依赖于另一个类的定义。
  - 依赖关系总是`单向`的 。可以简单的理解，一个类A使用到了另一个类B，而这种使用关系是具有偶然性的、临时性的、非常弱的，但是B类的变化会影响到A类；

- 代码提现：
  - 局部变量、方法中的参数和对静态方法的调用。

- 关系图形：
  - 依赖关系用带普通箭头的虚线表示，由依赖的一方指向被依赖的一方。![依赖关系](http://upload-images.jianshu.io/upload_images/590107-3869b6754bb52a87.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### 组合、聚合、关联、依赖的总结与区别
- 组合关系是关联关系的一种特例，这种关系比聚合更强，也称为强聚合；整体与部分是不可分的，整体的生命周期结束也就意味着部分的生命周期结束；例如：人与人的头和身体；

- 聚合关系也是关联关系的一种特例, 属于强的关联关系；整体与部分之间是可分离的，他们可以具有各自的生命周期。例如：电脑与CPU和键盘；

- 关联关系属于一种强依赖关系，不存在依赖关系的偶然性、关系也不是临时性的，一般是长期性的，而且双方的关系一般是平等的， 而聚合关系中双方的关系是不平等的，即：has-a。 

- 依赖关系是一种使用关系，单向；这种使用关系是具有偶然性的、临时性的、非常弱的。

> SDWebImage的UML类图
 
- github地址：https://github.com/rs/SDWebImage

![SDWebImageClassDiagram.png](http://upload-images.jianshu.io/upload_images/590107-5a656e6c9f082724.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



