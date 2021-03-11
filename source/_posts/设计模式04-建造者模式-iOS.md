---
title: 设计模式04--建造者模式(iOS)
abbrlink: 3fd3799f
date: 2018-01-02 10:57:59
tags:
---


> **1、建造者模式简述**
- `建造者模式`(Builder)，又叫`生成器模式`将一个`复杂对象`的构建与它的表示分离，使得`同样的构建过程`可以创建`不同的表示`；
- 如果使用了建造者模式，用户就只需要指定需要构建的类型，而具体的构建细节无需知道。

<!-- more -->

> **2、建造者模式角色划分**

- **抽象建造者：Builder**
  - 为创建一个Product对象的各个部分指定抽象接口；
  - 一般至少会有两个抽象方法，一个用来建造产品，一个是用来返回产品。

- **具体建造者：ConcreteBuilder**
  - 实现抽象建造者的接口，具体的去构建各个部分；

- **具体产品：Product**
  - 就是我们所需要的具体产品；
  - 由多个部件组成；

- **指挥者：Director**
  - 负责调用适当的建造者来构建我们需要的产品；

> **3、建造者模式UML类图**
- ![建造者模式](http://upload-images.jianshu.io/upload_images/590107-2b0ef7a4f4c3410f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **4、建造者模式示意代码**
- **抽象建造者：`YAbsComputerBuilder`**
  ```
  @protocol YAbsComputerBuilder <NSObject>

  /** 构建主板 */
  - (void)buildMainboard;

  /** 构建处理器 */
  - (void)buildCPU;

  /** 构建显卡 */
  - (void)buildGPU;

  /** 构建内存 */
  - (void)buildMemoryDisk;

  /** 构建硬盘 */
  - (void)buildHardDisk;

  /** 构建显示器 */
  - (void)buildDisplay;

  /** 获取构建好的具体产品 */
  - (YComputer *)getBuidResult;

  @end
  ```

- **具体建造者：ConcreteBuilder**
  - 普通电脑建造者：**`YNormalComputerBuilder`**
    ```
    @implementation YNormalComputerBuilder
    {
        YComputer *_computer;
    }

    - (instancetype)init {
        if (self = [super init]) {
            _computer = [[YComputer alloc] init];
        }
        return self;
    }

    /** 构建主板 */
    - (void)buildMainboard {
        _computer.mainboard = @"技嘉 H110M-DS2V主板";
    }

    /** 构建处理器 */
    - (void)buildCPU {
        _computer.cpu = @"intel i3处理器";
    }

    /** 构建显卡 */
    - (void)buildGPU {
        _computer.gpu = @"集成显卡";
    }

    /** 构建内存 */
    - (void)buildMemoryDisk {
        _computer.memoryDisk = @"金士顿 4G内存";
    }

    /** 构建硬盘 */
    - (void)buildHardDisk {
        _computer.hardDisk = @"500G 机械硬盘";
    }

    /** 构建显示器 */
    - (void)buildDisplay {
        _computer.display = @"13存 2K显示器";
    }

    - (YComputer *)getBuidResult {
        return _computer;
    }
    ```

  - 高配电脑建造者：**`YAdvancedComputerBuilder`**
    ```
    @implementation YAdvancedComputerBuilder
    {
        YComputer *_computer;
    }

    - (instancetype)init {
        if (self = [super init]) {
            _computer = [[YComputer alloc] init];
         }
        return self;
    }

    /** 构建主板 */
    - (void)buildMainboard {
        _computer.mainboard = @"技嘉 X299 UD4主板";
    }

    /** 构建处理器 */
    - (void)buildCPU {
        _computer.cpu = @"intel i9处理器";
    }

    /** 构建显卡 */
    - (void)buildGPU {
        _computer.gpu = @"GTX1080显卡";
    }

    /** 构建内存 */
    - (void)buildMemoryDisk {
        _computer.memoryDisk = @"金士顿 16G内存";
    }

    /** 构建硬盘 */
    - (void)buildHardDisk {
        _computer.hardDisk = @"1T 固态硬盘";
    }

    /** 构建显示器 */
    - (void)buildDisplay {
        _computer.display = @"27存 4K显示器";
    }

    - (YComputer *)getBuidResult {
        return _computer;
    }
    ```

- **具体产品：`YComputer`**
  ```
  @interface YComputer : NSObject

  @property (nonatomic, copy)NSString *mainboard;  //!< 主板
  @property (nonatomic, copy)NSString *cpu;        //!< 处理器
  @property (nonatomic, copy)NSString *gpu;        //!< 显卡
  @property (nonatomic, copy)NSString *memoryDisk; //!< 内存
  @property (nonatomic, copy)NSString *hardDisk;   //!< 硬盘
  @property (nonatomic, copy)NSString *display;    //!< 显示器

  /** 用于展示商品 */
  - (void)show;
  @end
  ```
  ```
  @implementation YComputer

  - (void)show {
      NSLog(@"<<<<电脑的配置单>>>>");
      NSLog(@"主板:  %@", self.mainboard);
      NSLog(@"CPU:  %@", self.cpu);
      NSLog(@"GPU:  %@", self.gpu);
      NSLog(@"内存:  %@", self.memoryDisk);
      NSLog(@"硬盘:  %@", self.hardDisk);
      NSLog(@"显示器: %@\n", self.display);
  }
  @end
  ```

- **指挥者：`YComputerDirector`**
  ```
  @interface YComputerDirector : NSObject

  - (void)constructWithBuilder:(id <YAbsComputerBuilder>)builder;

  @end
  ```

- **Client**
  ```
  // 指挥者
  YComputerDirector *director = [[YComputerDirector alloc] init];
    
  // 建造者
  YNormalComputerBuilder *normalBuilder = [[YNormalComputerBuilder alloc] init];
  YAdvancedComputerBuilder *advBuilder = [[YAdvancedComputerBuilder alloc] init];
    
  // <普通电脑>装配、构建
  [director constructWithBuilder:normalBuilder];
  // 具体产品
  YComputer *normalComputer = [normalBuilder getBuidResult];
  // 展示产品
  [normalComputer show];
    
  // <高配电脑>装配、构建
  [director constructWithBuilder:advBuilder];
  // 具体产品
  YComputer *advComputer = [advBuilder getBuidResult];
  // 展示产品
  [advComputer show];

  // 运行结果：
  <<<<电脑配置单>>>>
  主板:  技嘉 H110M-DS2V主板
  CPU:  intel i3处理器
  GPU:  集成显卡
  内存:  金士顿 4G内存
  硬盘:  500G 机械硬盘
  显示器: 13存 2K显示器

  <<<<电脑配置单>>>>
  主板:  技嘉 X299 UD4主板
  CPU:  intel i9处理器
  GPU:  GTX1080显卡
  内存:  金士顿 16G内存
  硬盘:  1T 固态硬盘
  显示器: 27存 4K显示器
  ```


> **5、建造者模式总结**
- 优点：
  - 使用建造者模式可以使客户端不必知道产品内部的构建细节；
  - Builder之间是相互独立的，与其它的Builder无关，便于系统的扩展；

- 与**`工厂模式`**的区别：
  - 建造者模式比工厂模式多了一个指挥者(Direcitor)角色；
  - 意图不同：
    - **工厂模式**：关注的是产品整体；我们需要什么产品，共产就给我我们什么产品；
    - **建造者模式**：关注的是产品组成部分的构建过程；将一个复杂对象的构建与它的表示分离，使得同样的构建过程可以创建不同的表示，而调用者不需要知道这些细节；

   - 产品复杂度不同：
      - **工厂模式**：一般都是单一性质产品；
      - **建造者模式**：复合型产品；它由各个部件组合而成，部件不同造成的产品也截然不同；

- [完整Demo](https://github.com/YotrolZ/DesignPatterns-OC)
  
 
