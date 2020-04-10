---
title: iOS dyld 前世今生
description: >-
  dyld(The Dynamic Linker/Loader)动态链接(加载)器，是操作系统的重要组成部分，在 macOS 系统中，dyld 位于 `Macintosh HD/usr/lib/dyld`。 
abbrlink: c2aae680
date: 2020-04-10 16:33:55
tags:
---

## dyld 简介

- `dyld(The Dynamic Linker/Loader)`动态链接(加载)器，是操作系统的重要组成部分，在 macOS 系统中，dyld 位于 `Macintosh HD/usr/lib/dyld`。 

- dyld 源码是开源的，位于 https://opensource.apple.com/tarballs/dyld/

<!-- more -->

## dyld 1.0 (1996–2004)

- 在 `NeXTStep 3.3` 中引入了 `dyld 1.0`,在此之前，NeXT使用`static binaries`

- 对 `POSIX dlopen()` 进行了标准化

- `dyld 1.0` 出现之前，很多系统还没有使用大型 C++ 动态库，由于C++具有许多功能，例如其初始化程序排序的工作。它们在静态环境中可以很好地工作，但是在动态环境中很难做到良好的性能，因此大型C++代码库导致动态链接器不得不做很多工作，而且速度很慢。

- 在发布`macOS 10.0 Cheetah`之前，还添加了另一个功能，就是所谓的预绑定`Prebinding`。用于找到系统中每个 dylib 的固定的地址，动态连接器会尝试从这些地址中加载，如果加载成功，就会编辑这些二进制，等到下次他们被放到同样的地址上时，就不需要做任何工作了。这大大加快了启动速度，但这意味着我们在每次启动时都在编辑您的二进制文件，由于种种原因，这并不是一件好事，其中最重要的就是`安全性`。

- 所以出现了 `dyld 2.0`


## dyld 2.0 (2004–2007)

- 在`macOS Tiger`中引入`dyld 2.0`
- `dyld 2`对`dyld 1.0` 进行了全面的重写，
  - 它具有对C++初始化程序语义的正确支持，因此我们稍微扩展了mach-o格式，并更新了dyld，以便有效支持的C++库。
  - `dyld 2`具有完整的 `dlopen`和 `dlsym` 实现，具有正确的语义，此时弃用了旧版API。
- `dyld 2.0`是为速度而设计的，因此其健全性检查受到限制，也存在安全性问题，还需要不断的改进。

- 由于 `dyld 2.0` 在性能有了显著提升，所以可以减少一部分`预绑定`的工作。

## dyld 2.x (2007–2017)

`dyld 2.0` 发布至今，苹果依然做了很多的重大改进，也就是 `dyld 2.x`;

- 支持更多的架构及平台
  - 自从`Power PC`上发布`dyld 2.0`以来，添加了`x86`，`x86 64 arm`，`arm64`等架构，
  - 支持了`iOS`, `tvOS`, 和 `watchOS`平台

- 通过多种方式提高了`安全性`
  - `Codesigning`： 代码签名
  - `ASLR`：`Address space layout randomization` 地址空间配置随机加载
  - `bounds checking`：对`mach-o header`中的许多内容添加了重要的`边界检查`功能，从而可以避免恶意二进制数据的注入；

- 提升性能
  - 使用`shared cache`技术完全替代了预绑定`prebinding`；

### bounds checking
对`mach-o header`中的许多内容添加了重要的`边界检查`功能，从而可以避免恶意二进制数据的注入；


### ASLR
- ASLR (Address space layout randomization),地址空间配置随机加载, 是一种防范内存损坏漏洞被利用的计算机安全技术, ASLR通过随机放置进程关键数据区域的地址空间来防止攻击者能可靠地跳转到内存的特定位置来利用函数。

- Linux已在内核版本2.6.12中添加ASLR。
- Apple在Mac OS X Leopard 10.5（2007年十月发行）中某些库导入了随机地址偏移，但其实现并没有提供ASLR所定义的完整保护能力。而Mac OS X Lion 10.7则对所有的应用程序均提供了ASLR支持。
- Apple在iOS 4.3内导入了ASLR。
- Android 4.0提供地址空间配置随机加载（ASLR），以帮助保护系统和第三方应用程序免受由于内存管理问题的攻击，在Android 4.1中加入地址无关代码（position-independent code）的支持。
- *上述信息出自[维基百科](https://zh.wikipedia.org/wiki/%E4%BD%8D%E5%9D%80%E7%A9%BA%E9%96%93%E9%85%8D%E7%BD%AE%E9%9A%A8%E6%A9%9F%E8%BC%89%E5%85%A5)*



### Shared Cache

- 在 `iOS 3.1` 和 `macOS Snow Leopard` 中引入了`Shared Cache`, 完全取代了`prebinding`

- 它是一个包含`大多数系统dylib`的文件，由于将它们合并到一个文件中，因此可以进行优化，我们可以重新排列它们所有的`text segments`和所有的`data segments`，并重写它们的整个`symbol tables 符号表`，以减小大小，从而在每个进程中,仅挂载少量的区域;
- 打包`binary segments`并节省大量RAM。
- 它实际上是dylib预链接器`Pre-links`；
- 预构建`Pre-builds` dyld和Obj-C在运行时将使用的数据结构，让我们不必在程序启动时做这些事情，节约更多RAM和时间。
- 共享代码在macOS上本地生成，运行dyld共享代码，将会大幅优化系统性能，并且带来其它好处，在我们的其它平台上，我们在Apple生成共享代码，然后提供给你使用

## dyld 3.0 (2017)
- `dyld 3`是全新的`动态链接器`,它完全改变了动态链接概念。
  - 2017 Apple OS平台上的所有`系统程序`都会默认使用它；
  - 在未来的Apple OS平台和第三方程序中，它将会全面取代`dyld 2`；
  - 未来已到，`iOS 13`中已全面取代了`dyld 2`;

### 为什么又重新设计了 dyld3 呢？

- **性能**：性能是一个永恒的主题,我们想要尽量提高`启动速度`;
- **安全性**：在dyld 2中增加了些安全特性，但是很难跟随现实情形，虽然做了很多的工作，但是难以实现这个目标
- **可测试性和可靠性**：为此Apple发布了很多不错的测试框架，比如:`XCTest` 我们应该使用它们，但是它们依赖于`动态链接器`的`底层`功能，将它们的库插入进程 因此它们不能用于测试现有的dyld代码，这让我们难以测试安全性和性能水平；

### dyld 2 执行流程

- 在程序启动之前，我们需要分析你的`mach-o`文件，弄清楚你需要哪些库，这些可能需要别的其它库，我们需要进行递归分析，直到获得所有dylib的完整图，普通iOS程序需要3-600个dylib，数据庞大，需要进行大量的处理；
- 映射所有`mach-o`文件，将它们放入地址空间；
- 执行符号查找，若你的程序使用printf函数，将会查找`printf`是否在库系统中，然后我们找到它的地址，将它复制到你的程序中的函数指针上，
- 进行绑定(Bind)和基址重置(rebase)，由于使用随机地址，复制这些指针，必须使用基址；
- 运行所有初始化器；
- 执行main;

![](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/dyld2-1.jpg)


### 如何改进及优化呢？

- 确定安全敏感的部分
  - `Parse mach-o headers` 和 `Find dependencies`，是安全敏感性组件，最大的安全隐患之一；
  - 人们可以使用撰改过的mach-o文件头进行攻击；
  - 你的程序可能使用 `@rpaths` 即搜索路径。通过撰改这些路径或者将库插到适当的位置，可以破坏程序；

- 确定大量占用资源的部分(可缓存的部分)
  - `Perform symbol lookups`符号查找部分，因为在给定的库中，除非进行软件更新或者在磁盘上更改库，符号将始终位于库中的相同偏移位置；

![](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/dyld2-2.jpg)

### dyld 2 -> dyld 3 演变

- 将`安全敏感`的部分和`占用大量资源`的部分移到上层，然后将一个`closure`写入磁盘进行缓存，然后我们在程序进程中使用它；

- `launch closure`是程序启动的重要环节；

![](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/dyld2-dyld3.jpg)

### dyld 3 执行流程

dyld 3包含这三个部分:
- 进程外 mach-o分析器和编译器；
- 进程内引擎 执行`launch closure`处理；
- `launch closure`缓存服务；
  - 大多数程序启动会使用缓存，而不需要调用进程外 mach-o分析器或编译器；
  - 并且`launch closure`比`mach-o`更简单
  - 它们是`内存映射`文件，不需要用复杂的方法进行分析，我们可以简单地验证它们，其作用是为了提高速度


![](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/dyld3-process.jpg)

#### out-of-process mach-o parser

- 解析所有搜索路径、@rpaths、环境变量 它们会影响你的启动，
- 分析`mach-o`二进制数据
- 执行`符号查找`
- 利用这些结果创建`launch closure`
- 它是普通的后台程序 让我们提高测试基础架构的性能


#### in-process engine

- 这部分驻留在进程中
- 检查`launch closure`是否正确
- 映射到dylib之中，再跳转到`main`函数
- `dyld 3` 不再需要分析`mach-o`文件头或执行符号查找，就可以启动应用，也正因为这些操作是花费时间的部分，因此可以极大提高`程序启动速度`


#### launch closure cache

- 系统应用的`launch closure`直接加入到共享缓存`shared cache`
- 对于第三方应用，我们将在`应用安装`或`更新`期间构建`launch closure`，因为此时`system library`已发生更改；
- 默认情况下，在`iOS`，`tvOS`和`watchOS`上，这些操作都将在`运行之前`为您`预先构建`。
- 在`macOS`上，由于可以侧向加载应用程序(这里应该是指非`App Store`安装的应用)，因此如果需要，`in-process engine`可以在首次启动时RPC`(Remote Procedure Call)`到`out to the daemon`，然后，它就可以使用缓存的`closure`了。






