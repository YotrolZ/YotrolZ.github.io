---
title: iOS 引用计数中惊艳的原子操作
description: >-
  所谓原子操作(atomic)，就是不可分割的操作，在其操作所属期间，不会因为`线程调度`而被打断。本文旨在讲解在引用计数中涉及到的原子操作，别有一番风味，请慢慢享用~~
abbrlink: 5013a5ee
date: 2021-01-19 19:13:56
tags:
---

# 简述
所谓`原子操作(atomic)`，就是不可分割的操作，在其操作所属期间，不会因为`线程调度`而被打断。

## 单处理器单核系统
在单处理器系统上，如果操作是在单个CPU指令中实现的，则该操作始终是原子的。

## 多处理器或多核系统
在多处理器系统上，确保原子性存在一点困难。要达到原子操作，就需要进行相应的处理。比如我们经常听到的`自旋锁`、`互斥锁`、`信号量`等线程同步方案。


> 本文旨在讲解在 `iOS` 中`引用计数`中涉及到的原子操作，别有一番风味，请慢慢享用~


# iOS 引用计数关键源码

在`objc_object`源码中，关于内存应用计数相关的方法，通过一个`宏判断`实现了两套逻辑，代码如下:

```c++
#if SUPPORT_NONPOINTER_ISA
    
    ......

#else
    
    ......

#endif
```

我们这里只分析`SUPPORT_NONPOINTER_ISA`下的`objc_object::rootRetain`，具体源码如下：

- 调用`retain`，其实会来到这里，不做过多解释；

```c++
ALWAYS_INLINE id 
objc_object::rootRetain(bool tryRetain, bool handleOverflow)
{
    if (isTaggedPointer()) return (id)this;

    bool sideTableLocked = false;
    bool transcribeToSideTable = false;

    isa_t oldisa;
    isa_t newisa;

    // ❓❓❓问题点1：这里怎么会有一个 do while 循环❓❓❓
    do {
        transcribeToSideTable = false;
        oldisa = LoadExclusive(&isa.bits);
        newisa = oldisa;
        // ① 非nonpointer
        if (slowpath(!newisa.nonpointer)) {
            ClearExclusive(&isa.bits);
            if (!tryRetain && sideTableLocked) sidetable_unlock();
            if (tryRetain) return sidetable_tryRetain() ? (id)this : nil;
            else return sidetable_retain();
        }

        // ② nonpointer (重点分析)
        // don't check newisa.fast_rr; we already called any RR overrides
        if (slowpath(tryRetain && newisa.deallocating)) {
            ClearExclusive(&isa.bits);
            if (!tryRetain && sideTableLocked) sidetable_unlock();
            return nil;
        }
        uintptr_t carry;
        // 进行 引用计数加一 操作 
        // ❓❓❓问题点2：这里加一操作为什么没有上述lock、unlock之类的加锁操作❓❓❓
        newisa.bits = addc(newisa.bits, RC_ONE, 0, &carry);  // extra_rc++

        if (slowpath(carry)) {
            // 这里其实是 newisa.extra_rc++ 溢出的逻辑(不是本文分析重点)
            // newisa.extra_rc++ overflowed
            if (!handleOverflow) {
                ClearExclusive(&isa.bits);
                return rootRetain_overflow(tryRetain);
            }
            // Leave half of the retain counts inline and 
            // prepare to copy the other half to the side table.
            if (!tryRetain && !sideTableLocked) sidetable_lock();
            sideTableLocked = true;
            transcribeToSideTable = true;
            newisa.extra_rc = RC_HALF;
            newisa.has_sidetable_rc = true;
        }
    } while (slowpath(!StoreExclusive(&isa.bits, oldisa.bits, newisa.bits)));

    if (slowpath(transcribeToSideTable)) {
        // Copy the other half of the retain counts to the side table.
        sidetable_addExtraRC_nolock(RC_HALF);
    }

    if (slowpath(!tryRetain && sideTableLocked)) sidetable_unlock();
    return (id)this;
}

```

## 源码中发现的问题

- 为什么要加一个 do while 循环？
- `newisa.bits = addc(newisa.bits, RC_ONE, 0, &carry);`为什么不需要`加锁`等相关操作，那么该操作如何保证`线程同步`的呢？

- *一个猜想*： 莫非这个`addc`加一操作是通过 `do while` 来实现`原子操作`的？


> 重点来了~

我们从 `do while` 中的条件：`while (slowpath(!StoreExclusive(&isa.bits, oldisa.bits, newisa.bits)));` 入手分析


## StoreExclusive

在源码中`StoreExclusive`对于不用的处理器架构有三种不同的实现：
- `__arm64__`
- `__arm__`
- `__x86_64__  ||  __i386__`

### `StoreExclusive (__arm64__)`
```c++
// Pointer-size register prefix for inline asm
# if __LP64__
#   define p "x"  // true arm64
# else
#   define p "w"  // arm64_32
# endif

static ALWAYS_INLINE
bool StoreExclusive(uintptr_t *dst, uintptr_t oldvalue __unused, uintptr_t value)
{
    uint32_t result;
    asm("stxr %w0, %" p "2, [%x3]" 
        : "=&r" (result), "=m" (*dst)
        : "r" (value), "r" (dst));
    return !result;
}

```
- 如果不清楚`__LP64__`的可以翻看我之前的一片文章；

#### 汇编指令  `stxr` 

- 这是`ARM`中的一个`原子操作指令`，是不是发现了新大陆。


### `StoreExclusive (__x86_64__  ||  __i386__)`

```c++
static ALWAYS_INLINE
bool StoreExclusive(uintptr_t *dst, uintptr_t oldvalue, uintptr_t value)
{
    return __sync_bool_compare_and_swap((void **)dst, (void *)oldvalue, (void *)value);
}
```

#### `__sync_bool_compare_and_swap` 内置函数

- `Compare And Swap`，简称`CAS`;
- 简单来说就是，在`写入`新值之前， 先根据`内存地址`读出`此刻内存真实值`，然后与`此刻操作期望值`进行比较，当且仅当`此刻内存真实值`与`此刻操作期望值`一致时，才将`此刻操作期望值`写入，并返回`true`。
- 可能有点绕，联想着多线程的`数据竞争`慢慢体会；
    - 比如：此刻期望将数据修改为10，但是由于多线程的缘故，此刻内存中的真实值并不一定为10，如果不为10，就不执行写入操作；


## `do while` 循环的作用
```c++
// 简化代码
objc_object::rootRetain()
{
    isa_t oldRC; // 用于存储此刻内存中的真实值
    isa_t newRC; // 用于存储此刻操作期的期望值
    
    oldRC = &isa.RC // 从内存中读取此刻真实值(这里不够严谨，为便于理解)

    do {
        newRC++; // 引用计数加一操作
    } while (!StoreExclusive(&isa.RC, oldRC, newRC));
}
```

这样就很直观了~
- 注意`while` 条件中的 取反操作 `!`;
- 如果写入不成功，那就一直执行循环，直到写入成功；
- 有点`自旋锁`的味道，慢慢体会；
