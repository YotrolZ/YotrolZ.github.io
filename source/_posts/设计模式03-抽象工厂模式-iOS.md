---
title: 设计模式03--抽象工厂模式(iOS)
abbrlink: aea66cc7
date: 2017-12-25 10:57:17
tags:
---


> **0、序**
- 在上一篇文章[《工厂方法模式》](http://www.jianshu.com/p/ec97eb083fe1)中，我们定义了奥迪工厂`AudiFactory` 生产出来的就是`奥迪汽车`和 奔驰工厂`BenzFactory`生产出来的就是`奔驰汽车`，但是随着其发展，奥迪工厂不仅仅生产一种车了，而是生产种种系列车型，比如有SUV系列产品与MPV系列产品，那么此时我们的`AudiFactory` 就不能满足需求了，那么该怎么办呢？
- `抽象工厂模式`正好能解决上面的问题，让我们一起来看看抽象工厂。
- 在之前我们先记住上面的一个词`系列产品`；

> **1、抽象工厂模式简述**
- 对一组具有`相同主题`的工厂进行封装
   - 以上面的汽车为例，在抽象工厂模式中，会有SUV工厂和MPV工厂，还有一个大的抽象工厂，里面涵盖了SUV工厂和MPV工厂所有能做的事情。
  - 上面所说的SUV工厂、MPV工厂其实都是可以生产一系列产品的(SUV汽车或者MPV汽车)，也就是`产品族`的概念。而在工厂方法模式中，其工厂生产出来的产品是属于同一个`产品等级`(比如：不同厂商生产的汽车-奥迪汽车和奔驰汽车)。

  - ![相图](http://upload-images.jianshu.io/upload_images/590107-302923e38efaae11.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **2、抽象工厂模式角色划分**
- **抽象工厂**
   - 抽象类，内部提供了所有工厂的接口

- **具体工厂**
  - 具体工厂：可生产所有的系列产品(`产品族`)；

- **产品系列A**
  - 抽象产品A：内部提供了A系列产品的共有功能；
  - 具体产品A：A系列具体的单个产品;
  - *注：当然，还有A系列的其他的产品，它们属于同一个`产品等级`*;

- **产品系列B**
  - 抽象产品B：内部提供了B系列产品的共有功能；
  - 具体产品B：B系列具体的单个产品；
  - ***注**：当然，还有B系列的其他的产品，它们属于同一个`产品等级`*;

> **3、抽象工厂模式UML类图**
- ![抽象工厂模式](http://upload-images.jianshu.io/upload_images/590107-304930132fb19d52.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **4、抽象工厂模式示意代码**
- **抽象工厂: `YCarAbsFactory`**
  - 内部提供了所有工厂的接口
  ```
  @protocol YCarAbsFactory <NSObject>
  + (id<YSuvCar>)creatSuvCar; // 创建SUV系列的车
  + (id<YMpvCar>)creatMpvCar; // 创建MPV系列的车
  @end
  ```

- **具体工厂**
  - 具体工厂1：`YAudiCarFactory`：可生产所有的系列产品(`产品族`)；
  ```
  @implementation YAudiCarFactory
  + (id<YSuvCar>)creatSuvCar { 
      return [[YAudiSuvCar alloc] init]; // 创建具体的奥迪SUV
  }
  + (id<YMpvCar>)creatMpvCar {
      return [[YAudiMpvCar alloc] init]; // 创建具体的奥迪MPV
  }
  @end
  ```
  - 具体工厂2：`YBenzCarFactory`：可生产所有的系列产品(`产品族`)；

  ```
  @implementation YBenzCarFactory
  + (id<YSuvCar>)creatSuvCar {
      return [[YBenzSuvCar alloc] init];  // 创建具体的奔驰SUV
  }
  + (id<YMpvCar>)creatMpvCar {
      return [[YBenzMpvCar alloc] init]; // 创建具体的奔驰MPV
  }
  @end
  ```
  - ***补充：**可能还会有一个具体工厂3，比如：宝马工厂*，宝马工厂同样能生产SUV的车和MPV的车，并且根据需要在内部实现创建具体的产品逻辑；

- **产品系列A**
  - 抽象产品：`YSuvCar`：内部提供了A系列产品的共有功能；
  ```
  @protocol YSuvCar <NSObject>
  - (void)suvRun;
  @end
  ```
  - 具体产品a1：`YAudiSuvCar`
  ```
  @implementation YAudiSuvCar
  - (void)suvRun {
      NSLog(@"奥迪SUV跑起来了");
  }
  @end
  ```
  - 具体产品a2：`YBenzSuvCar`
  ```
  @implementation YBenzSuvCar
  - (void)suvRun {
      NSLog(@"奔驰SUV跑起来了");
  }
  @end
  ```
  - **注**：上面的a1、a2属于同一个**`产品族`**(SUV车系)的不同**`产品等级`**(奥迪、奔驰)；


- **产品系列B**
  - 抽象产品B：`YMpvCar`：内部提供了B系列产品的共有功能；
  ```
  @protocol YMpvCar <NSObject>
  - (void)mpvRun;
  @end
  ```

  - 具体产品b1：`YAudiMpvCar`
  ```
  @implementation YAudiMpvCar
  - (void)mpvRun {
      NSLog(@"奥迪MPV跑起来了");
  }
  @end
  ```
  - 具体产品b2：`YBenzMpvCar`
  ```
  @implementation YBenzMpvCar
  - (void)mpvRun {
      NSLog(@"奔驰MPV跑起来了");
  }
  @end
  ```
  - **注**：上面的b1、b2属于同一个**`产品族`**(MPV车系)的不同**`产品等级`**(奥迪、奔驰)；

- **Client使用**
  ```
  // 奥迪SUV
  id<YSuvCar> audiSuv = [YAudiCarFactory creatSuvCar];
  [audiSuv suvRun];
  // 奥迪MPV
  id<YMpvCar> audiMpv = [YAudiCarFactory creatMpvCar];
  [audiMpv mpvRun];
    
  // 奔驰SUV
  id<YSuvCar> benzSuv = [YBenzCarFactory creatSuvCar];
  [benzSuv suvRun];
  // 奔驰MPV
  id<YMpvCar> benzMpv = [YBenzCarFactory creatMpvCar];
  [benzMpv mpvRun];

  // 运行结果：
  奥迪SUV跑起来了
  奥迪MPV跑起来了
  奔驰SUV跑起来了
  奔驰MPV跑起来了
  ```

> **5、抽象工厂模式与工厂方法模式对比**

|工厂方法模式|抽象工厂模式|
|-|-|
|工厂类一般只有一个方法，创建一种产品|工厂类有多个方法，创建多系列产品|
|只涉及产品等级|涉及产品等级与产品族|
|增加子类即可添加新产品|必须修改父类接口才能添加新产品|

- [完整Demo](https://github.com/YotrolZ/DesignPatterns-OC)

