---
title: ARM64汇编小知识
abbrlink: 14ba70d9
date: 2018-01-25 10:54:52
tags:
---


# 寄存器
```objc
#import <UIKit/UIKit.h>
#import "AppDelegate.h"

int main(int argc, char * argv[]) {
    NSString * appDelegateClassName; // ⬅ 在此处打上断点，进入lldb
    @autoreleasepool {
        // Setup code that might create autoreleased objects goes here.
        appDelegateClassName = NSStringFromClass([AppDelegate class]);
    }
    return UIApplicationMain(argc, argv, nil, appDelegateClassName);
}
```

<!-- more -->

```objc
(lldb) register read
General Purpose Registers:
  x0 = 0x000000016d79f808
  x1 = 0x000000016d79f868
  x2 = 0x000000016d79f878
  x3 = 0x000000016d79f928
  x4 = 0x0000000000000000
  x5 = 0x0000000000000000
  x6 = 0x0000000000000000
  x7 = 0x0000000000000000
  x8 = 0x0000000000000000
  x9 = 0x7e666f59e9480095
  x10 = 0x0000000102660968  `_mh_execute_header + 2408
  x11 = 0x0000000080000028
  x12 = 0x0000000080000028
  x13 = 0x0000000000000000
  x14 = 0x0000000000000881
  x15 = 0x000000000000000c
  x16 = 0x000000010266606c  `main at main.m:11
  x17 = 0x0000000102710ed8  dyld`vtable for ImageLoaderMachOCompressed + 16
  x18 = 0x0000000000000000
  x19 = 0x0000000000000000
  x20 = 0x0000000000000000
  x21 = 0x0000000000000000
  x22 = 0x0000000000000000
  x23 = 0x0000000000000000
  x24 = 0x0000000000000000
  x25 = 0x0000000000000000
  x26 = 0x0000000000000000
  x27 = 0x0000000000000000
  x28 = 0x000000016d79f858
  fp = 0x000000016d79f820
  lr = 0x00000001a45766b0  libdyld.dylib`start + 4
  sp = 0x000000016d79f7f0
  pc = 0x000000010266608c  `main + 32 at main.m:12:16
cpsr = 0x60000000

(lldb) 
```

## 通用寄存器
- `x0 ~ x28`: 64bit; 

- `w0 ~ w28`: 32bit;(属于x0 ~ x28的低32bit)

## 程序计数器
- pc (Program Counter)
- 记录CPU当前指令是哪一条指令

## 堆栈指针
- sp (Stack Pointer)
- fp (frame Pointer)

## 链接寄存器
- lr (Link Register)
- 存储着函数的返回地址

## 程序状态寄存器
- cpsr (Current Program Status Register)
- spsr (Saved Program Status Register)异常状态下使用



# 常用指令

## MOV
```assembly
MOV {条件} {S} 目的寄存器，源操作数
```
- MOV指令可完成从另一个寄存器、被移位的寄存器或将一个立即数加载到目的寄存器。其中S选项决定指令的操作是否影响CPSR中条件标志位的值，当没有S时指令不更新CPSR中条件标志位的值。

- 指令示例：
```
MOV w8, #0x1      ;将立即数1传送到寄存器w8
MOV R1, R0        ;将寄存器RO的值传送到寄存器R1
MOV PC, R14       ;将寄存器R14的值传送到PC,常用于子程序返回
MOV R1, RO, LSL#3 ;将寄存器RO的值左移3位后传送到R1
```


## ADD
```assembly
ADD {条件} {S} 目的寄存器, 操作数1, 操作数2
```
- ADD指令用于把两个操作数相加，并将结果存放到目的寄存器中。
- 操作数1应是一个`寄存器`;
- 操作数2可以是一个`寄存器`，`被移位的寄存器`，或一个`立即数`。

指令示例：
```
ADD RO, R1, R2        ;RO = R1 + R2
ADD R0, R1, #0x1      ;R0 = R1 + 1
ADD RO, R2, R3, LSL#1 ;R0 = R2 + (R3<<1)
```

## SUB
```assembly
SUB {条件} {S} 目的寄存器, 操作数1, 操作数2
```
- SUB指令用于把操作数1减去操作数2,并将结果存放到目的寄存器中；
- 该指令可用于有符号或无符数的减法运算；
- 操作数1应是一个寄存器；
- 操作数2可以是一个寄存器，被移位的寄存器，或一个立即数；

指令示例:
```
SUB RO, R1, R2        ;RO = R1 - R2
SUB R0, R1, #0x1      ;RO = R1 - 1
SUB RO, R2, R3, LSL#1 ;RO = R2 - (R3<<1)
```

## CMP
```assembly
CMP {条件} 操作数1, 操作数2
```
- CMP指令用于把-一个寄存器的内容和另一个寄存器的内容或立即数进行比较，同时更新CPSR中条件标志位的值。该指令进行一次减法运算，但不存储结果，只更改条件标志位。标志位表示的是操作数1与操作数2的关系(大、小、相等)，例如，当操作数1大于操作操作数2,则此后的有GT后缀的指令将可以执行。

指令示例:
```
CMP R1, R0   ;将寄存器R1的值与寄存器RO的值相减，并根据结果设置CPSR的标志位
CMP R1, #0x1 ;将寄存器R1的值与立即数1相减，并根据结果设置CPSR的标志位
```
## 条件指令

### 
