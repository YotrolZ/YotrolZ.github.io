---
title: 设计模式02--工厂方法模式(iOS)
abbrlink: 5acc72a0
date: 2017-12-20 10:56:14
tags:
---


>  **0、序**
- 在[简单工厂模式](http://www.jianshu.com/p/914cc0695941)中，我们总结了简单工厂模式的优缺点，如下：
  - 优点
    - 工厂类内部含有创建具体产品的逻辑，外界只需要向工厂类请求所需的产品即可，不需要关心产品实现细节；

  - 缺点
    - 工厂类内部集中了创建具体产品的逻辑，假如我们需要新添加一种产品，就要修改工厂类，进行参数判断，`无法使用其子类继承进行扩展`。

所以`工厂方法模式`出现了。

<!-- more -->

> **1、工厂方法模式简述**
- 简而言之就是，将`简单工厂模式`中的`工厂类`继续抽象。

> **2、工厂方法模式角色划分**

- **抽象工厂**
  - 从工厂类中抽象出来一个接口，这个接口只有一个方法，也就是用于`创建抽象产品的工厂方法`，用`抽象类`表示，由于OC中无抽象类的概念，使用`协议（Protocol）`来表示；

- **具体工厂**
  - 负责生产具体的产品；

- **抽象产品**
  - 工厂中要返回的产品，用`抽象类`表示，由于OC中无抽象类的概念，使用`协议（Protocol）`来表示；

- **具体产品**
  - 供外界使用的具体的产品；

> **3、工厂方法模式UML类图**
- ![工厂方法模式](http://upload-images.jianshu.io/upload_images/590107-df1700fe3745c9df.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **4、工厂方法模式示意代码**
- 抽象产品：`YCar`

  ```
  @protocol YCar <NSObject>
  - (void)run;
  @end
  ```

- 具体产品： `YAudi`、`YBenz`
  - .h文件
  ```
  @interface YAudi : NSObject <YCar>
  @end

  @interface YBenz : NSObject <YCar>
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
  ```
- 抽象工厂：`YAbsFactory`
  ```
  @protocol YAbsFactory <NSObject>
  + (id<YCar>)creatCar; 
  @end
  ```
- 具体工厂：`YAudiFactory`、`YBenzFactory`
  - .h文件
  ```
   // Audi汽车工厂
  @interface YAudiFactory : NSObject <YAbsFactory>
  @end

  // Benz汽车工厂
  @interface YBenzFactory : NSObject <YAbsFactory>
  @end
  ```
  - .m文件
  ```
  @implementation YAudiFactory
  + (id<YCar>)creatCar {
    return [[YAudi alloc] init]; // 生产Audi汽车
  }
  @end

  @implementation YBenzFactory
  + (id<YCar>)creatCar {
      return [[YBenz alloc] init]; // 生产Benz汽车
  }
  @end
  ```
- Client使用
  ```
  id<YCar> car1 = [YAudiFactory creatCar];
  [car1 run];
    
  id<YCar> car2 = [YBenzFactory creatCar];
  [car2 run];

  // 运行结果：
  奥迪车跑起来了
  奔驰车跑起来了
  ```

- 扩展：新加的需求一辆保时捷轿车
  - 创建保时捷汽车具体产品类：`YPorsche`，遵守`Ycar`协议；
  - 创建保时捷汽车具体工厂类：`YPorscheFactory`，遵守`YAbsFactory`协议，实现`+ (id<YCar>)creatCar`工厂方法，内部创建一个具体的保时捷汽车(YPorsche实例)；

> **5、工厂方法模式总结**
- 工厂方法模式就是将工厂类抽象出一个接口(抽象工厂类)，接口内只有一个方法，也就是创建`抽象产品`的方法，然后使其子类具体工厂去创建具体的产品；
- 与简单工厂的区别：(需要新添加别的具体产品的场景)
  - 简单工厂模式：需要修改工厂方法，添加参数进行判断；
  - 工厂方法模式：不需要修改工厂方法，只需添加新的具体产品类和生产这个具体产品的具体工厂类；

- [完整Demo](https://github.com/YotrolZ/DesignPatterns-OC)

