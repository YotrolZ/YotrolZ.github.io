---
title: RunLoop
abbrlink: 74e21f72
date: 2015-07-14 01:18:52
categories:
  - iOS
tags:
  - RunLoop
---
# 一、RunLoop基本概念

- RunLoop从字面意思上看:
    - 运行循环
    - 跑圈
- RunLoop的基本作用:
    - 保持程序的持续运行
    - 处理APP中各种事件(比如:触摸事件,定时器事件，Selector事件等)
    - 能节省CPU资源，提高程序的性能:该做事的时候就唤醒，没有事情就睡眠
<!-- more -->
- 假如没有了RunLoop:
    - 大家都知道程序的入口是main函数:
    ```objc
    int main(int argc, char * argv[]) {
        @autoreleasepool {
            return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
        }
    }
    ```
    - 如果没有RunLoop，程序就会在main函数执行完毕的时候退出，也正是因为有了RunLoop，导致main函数没有马上退出,保证了程序持续运行;
    - 其实是在`UIApplicationMain`函数内部启动了一个RunLoop;
    - 这个默认启动的RunLoop是跟`主线程`相关联的

- RunLoop内部其实是有一个do-while循环(可以从RunLoop源码中找到),暂且可以理解为下面的代码:

![RunLoop伪代码.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-d09ffc475292408f.png)

# 二、RunLoop对象
- iOS中有2套API来访问和使用RunLoop
    - Foundation框架中的`NSRunLoop`;
    - Core Foundation中的`CFRunLoop`;
- NSRunLoop是基于CFRunLoopRef的一层OC包装，所以要了解RunLoop内部结构，需要多研究CFRunLoopRef层面的API（Core Foundation层面）

# 三、RunLoop与线程
- 每条线程都有`唯一`的一个与之对应的RunLoop对象
- 主线程中的RunLoop由`系统自动创建`，子线程中RunLoop可以通过手动创建
- RunLoop在`线程结束`的时候会被销毁

- 获取RunLoop对象
    - Foundation框架中
    ```objc
    [NSRunLoop currentRunLoop]; // 获得当前线程的RunLoop对象
    [NSRunLoop mainRunLoop]; // 获得主线程的RunLoop对象
    ```
    - Core Foundation框架中
    ```objc
    CFRunLoopGetCurrent(); // 获得当前线程的RunLoop对象
    CFRunLoopGetMain(); // 获得主线程的RunLoop对象
    ```

# 四、RunLoop的结构(为更深入的了解RunLoop我们研究CFRunLoop)

![RunLoop结构.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-50c0f0f61eaa2bca.png)
## 1. CFRunLoopModeRef:

- `CFRunLoopModeRef`代表RunLoop的`运行模式`
- 一个RunLoop中包含N多个Mode，每个Mode中又包含了N多个`Source/Timer/Observer`
- 一个RunLoop在同一时间内只能处在一种运行模式下，这个模式也就是`CurrentMode`
- 一个RunLoop的运行模式可以`切换`，是在当前Mode退出后，下次进入的时候切换
- 系统默认注册了5中Mode:
    - `NSDefaultRunLoopMode`:默认的Mode，通常主线程的RunLoop是在这个Mode下运行
    - `UITrackingRunLoopMode`:界面跟踪Mode，当用户与界面交互的时候会在此Mode下运行
    - `NSRunLoopCommonModes`:这个不是一种真正的Mode，是一个占位用的Mode
    - `UIInitializationRunLoopMode`:程序启动时的Mode，启动完成后就不在此Mode下
    - `GSEventReceiveRunLoopMode`:接受系统事件的内部Mode，一般我们用不到

## 2. CFRunLoopTimerRef

- CFRunLoopTimerRef是基于时间的触发器
- CFRunLoopTimerRef基本上说的就是`NSTimer`，它`受RunLoop Mode的影响`
```objc
// 创建一个定时器(NSDefaultRunLoopMode)
NSTimer *timer = [NSTimer timerWithTimeInterval:2.0 target:self selector:@selector(run) userInfo:nil repeats:YES];
// NSDefaultRunLoopMode:NSTimer只有在默认模式下(NSDefaultRunLoopMode)工作，切换到其他模式不再工作，比如拖拽了界面上的某个控件(会切换成UITrackingRunLoopMode)
[[NSRunLoop mainRunLoop] addTimer:timer forMode:NSDefaultRunLoopMode];
        
// 创建一个定时器(UITrackingRunLoopMode)
NSTimer *timer = [NSTimer timerWithTimeInterval:2.0 target:self selector:@selector(run) userInfo:nil repeats:YES];
// 拖拽UI界面时出发定时器,在默认模式(NSDefaultRunLoopMode)下不工作
[[NSRunLoop mainRunLoop] addTimer:timer forMode:UITrackingRunLoopMode];
       
// 创建一个定时器(NSRunLoopCommonModes)
NSTimer *timer = [NSTimer timerWithTimeInterval:2.0 target:self selector:@selector(run) userInfo:nil repeats:YES];
// NSRunLoopCommonModes仅仅是标记NSTimer在两种模式(UITrackingRunLoopMode/NSDefaultRunLoopMode)下都能运行,但一个RunLoop中同一时间内只能运行一种模式
[[NSRunLoop currentRunLoop] addTimer:timer forMode:NSRunLoopCommonModes];

// 默认已经添加到主线程中RunLoop(mainRunLoop)中(Mode:NSDefaultRunLoopMode)
[NSTimer scheduledTimerWithTimeInterval:2.0 target:self selector:@selector(run) userInfo:nil repeats:YES];
```

- GCD定时器不受RunLoop Mode的影响
```objc
/** 定时器对象 */
@property (nonatomic, strong)dispatch_source_t timer; // 需要一个强引用

NSLog(@"开始");
// 获取队并发队列，定时器的回调函数将会在子线程中执行
// dispatch_queue_t queue = dispatch_get_global_queue(0, 0);
    
// 获取主队列，定时器的回调函数将会在子线程中执行
dispatch_queue_t queue = dispatch_get_main_queue();

self.timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, queue);
    
// 该时间表示从现在开始推迟两秒
dispatch_time_t start = dispatch_time(DISPATCH_TIME_NOW, 2 * NSEC_PER_SEC);
    
// 设置定时器的开始时间，间隔时间
dispatch_source_set_timer(self.timer, start, 1 * NSEC_PER_SEC, 0 * NSEC_PER_SEC);
    dispatch_source_set_event_handler(self.timer, ^{
        NSLog(@"------%@", [NSThread currentThread]);
    });
dispatch_resume(self.timer);

/* 参数说明:
// 设置定时器的一些属性
    dispatch_source_set_timer(dispatch_source_t source, // 定时器对象
                              dispatch_time_t start, // 定时器开始执行的时间
                              uint64_t interval, // 定时器的间隔时间
                              uint64_t leeway // 定时器的精度
                              );

*/
```
## 3. CFRunLoopSourceRef
- 按照官方文档CFRunLoopSourceRef为3类
    - Port-Based Sources:与内核相关
    - Custom Input Sources:与自定义Sources相关
    - Cocoa Perform Selector Sources:与`Performxxxxxx`等方法等相关
- 按照函数调用栈CFRunLoopSourceRef分2类:
    - `Source0`：非基于Port的
    - `Source1`：基于Port的，通过内核和其他线程通信，接收、分发系统事件

## 4. CFRunLoopObserverRef
- `CFRunLoopObserverRef`是RunLoop的`观察者`，可以通过CFRunLoopObserverRef来监听`RunLoop状态`的改变
- CFRunLoopObserverRef监听的状态由以下几种:
    ```objc
    /* Run Loop Observer Activities */
    typedef CF_OPTIONS(CFOptionFlags, CFRunLoopActivity) {
        kCFRunLoopEntry = (1UL << 0),         // 状态值:1,表示进入RunLoop
        kCFRunLoopBeforeTimers = (1UL << 1),  // 状态值:2,表示即将处理NSTimer
        kCFRunLoopBeforeSources = (1UL << 2), // 状态值:4,表示即将处理Sources
        kCFRunLoopBeforeWaiting = (1UL << 5), // 状态值:32,表示即将休眠
        kCFRunLoopAfterWaiting = (1UL << 6),  // 状态值:64,表示从休眠中唤醒
        kCFRunLoopExit = (1UL << 7),          // 状态值:128,表示退出RunLoop
        kCFRunLoopAllActivities = 0x0FFFFFFFU // 表示监听上面所有的状态
    };
    ```

- 如何监听RunLoop的状态:
    - 1.创建CFRunLoopObserverRef
    ```objc
    // 第一个参数用于分配该observer对象的内存
    // 第二个参数用以设置该observer所要关注的的事件，详见回调函数myRunLoopObserver中注释
    // 第三个参数用于标识该observer是在第一次进入run loop时执行还是每次进入run loop处理时均执行
    // 第四个参数用于设置该observer的优先级,一般为0
    // 第五个参数用于设置该observer的回调函数
    // 第六个参数observer的运行状态   
    CFRunLoopObserverRef observer = CFRunLoopObserverCreateWithHandler (CFAllocatorGetDefault(), kCFRunLoopAllActivities, YES, 0, ^(CFRunLoopObserverRef    observer, CFRunLoopActivity activity) {
        NSLog(@"----监听到RunLoop状态发生改变---%zd", activity);
    });
    ```
    - 2.将观察者CFRunLoopObserverRef添加到RunLoop上面
    ```objc
    CFRunLoopAddObserver(CFRunLoopGetCurrent(), observer, kCFRunLoopDefaultMode);
    ```

    - 3.观察者CFRunLoopObserverRef要`手动释放`
    ```objc
    CFRelease(observer);
    ```
    
# 五、RunLoop的处理逻辑
![RunLoop处理逻辑-官方.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-1a9fc347f329b2d4.png)

- 上图显示了线程的`输入源`
    - 1.基于端口的输入源（Port Sources）
    - 2.自定义输入源（Custom Sources）
    - 3.Cocoa执行Selector的源（`performSelectorxxxx`方法）
    - 4.定时源（Timer Sources ）

- 线程针对上面不同的输入源，有不同的`处理机制`
    - 1.handlePort——处理基于`端口`的输入源
    - 2.customSrc——处理用户`自定义`输入源
    - 3.mySelector——处理`Selector`的源
    - 4.timerFired——处理`定时`源


- 非官方文档
![RunLoop处理逻辑-非官方.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-cc0dcab518e185d9.png)

# 六、RunLoop的具体使用
- 1.图片刷新(假如界面要刷新N多图片(渲染)，此时用户拖拽UI控件就会出现卡的效果，我们可以通过RunLoop实现，只在RunLoop默认Mode下下载，也就是拖拽Mode下不刷新图片)
    ```objc
    - (void)viewDidLoad {
        [super viewDidLoad];
        // 只在NSDefaultRunLoopMode下执行(刷新图片)
        [self.myImageView performSelector:@selector(setImage:) withObject:[UIImage imageNamed:@"0"] afterDelay:2.0 inModes:@[NSDefaultRunLoopMode]];    
    }
    ```

- 2.保证一个线程永远不死
    - 方案一:用一个强引用引用住线程(这种方案是不可行的)，原因如下:

    ```objc
    #import "ViewController.h"
    #import "YCThread.h"
    @interface ViewController ()
    
    /*
    思路:用一个强引用线程，当点击屏幕的时候再让他启动，结果是不可行！！！！

    因为，线程执行完内部的任务后就会自动死亡，你如果用一个强引用引用这个线程，
    即使内存还在，但是该线程也已经处于死亡状态(线程状态)，是不能再次启动的，
    如果再次启动一个死亡状态的线程，就会
    报错--reason: '*** -[YCThread start]: attempt(视图) to start the thread again'
    */
    /** 线程对象 */
    @property (nonatomic, strong)YCThread *thread; // 强引用

    @end

    @implementation ViewController

    - (void)viewDidLoad {
        [super viewDidLoad];
        // 创建子线程
        self.thread = [[YCThread alloc] initWithTarget:self selector:@selector(run)     object:nil];
        // 启动子线程
        [self.thread start];
    }

    - (void)run {
        NSLog(@"----------");
    }

    - (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
        // 点击屏幕再次启动线程
        [self.thread start];
    }

    @end
    ```

    - 方案二:(死循环+RunLoop)，不建议此做法，不是太好

    ```objc
    #import "ViewController.h"

    @interface ViewController ()
    /** 线程对象 */
    @property (nonatomic, strong)NSThread *thread;
    @end

    @implementation ViewController

    - (void)viewDidLoad {
        [super viewDidLoad];

        // 创建子线程
        self.thread = [[NSThread alloc] initWithTarget:self selector:@selector(run)     object:nil];

        [self.thread start];
    }

    - (void)run {

        NSLog(@"run--%@", [NSThread currentThread]);

        // 利用死循环(不建议此做法)
        while (1) {
            [[NSRunLoop currentRunLoop] run];
        }
    }

    - (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {

        [self performSelector:@selector(test) onThread:self.thread withObject:nil   waitUntilDone:YES modes:@[NSDefaultRunLoopMode]];
    }
    - (void)test {

        NSLog(@"test--%@", [NSThread currentThread]);
    }

    @end
    ```

    - 方案三:（子线程中加入RunLoop+RunLoop源）建议采用此方案
        - 备注:RunLoop源:`Port`、`Sources0/Sources1`、`Timer`

    ```objc
    #import "ViewController.h"
    /*
    思路:为了保证线程不死，我们考虑在子线程中加入RunLoop，
        但是由于RunLoop中没有没有源，就会自动退出RunLoop，
        所以我们要为子线程添加一个RunLoop，
        并且为这个RunLoop添加源(保证RunLoop不退出)
    */
    @interface ViewController ()
    
    /** 线程对象 */
    @property (nonatomic, strong)NSThread *thread;
    
    @end
    
    @implementation ViewController
    
    - (void)viewDidLoad {
        [super viewDidLoad];
        
        // 创建子线程
        self.thread = [[NSThread alloc] initWithTarget:self selector:@selector(run)        object:nil];
    
        //启动子线程
        [self.thread start];
        
    }
    
    - (void)run {
    
        NSLog(@"run--%@", [NSThread currentThread]); // 子线程
        
        // 给子线程添加一个RunLoop，并且加入源
        [[NSRunLoop currentRunLoop] addPort:[NSPort port] forMode:NSDefaultRunLoopMode];
        // 启动RunLoop
        [[NSRunLoop currentRunLoop] run];
        
        NSLog(@"------------"); // RunLoop启动，这句没有执行的机会
    }
    
    - (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
    
        // 在子线程中调用test方法，如果子线程还在就能够调用成功
        [self performSelector:@selector(test) onThread:self.thread withObject:nil      waitUntilDone:YES modes:@[NSDefaultRunLoopMode]];
    }
    
    - (void)test {
        NSLog(@"test--%@", [NSThread currentThread]); // 子线程
    }
    
    @end
    ```
 -  主线程之所以没有退出，就是因为主线程内部自动开启了一个RunLoop.