---
title: arm64与LP64的区别
date: 2021-02-25 19:36:26
tags:
---

我们在阅读源码的时候经常会遇到如下的代码：
```c
#if __arm64__
  ......
#elif __x86_64__
  ......
#elif __i386__
  ......
#endif
```

```c
# if __LP64__
  ......
# else
  ......
# endif
```

由此可见：`__arm64__` 与 `__LP64__` 不是一个意思~


## `__arm64__` `__x86_64__` `__i386__`

- 这些代表的是`处理器架构(CPU Architectures)`

## `__LP64__`

- 代表的是`数据模型(data models)`：
- `LP64` 其实就是 `long integers` 和 `pointers` 是 `64 bits`
- 除了 `LP64` 之外，还有 `LLP64`、`ILP64`、`SILP64`、`ILP32` 等
- 值得注意的是：也有在`64位处理器`上使用`ILP32`数据模型，该数据模型减小了包含指针的数据结构的大小，所以造成的结果就是`地址空间`会小很多(这里应该是指操作系统给应用进程分配的`虚拟内存空间`)。对于某些嵌入式系统来说，`ILP32` 是一个不错的选择。已在`Apple Watch Series 4 / 5`中使用。

### iOS和iPadOS
- 真机
  - arm64 是当前的64位ARM CPU架构，自iPhone 5S和更高版本（6、6S，SE和7），iPad Air，Air 2和Pro以及A7和更高版本的芯片开始使用。在iOS 7.0或更高版本中可用;
  - armv7s（又名Swift，不要与同名语言混淆），已在iPhone 5，iPhone 5C和iPad 4的Apple的A6和A6X芯片中使用。armv7s 仅在iOS 6.0或更高版本中可用。
  - armv7，这是A5和更早版本中使用的32位ARM CPU的较旧版本。
- 模拟器
  - x64_64 （即64位Intel）（可选）从iOS 7.0开始可用。
  - i386 （即32位Intel）是iOS 6.1及更低版本上的唯一选项。

> 苹果已经弃用了对32位armv7架构的支持，并在几年前从其自己的工具链中删除了该支持。

### macOS

- `x86_64`是`Intel`的`64位`CPU的体系结构，有时也简称为`x64`。它是2005年至2021年之间交付的所有Intel Mac的体系结构。

- `arm64` 是2020年末及以后推出的基于`Apple Silicon`的新型Mac使用的体系结构。


### watchOS

- 真机
  - arm64_32 是arm64的变体，具有32位指针大小，用于Apple Watch Series 4和更高版本。
  - armv7k 是常规armv7的32位变体，从原始的Apple Watch到Series 3使用。

- 模拟器
  - x86_64 （即64位Intel）在模拟器中使用
  - i386 （即32位Intel）在模拟器中使用


### tvOS

- 真机
  - arm64 是当前的64位ARM CPU架构，并在Apple TV 4上使用

- 模拟器
  - x64_64 （即64位Intel）在模拟器中使用


