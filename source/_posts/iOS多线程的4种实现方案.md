---
title: iOS多线程的4种实现方案
abbrlink: c8aae65b
date: 2015-07-11 01:36:38
categories:
  - iOS
tags:
  - 多线程
---
### 一、pthread(很少使用)
#### 简介:
-  一套通用的多线程API
- 使用与Unix、Linux、Window等系统
- 跨平台、可移植
- 使用难度大
<!-- more -->
#### 特点:
- C语言
- 程序员管理线程生命周期

#### 使用方法:

```objc
- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
  
    pthread_t thread;

    NSLog(@"%@", [NSThread currentThread]); // 主线程中执行

    pthread_create(&thread, NULL, run, NULL); // 在子线程中执行演示的操作

}

/** 延时操作 */
void * run(void *param) {

    // 耗时操作
    for (NSInteger i = 0; i < 10000; i++) {
        NSLog(@"%zd", i);
    }

    NSLog(@"%@", [NSThread currentThread]); // 子线程中执行
    return NULL;
}
```

### 二、NSTread(偶尔使用)
#### 简介:
- 使用更加面向对象
- 使用简单，可直接操作线程对象

#### 特点:
- OC语言
- 程序员管理线程生命周期

#### 线程状态:
![线程状态.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-8cc3d69eb7953e7a.png)

#### 常用方法:
 - 创建子线程-方式一

    ```objc
    // 创建一个子线程
    NSThread *thread = [[NSThread alloc] initWithTarget:self selector:@selector(test) object:nil];
    // 设置创建的线程的名字
    [thread setName:@"sonThread"];
    // 开启这个线程
    [thread start];
    ```

 - 创建子线程-方式二

    ```objc
    // 方式二: 创建后无需手动开启，系统会自动开启
    [NSThread detachNewThreadSelector:@selector(test) toTarget:self withObject:nil];
    ```

 - 创建子线程-方式三

    ```objc
    // 方式三:隐式创建并自定开启
    [self performSelectorInBackground:@selector(test) withObject:nil];
    ```

 - 获得当前线程

    ```objc
    NSThread *current = [NSThread currentThread];
    ```
 - 线程的名字

    ```objc
    // 设置线程的名字
    - (void)setName:(NSString *)name;
    // 获取线程的名字
    - (NSString *)name;
    ```

 - 启动线程

    ```objc
    - (void)start;
    // 进入就绪状态 -> 运行状态。当线程任务执行完毕，自动进入死亡状态
    ```

 - 阻塞线程

    ```objc
    + (void)sleepUntilDate:(NSDate *)date;
    + (void)sleepForTimeInterval:(NSTimeInterval)ti;
    // 进入阻塞状态
    ```
 - 强制杀死线程

    ```objc
    + (void)exit;
    // 进入死亡状态
    ```
    - 注意:一旦线程`死亡`(停止),就不能再次开启

#### 线程安全
- 线程安全隐患
![线程安全隐患.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-1ada88cbb6fa0e31.png)

- 解决方式:`互斥锁`
![线程安全解决方式.png](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-09ca2da9132d9856.png)

 - 互斥锁的使用前提：`多条线程`抢夺`同一块资源`
 - 互斥锁的优缺点:
    - 优点：能有效防止因多线程抢夺资源造成的`数据安全`问题
    - 缺点：需要消耗大量的`CPU资源`

 - 相关专业术语：`线程同步`

#### 线程通信
- 在1个线程中执行完特定任务后，转到另1个线程继续执行任务
- 线程通信常用方法

```objc
// 在主线程执行SEL
- (void)performSelectorOnMainThread:(SEL)aSelector withObject:(id)arg waitUntilDone:(BOOL)wait;
// 在指定的thread执行SEL
- (void)performSelector:(SEL)aSelector onThread:(NSThread *)thread withObject:(id)arg waitUntilDone:(BOOL)wait;
```

### 三、GCD(经常使用)
- 简介:
    - 全称是`Grand Central Dispatch`，可译为“牛逼的中枢调度器”
    - 旨在替代NSTread等线程技术
    - 充分利用设备的`多核`
    
- 特点:
    - C语言
    - 系统`自动管理`线程生命周期（创建线程、调度任务、销毁线程）
    
- GCD两个重要概念:`任务`和`队列`
    - 任务：执行什么`操作`(任务)
    - 队列：用来`存放任务`
    
- GCD的使用步骤:
    - 1.`定制`任务
    - 2.将任务`添加`到队列中
    - 注意:任务的取出(执行)，按照队列的`FIFO`原则(`先进先出，后进后出`)
    
- GCD有四个用来`执行任务`的常用函数
    - 同步执行 :只能在`当前线程`中执行任务，不具备开启新线程的能力
      
      ```objc
      dispatch_sync(dispatch_queue_t queue, dispatch_block_t block);
      ```

    - 异步执行:`可以(但不一定)`在新的线程中执行任务，具备`开启新线程`的能力

      ```objc
      dispatch_async(dispatch_queue_t queue, dispatch_block_t block);
      dispatch_barrier_async(dispatch_queue_t queue, dispatch_block_t block);
      dispatch_barrier_sync(dispatch_queue_t queue, dispatch_block_t block);
      ```
    
- 队列的类型:(Serial Dispatch Queue和Concurrent Dispatch Queue)
    - 1.串行队列:让任务一个接着一个地执行（一个任务执行完毕后，再执行下一个任务）
    - 2.并发队列:可以让多个任务并发（同时）执行（自动开启多个线程同时执行任务）
    - `注意`:并发队列的并发功能只有在异步（dispatch_async）函数下才有效
    
- 同步、异步、并发、串行
    - 同步和异步主要影响：`能不能开启新的线程`
        - 同步：只是在`当前线程`中执行任务，不具备开启新线程的能力
        - 异步：`可以（但不是一定）`在`新的线程`中执行任务，具备开启新线程的能力
    - 并发和串行主要影响：任务的执行方式
        - 并发：允许多个任务并发（同时）执行
        - 串行：一个任务执行完毕后，再执行下一个任务

- 队列的创建
    - 并发队列的创建:

      ```objc
      // 创建并发队列
      dispatch_queue_t queue = dispatch_queue_create("com.xxx.queue", DISPATCH_QUEUE_CONCURRENT);
      ```
      - GCD默认已经提供了`全局的并发队列`，供整个应用使用，可以无需手动创建，我们只要获取就可以使用
        
      ```objc
      dispatch_queue_t dispatch_get_global_queue(
            dispatch_queue_priority_t priority, // 队列的优先级
            unsigned long flags); // 此参数暂时无用，用0即可(官方文档)
        
      // 获得全局并发队列
      dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);

      // 全局并发队列的优先级
      define DISPATCH_QUEUE_PRIORITY_HIGH 2 // 高
      define DISPATCH_QUEUE_PRIORITY_DEFAULT 0 // 默认（中）
      define DISPATCH_QUEUE_PRIORITY_LOW (-2) // 低
      define DISPATCH_QUEUE_PRIORITY_BACKGROUND INT16_MIN // 后台
      ```

    - 串行队列的创建:
	    - 1.创建一个串行队列:
        
		```objc
	    dispatch_queue_t queue = dispatch_queue_create("com.YotrolZ", DISPATCH_QUEUE_SERIAL);
	    ```
            - 注意:队列类型传入`NULL`也可以;	
	  
	    - 2.获取系统自带的一种特殊的串行队列-`主队列`
        
        ```objc
	    dispatch_queue_t queue = dispatch_get_main_queue()
        ```

        - 主队列的特点:放在`主队列`中的任务，都是在`主线程`中执行
        
        - 注意点:
            - 在串行队列中使用同步函数添加任务时会出现卡主当前串行队列的现象！！
            - 解释:在串行队列中，任务是一个一个按顺序执行了，当使用同步函数往队列中添加任务时理论上要立即执行改任务，但由于串行队列还没有执行完毕，理论上又轮不到刚添加的任务执行，会出现你等我，我等你的现象
  
- GCD的其他使用:
    - 1.延时执行
    
      ```objc
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
          // 这里协商2秒后要执行的代码
      });
      ```

    - 2.一次性代码(让某段代码在整个程序运行过程中`只运行一次`)
        - 一次性代码函数是`线程安全`的
    
      ```objc
      static dispatch_once_t onceToken;
      dispatch_once(&onceToken, ^{
          // 这里写上只执行1次的代码
      });
      ```

	- 3.快速迭代
        - 注意点:index`顺序不确定`
      ```objc
      dispatch_apply(10, dispatch_get_global_queue(0, 0), ^(size_t index){
          // 执行10次代码
	  });
      ```

	- 4.队列组

      ```objc
      dispatch_group_t group =  dispatch_group_create();
	  dispatch_group_async(group, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          // 执行1个耗时的异步操作
      });
      dispatch_group_async(group, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          // 执行1个耗时的异步操作
      });
      dispatch_group_notify(group, dispatch_get_main_queue(), ^{
          // 等前面的异步操作都执行完毕后，回到主线程执行此操作
      });
      ```

### 四、NSOperation+NSOperationQueue(经常使用)
- 简介:
    - NSOperation基于GCD(底层是GCD),性能肯定也就没有GCD高了
    - 比GCD多了一些更简单的功能
    - 使用更面向对象
- 特点:
    - OC语言
    - 系统`自动管理`线程生命周期

#### NSOperation的使用
- NSOperation是一个`抽象类`，并不具备封装任务的功能，我们应该使用其子类(3种)
- `NSBlockOperation`
    - NSBlockOperation使用方法:

        ```objc
        NSBlockOperation *blockOP = [NSBlockOperation blockOperationWithBlock:^{
          NSLog(@"blockOperation1--%@", [NSThread currentThread]); // 在主线程执行
        }];
        [blockOP addExecutionBlock:^{
          NSLog(@"blockOperation2--%@", [NSThread currentThread]); // 在子线程执行(自动开启线程)
        }];
        [blockOP addExecutionBlock:^{
          NSLog(@"blockOperation3--%@", [NSThread currentThread]); // 又会开启一个新的子线程
        }];
        
        [blockOP start];
        ```

    - NSBlockOperation使用细节:
        - 1.单独使用blockOperation且`任务只有一个`时，不会开启新的线程，在`当前线程`中执行;
        - 2.为blockOperation`再次添加新的任务`(任务数大于1)会开启新的线程，在`子线程`中执行;

- `NSBlockOperation`
    - NSInvocationOperation使用方法:
  
      ```objc
      -(void)invocationOperation {
      	// 创建任务
      NSInvocationOperation *invocationOP = [[NSInvocationOperation alloc] 	initWithTarget:self selector:@selector(run) object:nil];
      	// 开始任务
      	[invocationOP start];
      }
      -(void)run {
      	NSLog(@"invocationOperation--%@", [NSThread currentThread]);
        }
      ```

    - NSInvocationOperation使用细节:
    - 单独使用operation不会开启新的线程，在`当前线程`中执行
  
- `自定义Operation`
    - 步骤1.定义一个子类继承`NSOperation`;
    - 步骤2.实现其`- (void)main;`方法，在main方法中添加要执行的任务操作；

        ```objc
        - (void)main { // 添加要执行的任务操作
            if (self.isCancelled) return;
            for (NSUInteger i = 0; i < 1000; i++) {
                NSLog(@"%zd--%@", i, [NSThread currentThread]);
            }

            if (self.isCancelled) return;
            for (NSUInteger i = 0; i < 1000; i++) {
                NSLog(@"%zd--%@", i, [NSThread currentThread]);
            }
            
            if (self.isCancelled) return;
            for (NSUInteger i = 0; i < 1000; i++) {
                NSLog(@"%zd--%@", i, [NSThread currentThread]);
            }
        }
        ```

    - 自定义Operation使用细节: 
        - 重写Operation的`mian`方法时，官方建议我们及时的判断`isCancelled`，以能够及时的取消一些耗时的操作；

- NSOperation的其他使用
    - 操作的`依赖`和`监听`

      ```objc
      -(void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
        // 创建队列
      NSOperationQueue *queue = [[NSOperationQueue alloc] init];
      // 创建5个任务操作
      NSBlockOperation *op1 = [NSBlockOperation blockOperationWithBlock:^{
          NSLog(@"op1--%@", [NSThread currentThread]);
      }];
      NSBlockOperation *op2 = [NSBlockOperation blockOperationWithBlock:^{
          NSLog(@"op2--%@", [NSThread currentThread]);
      }];
      NSBlockOperation *op3 = [NSBlockOperation blockOperationWithBlock:^{
          NSLog(@"op3--%@", [NSThread currentThread]);
      }];
      NSBlockOperation *op4 = [NSBlockOperation blockOperationWithBlock:^{
          NSLog(@"op4--%@", [NSThread currentThread]);
      }];
      NSBlockOperation *op5 = [NSBlockOperation blockOperationWithBlock:^{
          NSLog(@"op5--%@", [NSThread currentThread]);
      }];
      
      // 操作的监听
      op4.completionBlock = ^{
          // 也是在子线程中执行，但是不一定和器任务操作在一个线程
          NSLog(@"op4完成了--%@", [NSThread currentThread]);
      };
      
      // 设置依赖(可以设置多个，但是不能相互依赖)
      // 这样就保证了op3在op1和op4完成后才执行
      [op3 addDependency:op1];
      [op3 addDependency:op4];
      
      // 将任务操作添加到队列中
      [queue addOperation:op1];
      [queue addOperation:op2];
      [queue addOperation:op3];
      [queue addOperation:op4];
      [queue addOperation:op5];
      }
      ```
    
#### NSOperationQueue的使用
- NSOperationQueue的作用
    - NSOperation可以调用start方法来执行任务，但默认是同步执行的,不一定会开启新的线程
    - 将NSOperation添加到NSOperationQueue（操作队列）中，系统会`自动异步执行`NSOperation中的操作

- 将任务(NSOperation)添加到操作队列(NSOperationQueue0中
    - 方式一:需先创建NSOperation，再添加到NSOperationQUeue中

        ```objc
        -(void)addOperation:(NSOperation *)op;
        ```

    - 方式二:不需先创建NSOperation，直接在添加到NSOperationQueue的时候在block中写上任务代码
        ```objc
        -(void)addOperationWithBlock:(void (^)(void))block;
    	
    	NSOperationQueue *queue = [[NSOperationQueue alloc] init];
    	// 任务1
    	[queue addOperationWithBlock:^{
    		NSLog(@"11--%@", [NSThread currentThread]);	
    		for (NSUInteger i = 0; i < 10; i++) {
    			NSLog(@"%zd", i);
				[NSThread sleepForTimeInterval:1];
    		}
    	}];
    	// 任务2
    	[queue addOperationWithBlock:^{
    		NSLog(@"22--%@", [NSThread currentThread]);
    		for (NSUInteger i = 0; i < 10; i++) {
				NSLog(@"%zd", i);
			}
		}];
		// 任务3
		[queue addOperationWithBlock:^{
			NSLog(@"33--%@", [NSThread currentThread]);
			for (NSUInteger i = 0; i < 10; i++) {
				NSLog(@"%zd", i);
			}
		}];
        ```
    - 备注:添加到NSOperationQueue中的任务系统会`自动异步执行`，不用start方法

- NSOperationQueue的常见属性:
    - 1.最大并发数:同时执行的任务数

      ```objc
      @property NSInteger maxConcurrentOperationCount;
      ```
        - 备注:设置`NSOperationQueue`的`maxConcurrentOperationCount`为`1`时，也就是同时执行一个任务，(`同步执行`)

    - 2.暂停(挂起状态)

      ```objc
      @property (getter=isSuspended) BOOL suspended;
      ```
        - 备注:设置`NSOperationQueue`的`suspended`为`YES`时，会暂停(挂起)队列中的任务，但是如果某个任务已经在执行了，并不会立即暂停这个任务，而是等待这个任务执行完毕后，暂停后面的其他任务;
        - 使用场合:暂停(挂起)这个功能，可以用在(假如正在下载一组图片，用户拖拽了界面控件等，为了保证流畅的用户体验，可以先挂起，等用户拖拽结束，再恢复)的情况下使用
  
- NSOperationQueue取消所有任务:

    ```objc
    -(void)cancelAllOperations;
    ```

    - 备注:NSOperationQueue对象调用`cancelAllOperations`方法时，会`取消队列中的所有任务`，但是如果某个任务已经在执行了，并不会立即取消所有任务，而是等待这个任务执行完毕后，取消所有任务;
    
