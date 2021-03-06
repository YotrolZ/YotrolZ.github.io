---
title: 设计模式01--简单工厂模式(iOS)
abbrlink: 9b4f1d22
date: 2017-12-15 10:55:26
tags:
---


> **1、简单工厂模式简述**

- 简单工厂模式（FACTORY）,通过面向对象的封装，继承和多态来降低程序的耦合度。将一个具体类的实例化交给一个静态工厂方法来执行。

> **2、简单工厂模式角色划分**
- **工厂类**：包含了创建具体类的静态方法，负责生产；
- **抽象产品**：定义简单工厂中要返回的产品；用`抽象类`表示，由于OC中无抽象类的概念，可以使用`协议（Protocol）`来表示；
- **具体产品**：具体生产的产品。是抽象产品的子类(继承自抽象类)，在OC中就是遵守上述`协议（Protocol）`。

> **3、简单工厂模式类图**

- ![简单工厂模式](http://upload-images.jianshu.io/upload_images/590107-be044ef4d46c361d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **4、简单工厂模式示意代码**
- 抽象产品：`YCar`
  ``` 
  @protocol YCar <NSObject>
  - (void)run;
  @end
  ```

- 具体产品：`YAudi`、`YBenz`、`YLandRover`
  - .h文件
  ```
  @interface YAudi : NSObject <YCar>
  @end

  @interface YBenz : NSObject <YCar>
  @end

  @interface YLandRover : NSObject <YCar>
  @end
  ```
  - .m文件
  ``` 
  @implementation YAudi
  - (void)run {
      NSLog(@"奥迪车跑起来了");
  }
  @end

  @implementation YBenz
  - (void)run {
      NSLog(@"奔驰车跑起来了");
  }
  @end

  @implementation YLandRover
  - (void)run {
      NSLog(@"路虎车跑起来了");
  }
  @end
  ```

- 工厂类：`YCarFactory`
  - YCarFactory.h
  ```
  + (id<YCar>)creatCarWithCarType:(YCarType)carType;
  ```
  - YCarFactory.m
  ```
  + (id<YCar>)creatCarWithCarType:(YCarType)carType {
      switch (carType) {
          case YCarTypeAudi:
              return [[YAudi alloc] init];
              break;
          case YCarTypeBenz:
              return [[YBenz alloc] init];
              break;
          case YCarTypeLandRover:
              return [[YLandRover alloc] init];
              break;
            
          default:
              return nil;
              break;
        }
  }
   ```

- Client使用
  ```
  id<YCar> car = [YCarFactory creatCarWithCarType:YCarTypeBenz];
  [car run];

  // 运行结果：奔驰车跑起来了
  ```

> 5、**简单工厂模式总结**
- 优点
  - 工厂类内部含有创建具体产品的逻辑，外界只需要向工厂类请求所需的产品即可，不需要关心产品实现细节；

- 缺点
  - 工厂类内部集中了创建具体产品的逻辑，假如我们需要新添加一种产品，就要修改工厂类，进行参数判断，`无法使用其子类继承进行扩展`。

- [完整Demo](https://github.com/YotrolZ/DesignPatterns-OC)
