---
title: iOS 引用计数中惊艳的原子操作(二)
description: >-
  在上文《iOS 引用计数中惊艳的原子操作》我们对底层实现进行了剖析，本篇文章我们进行一个案例进行测试
date: 2021-01-22 10:31:26
tags:
---


## 模拟多线程数据竞争

### 测试说明
- 引用计数变量`rc`初始值为`0`
- 开启`多条线程`，分别对引用计数`rc`进行`100000`次的循环`+1`操作，执行`6次`
  - `100000次循环`只是为了适当的增加操作消耗，便于突出数据竞争(是否为原子操作)
  - 我们可以把`100000次循环+1`的操作视为一个整体操作
  - 然后开启`多条线程` `并行`执行6次
  
- 期望结果: `rc = 600000`, 即：这个`100000次循环+1`操作不可分割(原子性)，避免了多线程对`rc`的数据竞争


### 测试工程

```objc

@interface ViewController ()
// uintptr_t 本质就是 unsigned long
@property (nonatomic, assign) uintptr_t rc; // 存放引用计数
@end

@implementation ViewController
- (void)viewDidLoad {
    [super viewDidLoad];
    
    [self test]; // 运行测试
}

- (void)test {
    
    self.rc = 0; // 初始化
    
    // 多线程操作
    dispatch_queue_t queue = dispatch_queue_create("com.rc.test", DISPATCH_QUEUE_CONCURRENT);
    
    for (int i = 0; i < 6; i++) {
        dispatch_async(queue, ^{
            // 我们在这里进行相应的模拟测试
            [self rc_add_x]; //  x: 测试案例编号
        });
    }
}
```


## 案例1： 直接进行操作
### 代码
```objc
- (void)rc_add_1 {
    for(int i = 0; i < 100000; i++) {
        _rc++;
    }
    NSLog(@"%@ --- 当前引用计数：%ld", [NSThread currentThread], (long)self.rc);
}
```

### 运行结果
```objc
<NSThread: 0x283ca03c0>{number = 3, name = (null)} --- 当前引用计数：68046
<NSThread: 0x283cb4a00>{number = 6, name = (null)} --- 当前引用计数：156790
<NSThread: 0x283ca4140>{number = 7, name = (null)} --- 当前引用计数：222358
<NSThread: 0x283ca03c0>{number = 3, name = (null)} --- 当前引用计数：233080
<NSThread: 0x283ce34c0>{number = 4, name = (null)} --- 当前引用计数：261210
<NSThread: 0x283ca9100>{number = 5, name = (null)} --- 当前引用计数：288438
```

### 结果分析

- `rc != 600000`
- 出现了线程间的数据竞争



## 案例2： 使用 ldxr stxr 实现原子操作
- 需要在 `arm64` 设备上运行，原因可以看下面的代码
### 代码
```objc
- (void)rc_add_2 {
    
    uintptr_t old = 0;
    uintptr_t new = 0;
    
    do {
        old = LoadExclusiveASM(&_rc);
        new = old;
        
        for(int i = 0; i < 1000000; i++) {
            new++;
        }
    } while (!StoreExclusiveASM(&_rc, old, new));
}


// Pointer-size register prefix for inline asm
# if __LP64__
#   define p "x"  // true arm64
# else
#   define p "w"  // arm64_32
# endif

/// 下面两个方法 其实就是 objc-object 引用计数操作 中的源码(只是加了一些打印)
static uintptr_t LoadExclusive(uintptr_t *src) {
    uintptr_t result;
    asm("ldxr %" p "0, [%x1]"
        : "=r" (result)
        : "r" (src), "m" (*src));
    return result;
}
static bool StoreExclusive(uintptr_t *dst, uintptr_t oldvalue __unused, uintptr_t value) {
    uint32_t result;
    asm("stxr %w0, %" p "2, [%x3]"
        : "=&r" (result), "=m" (*dst)
        : "r" (value), "r" (dst));

    NSLog(@"%@ --- 引用计数：%ld --- !result: %d", [NSThread currentThread], *dst, !result);

    return !result; // 注意这里的取反操作(源码中就是这样)，stxr指令写入成功时 result 其实是 0
}
```


### 运行结果
```objc
<NSThread: 0x281dd8440>{number = 3, name = (null)} --- 引用计数：0 --- !result: 0
<NSThread: 0x281dd8440>{number = 3, name = (null)} --- 引用计数：0 --- !result: 0
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：0 --- !result: 0
<NSThread: 0x281dd8440>{number = 3, name = (null)} --- 引用计数：0 --- !result: 0
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：0 --- !result: 0
<NSThread: 0x281db7e00>{number = 4, name = (null)} --- 引用计数：0 --- !result: 0
<NSThread: 0x281db6540>{number = 5, name = (null)} --- 引用计数：0 --- !result: 0
<NSThread: 0x281db7e00>{number = 4, name = (null)} --- 引用计数：1000000 --- !result: 1
<NSThread: 0x281dc4040>{number = 8, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281db6540>{number = 5, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dda500>{number = 9, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dda500>{number = 9, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dc4040>{number = 8, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281db6540>{number = 5, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dda500>{number = 9, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281db6540>{number = 5, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dd8440>{number = 3, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281db6540>{number = 5, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dda500>{number = 9, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dc4040>{number = 8, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dd8440>{number = 3, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dda500>{number = 9, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：1000000 --- !result: 0
<NSThread: 0x281dda500>{number = 9, name = (null)} --- 引用计数：2000000 --- !result: 1
<NSThread: 0x281db6540>{number = 5, name = (null)} --- 引用计数：2000000 --- !result: 0
<NSThread: 0x281dd8440>{number = 3, name = (null)} --- 引用计数：2000000 --- !result: 0
<NSThread: 0x281db6540>{number = 5, name = (null)} --- 引用计数：3000000 --- !result: 1
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：3000000 --- !result: 0
<NSThread: 0x281dd8440>{number = 3, name = (null)} --- 引用计数：3000000 --- !result: 0
<NSThread: 0x281dc4040>{number = 8, name = (null)} --- 引用计数：3000000 --- !result: 0
<NSThread: 0x281dd8440>{number = 3, name = (null)} --- 引用计数：4000000 --- !result: 1
<NSThread: 0x281dc4040>{number = 8, name = (null)} --- 引用计数：4000000 --- !result: 0
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：4000000 --- !result: 0
<NSThread: 0x281dc4040>{number = 8, name = (null)} --- 引用计数：4000000 --- !result: 0
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：4000000 --- !result: 0
<NSThread: 0x281dc4040>{number = 8, name = (null)} --- 引用计数：4000000 --- !result: 0
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：4000000 --- !result: 0
<NSThread: 0x281dc4040>{number = 8, name = (null)} --- 引用计数：4000000 --- !result: 0
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：4000000 --- !result: 0
<NSThread: 0x281dc4040>{number = 8, name = (null)} --- 引用计数：5000000 --- !result: 1
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：5000000 --- !result: 0
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：6000000 --- !result: 1
```

### 结果分析

- `rc == 600000`
  - 确实解决了线程间数据竞争的问题，原子操作
- 当数据发生变更(写入成功)时，`!result = 1`；
- 否则写入失败(保持不变)， `!result = 0`；


*过滤出 `!result == 1` 的 log*
```objc
<NSThread: 0x281db7e00>{number = 4, name = (null)} --- 引用计数：1000000 --- !result: 1
<NSThread: 0x281dda500>{number = 9, name = (null)} --- 引用计数：2000000 --- !result: 1
<NSThread: 0x281db6540>{number = 5, name = (null)} --- 引用计数：3000000 --- !result: 1
<NSThread: 0x281dd8440>{number = 3, name = (null)} --- 引用计数：4000000 --- !result: 1
<NSThread: 0x281dc4040>{number = 8, name = (null)} --- 引用计数：5000000 --- !result: 1
<NSThread: 0x281dd8c00>{number = 6, name = (null)} --- 引用计数：6000000 --- !result: 1
```

- `return !result` 即:`return true`
  - 也就是 `do { ...... } while ( false )`, 此时循环就退出了



## 案例3： CAS-Compare And Swap
### 代码
```objc
- (void)rc_add_3 {
    
    uintptr_t old = 0;
    uintptr_t new = 0;
    
    do {
        old = LoadExclusive(&_rc);
        new = old;
        
        for(int i = 0; i < 1000000; i++) {
            new++;
        }
    } while (!StoreExclusive(&_rc, old, new));
}

uintptr_t LoadExclusive(uintptr_t *src) {
    return *src;
}

bool StoreExclusive(uintptr_t *dst, uintptr_t oldvalue, uintptr_t value) {
    bool result = __sync_bool_compare_and_swap((void **)dst, (void *)oldvalue, (void *)value);
    NSLog(@"%@ --- 引用计数：%ld --- result: %d", [NSThread currentThread], *dst, result);
    return result;
}
```

### 运行结果
```objc
<NSThread: 0x2829ce200>{number = 6, name = (null)} --- 引用计数：1000000 --- result: 1
<NSThread: 0x2829cce40>{number = 3, name = (null)} --- 引用计数：1000000 --- result: 0
<NSThread: 0x2829ce200>{number = 6, name = (null)} --- 引用计数：2000000 --- result: 1
<NSThread: 0x2829cce40>{number = 3, name = (null)} --- 引用计数：2000000 --- result: 0
<NSThread: 0x2829cd200>{number = 5, name = (null)} --- 引用计数：2000000 --- result: 0
<NSThread: 0x2829cce40>{number = 3, name = (null)} --- 引用计数：3000000 --- result: 1
<NSThread: 0x2829cd200>{number = 5, name = (null)} --- 引用计数：3000000 --- result: 0
<NSThread: 0x2829ca200>{number = 8, name = (null)} --- 引用计数：3000000 --- result: 0
<NSThread: 0x282984f00>{number = 9, name = (null)} --- 引用计数：3000000 --- result: 0
<NSThread: 0x2829ca200>{number = 8, name = (null)} --- 引用计数：4000000 --- result: 1
<NSThread: 0x2829cd200>{number = 5, name = (null)} --- 引用计数：4000000 --- result: 0
<NSThread: 0x282984f00>{number = 9, name = (null)} --- 引用计数：4000000 --- result: 0
<NSThread: 0x2829cd200>{number = 5, name = (null)} --- 引用计数：5000000 --- result: 1
<NSThread: 0x282984f00>{number = 9, name = (null)} --- 引用计数：5000000 --- result: 0
<NSThread: 0x282984f00>{number = 9, name = (null)} --- 引用计数：6000000 --- result: 1
```

### 结果分析

- `rc == 600000`
  - 确实解决了线程间数据竞争的问题，原子操作
- 当数据发生变更(写入成功)时，`result = 1`；
- 否则写入失败(保持不变)， `result = 0`；


*过滤出 `result == 1` 的 log*
```objc
<NSThread: 0x2829ce200>{number = 6, name = (null)} --- 引用计数：1000000 --- result: 1
<NSThread: 0x2829ce200>{number = 6, name = (null)} --- 引用计数：2000000 --- result: 1
<NSThread: 0x2829cce40>{number = 3, name = (null)} --- 引用计数：3000000 --- result: 1
<NSThread: 0x2829ca200>{number = 8, name = (null)} --- 引用计数：4000000 --- result: 1
<NSThread: 0x2829cd200>{number = 5, name = (null)} --- 引用计数：5000000 --- result: 1
<NSThread: 0x282984f00>{number = 9, name = (null)} --- 引用计数：6000000 --- result: 1

```

- `return result` 即:`return true`
  - 也就是 `do { ...... } while ( false )`, 此时循环就退出了





## 案例4： __sync_fetch_and_add
### 代码
```objc
- (void)rc_add_4 {
    for(int i = 0; i < 100000; i++) {
        // _rc++; // 案例1 ++ 操作 非原子操作，我们可以使用下面的进行`原子+1`操作
        __sync_fetch_and_add(&_rc, 1); // 原子+1 操作
    }
    NSLog(@"%@ --- 当前引用计数：%ld", [NSThread currentThread], (long)self.rc);
}
```

### 运行结果
```objc
<NSThread: 0x2837cc8c0>{number = 6, name = (null)} --- 当前引用计数：213804
<NSThread: 0x28379efc0>{number = 3, name = (null)} --- 当前引用计数：430096
<NSThread: 0x28379c4c0>{number = 5, name = (null)} --- 当前引用计数：476835
<NSThread: 0x2837c1140>{number = 8, name = (null)} --- 当前引用计数：518255
<NSThread: 0x2837ccf40>{number = 9, name = (null)} --- 当前引用计数：571700
<NSThread: 0x2837cc8c0>{number = 6, name = (null)} --- 当前引用计数：600000
```

### 结果分析

- `rc != 600000`
- 确实解决了线程间数据竞争的问题，原子操作

### 补充

[5.44 Built-in functions for atomic memory access
](https://gcc.gnu.org/onlinedocs/gcc-4.1.1/gcc/Atomic-Builtins.html)

```c++
type __sync_fetch_and_add (type *ptr, type value, ...)
type __sync_fetch_and_sub (type *ptr, type value, ...)
type __sync_fetch_and_or (type *ptr, type value, ...)
type __sync_fetch_and_and (type *ptr, type value, ...)
type __sync_fetch_and_xor (type *ptr, type value, ...)
type __sync_fetch_and_nand (type *ptr, type value, ...)
```
```c++
type __sync_add_and_fetch (type *ptr, type value, ...)
type __sync_sub_and_fetch (type *ptr, type value, ...)
type __sync_or_and_fetch (type *ptr, type value, ...)
type __sync_and_and_fetch (type *ptr, type value, ...)
type __sync_xor_and_fetch (type *ptr, type value, ...)
type __sync_nand_and_fetch (type *ptr, type value, ...)
```

- `__sync_fetch_and_add`: 先`fetch` 再 `add`
- `__sync_add_and_fetch`: 先`add` 再 `fetch`


