---
title: iOS中传感器的基本使用
categories:
  - iOS
abbrlink: 1ea19737
date: 2015-08-21 17:16:28
tags:
---

## iOS中常见的传感器

![iOS中常见的传感器](http://upload-images.jianshu.io/upload_images/590107-b80b8936f8277f84.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

<!-- more -->

### 一.距离传感器
- 监听方式:添加`观察者`,监听`通知`
- 通知名称:`UIDeviceProximityStateDidChangeNotification`
- 监听状态:观察者的对应回调方法中,判断`[UIDevice currentDevice].proximityState`
   - 返回  `NO` : 有物品靠近了;
   - 返回  `YES` : 有物品远离了

- 注意:使用前要打开当前设备距离传感器的开关(默认为:NO):
```objc
[UIDevice currentDevice].proximityMonitoringEnabled = YES;
```

- 示例程序:

```objc
- (void)viewDidLoad {
    [super viewDidLoad];
    
    // [UIApplication sharedApplication].proximitySensingEnabled = YES;
    [UIDevice currentDevice].proximityMonitoringEnabled = YES;
    
    // 监听有物品靠近还是离开
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(proximityStateDidChange) name:UIDeviceProximityStateDidChangeNotification object:nil];
}

- (void)proximityStateDidChange
{
    if ([UIDevice currentDevice].proximityState) {
        NSLog(@"有物品靠近");
    } else {
        NSLog(@"有物品离开");
    }
}
```

### 二.加速计(UIAccelerometer)
- 概述:
检测设备在`X/Y/Z轴`上的`受力`情况
![加速计](http://upload-images.jianshu.io/upload_images/590107-98de475675ae93b7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
- 监听方式:设置`代理`

- 使用步骤:(iOS5之前)
   - 获取加速计`单例`对象:
```objc
UIAccelerometer *accelerometer = [UIAccelerometer sharedAccelerometer];
```

   - 设置加速计`代理`对象
```objc
accelerometer.delegate = self;
```

   - 设置`采样间隔` : `updateInterval`
```objc
accelerometer.updateInterval = 0.3;
```

   - 实现代理相关方法,监听加速计的数据
```objc
 - (void)accelerometer:(UIAccelerometer *)accelerometer didAccelerate:(UIAcceleration *)acceleration;
```
    - `UIAcceleration `参数:
```objc
@interface UIAcceleration : NSObject {
    @private
    NSTimeInterval timestamp;
    UIAccelerationValue x, y, z;
}
```

- 示例程序:

```objc
#import "ViewController.h"

@interface ViewController () <UIAccelerometerDelegate>

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    // 1.获取单例对象
    UIAccelerometer *accelerometer = [UIAccelerometer sharedAccelerometer];
    
    // 2.设置代理
    accelerometer.delegate = self;
    
    // 3.设置采样间隔
    accelerometer.updateInterval = 0.3;
}

- (void)accelerometer:(UIAccelerometer *)accelerometer didAccelerate:(UIAcceleration *)acceleration {
    NSLog(@"x:%f y:%f z:%f", acceleration.x, acceleration.y, acceleration.z);
}

@end
```

- 备注:`UIAcceleration`和`UIAccelerometer`在iOS 5.0中已经被弃用。由`Core Motion framework`取代。
  
 - 官方提示信息:
```
UIAcceleration and UIAccelerometer are deprecated as of iOS 5.0. These classes have been replaced by the Core Motion framework.
```

### 三 . Core Motion

- Core Motion获取数据的两种方式:
   - `push` : 实时采集所有数据,采集`频率高`;
   - `pull` : 在有需要的时候,才去采集数据;


###### Core Motion的使用步骤---`push`
- 1.创建运动管理对象
```objc
CMMotionManager*mgr = [[CMMotionManageralloc]init];
```

- 2.判断加速器是否可用(最好判断)
```objc
if(mgr.isAccelerometerAvailable){
    //加速计可用
}
```

- 3.设置采样间隔
```objc
mgr.accelerometerUpdateInterval= 1.0/30.0;// 1秒钟采样30次
```

- 4.开始采样(采样到数据就会调用handler，handler会在queue中执行)
```objc
-(void)startAccelerometerUpdatesToQueue:(NSOperationQueue*)queue withHandler:(CMAccelerometerHandler)handler;
```

- 示例程序:

```objc
#import "ViewController.h"

@interface ViewController () <UIAccelerometerDelegate>

/** 运动管理者 */
@property (nonatomic, strong) CMMotionManager *mgr; // 保证不死

@end

@implementation ViewController

#pragma mark - 懒加载
- (CMMotionManager *)mgr {
    if (_mgr == nil) {
        _mgr = [[CMMotionManager alloc] init];
    }
    return _mgr;
}
- (void)viewDidLoad {
    [super viewDidLoad];

    // 1.判断加速计是否可用
    if (!self.mgr.isAccelerometerAvailable) {
        NSLog(@"加速计不可用");
        return;
    }
    
    // 2.设置采样间隔
    self.mgr.accelerometerUpdateInterval = 0.3;
    
    // 3.开始采样
    [self.mgr startAccelerometerUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMAccelerometerData *accelerometerData, NSError *error) { // 当采样到加速计信息时就会执行
        if (error) return;
        
        // 4.获取加速计信息
        CMAcceleration acceleration = accelerometerData.acceleration;
        NSLog(@"x:%f y:%f z:%f", acceleration.x, acceleration.y, acceleration.z);
    }];
}
@end
```

###### Core Motion的使用步骤---`pull`

- 说明 : `pull`是在需要时获取数据,我们此时以点击了屏幕就获取一次数据为例说明;

- 1.创建运动管理对象
```objc
CMMotionManager*mgr = [[CMMotionManageralloc]init];
```

- 2.判断加速器是否可用(最好判断)
```objc
if(mgr.isAccelerometerAvailable){
    //加速计可用
}
```

- 3.开始采样
```
-(void)startAccelerometerUpdates;
```

- 4.在需要时获取数据
```objc
CMAcceleration acc = mgr.accelerometerData.acceleration;
NSLog(@"%f,%f, %f", acc.x,acc.y,acc.z);
```

- 示例程序:

```objc
#import "ViewController.h"

@interface ViewController () <UIAccelerometerDelegate>

/** 运动管理者 */
@property (nonatomic, strong) CMMotionManager *mgr; // 保证不死

@end

@implementation ViewController

#pragma mark - 懒加载
- (CMMotionManager *)mgr {
    if (_mgr == nil) {
        _mgr = [[CMMotionManager alloc] init];
    }
    return _mgr;
}
- (void)viewDidLoad {
    [super viewDidLoad];

    // 1.判断加速计是否可用
    if (!self.mgr.isAccelerometerAvailable) {
        NSLog(@"加速计不可用");
        return;
    }
    
    // 2.开始采样
    [self.mgr startAccelerometerUpdates];
}
@end

    // 3.数据采样(以点击了屏幕为例说明)
- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
    // 获取加速计信息
    CMAcceleration acceleration = self.mgr.accelerometerData.acceleration;
    NSLog(@"x:%f y:%f z:%f", acceleration.x, acceleration.y, acceleration.z);
}
```

#### 四.磁力计/陀螺仪的使用和上述加速计的使用步骤类似
不同点:
- 1.判断传感器`是否可用`:

   - 加速计:
```objc
@property(readonly, nonatomic, getter=isAccelerometerAvailable) BOOL accelerometerAvailable;
```

   - 陀螺仪:
```objc
@property(readonly, nonatomic, getter=isGyroAvailable) BOOL gyroAvailable;
```

   - 磁力计:
```objc
@property(readonly, nonatomic, getter=isMagnetometerAvailable) BOOL magnetometerAvailable
```


- 2.设置传感器的`采样间隔`:

   - 1.加速计:
```objc
@property(assign, nonatomic) NSTimeInterval accelerometerUpdateInterval;
```

   - 2.陀螺仪:
```objc
@property(assign, nonatomic) NSTimeInterval gyroUpdateInterval;
```

   - 3.磁力计:
```objc
@property(assign, nonatomic) NSTimeInterval magnetometerUpdateInterval
```

- 3.1.`开始采样`的方法--`push`:

   - 1.加速计:
```objc
 - (void)startAccelerometerUpdatesToQueue:(NSOperationQueue *)queue withHandler:(CMAccelerometerHandler)handler;
```

   - 2.陀螺仪:
```objc
 - (void)startGyroUpdatesToQueue:(NSOperationQueue *)queue withHandler:(CMGyroHandler)handler;
```

   - 3.磁力计:
```objc
 - (void)startMagnetometerUpdatesToQueue:(NSOperationQueue *)queue withHandler:(CMMagnetometerHandler)handler;
```

- 3.2.开发采样的方法--`pull`

   - 1.加速计:
```objc
 - (void)startAccelerometerUpdates;
```

   - 2.陀螺仪:
```objc
 - (void)startGyroUpdates;
```

   - 3.磁力计:
```objc
 - (void)startMagnetometerUpdates;
``` 

- 4.1获取采样数据--`push`
   - 在对应的传感器的`开始采样`方法中的`handler`中;

- 4.2.获取采样数据--`pull`
   - 在需要获取的数据地方调用下面的方法:
   - 加速计:
```objc
    CMAcceleration acceleration = self.mgr.accelerometerData.acceleration;
    NSLog(@"x:%f y:%f z:%f", acceleration.x, acceleration.y, acceleration.z);
```

   - 陀螺仪:
```objc
    CMRotationRate rate = self.mgr.gyroData.rotationRate;
    NSLog(@"x:%f y:%f z:%f", rate.x, rate.y, rate.z);
```

#### 五.没事你就,摇一摇
```objc
- (void)motionBegan:(UIEventSubtype)motion withEvent:(UIEvent *)event {
    NSLog(@"开始摇一摇");
}

- (void)motionCancelled:(UIEventSubtype)motion withEvent:(UIEvent *)event {
    NSLog(@"摇一摇被取消");
}

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event {
    NSLog(@"摇一摇停止");
}
```

#### 六. 没事走两步(计步器)

- 1.判断计步器是否可用
```objc
    if (![CMPedometer isStepCountingAvailable]) {
        NSLog(@"计步器不可用");
        return;
    }
```

- 2.创建计步器对象
```objc
CMPedometer *stepCounter = [[CMPedometer alloc] init];
```

- 3.开始记步,并获取采样数据
```objc
    [stepCounter startPedometerUpdatesFromDate:[NSDate date] withHandler:^(CMPedometerData *pedometerData, NSError *error) {
        if (error) return;
        // 4.获取采样数据
        NSLog(@"steps = %@", pedometerData.numberOfSteps);
    }];
```

#### 七.蓝牙
- 简述:
iOS中提供了4个框架用于实现蓝牙连接:
   - 1.`GameKit.framework`
      - 只能用于`iOS设备之间`的连接，多用于游戏（比如五子棋对战）,可以在游戏中增加`对等连接`，又称`对端连接`或`点对点连接` `Peer To Peer`,从iOS7开始过期
   
   - 2.`MultipeerConnectivity.framework`
      - 只能用于`iOS设备之间`的连接，从iOS7开始引入

   - 3.`ExternalAccessory.framework`
      - 可用于`第三方蓝牙设备`交互，但是蓝牙设备必须经过`苹果MFi认证`（国内较少）

   - 4.`CoreBluetooth.framework`（时下热门）
      - 可用于`第三方蓝牙设备`交互，必须要支持蓝牙4.0;
      - 硬件至少是4s，系统至少是iOS6;
      - 蓝牙4.0以`低功耗`著称，一般也叫`BLE`（BluetoothLowEnergy）
      - 目前应用比较多的案例：运动手坏、嵌入式设备、智能家居
