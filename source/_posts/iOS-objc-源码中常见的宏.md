---
title: iOS objc 源码中常见的宏
abbrlink: 30dfa6fa
date: 2020-05-22 13:36:26
tags:
---


## \_\_LP64\_\_
```c++
/// https://github.com/llvm/llvm-project/
if (TI.getPointerWidth(0) == 64 && TI.getLongWidth() == 64
      && TI.getIntWidth() == 32) {
    Builder.defineMacro("_LP64");
    Builder.defineMacro("__LP64__");
}

if (TI.getPointerWidth(0) == 32 && TI.getLongWidth() == 32
    && TI.getIntWidth() == 32) {
    Builder.defineMacro("_ILP32");
    Builder.defineMacro("__ILP32__");
}
```

<!-- more -->

```c++
// Target properties.
if (!getTriple().isOSWindows() && getTriple().isArch64Bit()) {
    Builder.defineMacro("_LP64");
    Builder.defineMacro("__LP64__");
}
```

- 这里可能会有一点疑惑：为什么`isArch64Bit` 就认为是`__LP64__`?
```c++
bool Triple::isArch64Bit() const {
    // 大概意思应该是：获取 pointer 占用的 bit 数
    // 接着看下文中对 LP64 的说明
    return getArchPointerBitWidth(getArch()) == 64;
}
```

- `LP64` 其实就是 `long integers` 和 `pointers` 是 `64 bits`
- 除了 `LP64` 之外，还有 `LLP64`、`ILP64`、`SILP64`、`ILP32` 等

- **值得注意的是：** 也有在`64位处理器`上使用`ILP32`数据模型，该数据模型减小了代码大小，并减小了包含指针的数据结构的大小，所以造成的结果就是`地址空间`会小很多(这里应该是指操作系统给应用进程分配的`虚拟内存空间`)。对于某些嵌入式系统来说，`ILP32` 是一个不错的选择。已在`Apple Watch Series 4 / 5`中使用。

<table>
    <th colspan="6">data models</th>
	<tr>
		<th>Data model
		</td>
		<th>short
		</td>
		<th>int
		</td>
        <th>long
		</td>
        <th>long long
		</td>
        <th>pointer
		</td>
	</tr>
	<tr>
		<th>LLP64</th>
		<td>16</td>
        <td>32</td>
        <td>32</td>
        <td>64</td>
        <td>64</td>
	</tr>
    <tr>
		<th>LP64</th>
		<td>16</td>
        <td>32</td>
        <td>64</td>
        <td>64</td>
        <td>64</td>
	</tr>
    <tr>
		<th>ILP64</th>
		<td>16</td>
        <td>64</td>
        <td>64</td>
        <td>64</td>
        <td>64</td>
	</tr>
    <tr>
		<th>SILP64</th>
		<td>64</td>
        <td>64</td>
        <td>64</td>
        <td>64</td>
        <td>64</td>
	</tr>
    <tr>
		<th>ILP32</th>
		<td>16</td>
        <td>32</td>
        <td>32</td>
        <td>64</td>
        <td>32</td>
	</tr>
</table>

## \_\_ARM_ARCH_7K\_\_

- isWatchABI

```c++
// Unfortunately, __ARM_ARCH_7K__ is now more of an ABI descriptor. The CPU
// happens to be Cortex-A7 though, so it should still get __ARM_ARCH_7A__.
if (getTriple().isWatchABI())
    Builder.defineMacro("__ARM_ARCH_7K__", "2");
```

## SUPPORT_PACKED_ISA

- 在`iOS`中采用`__LP64__`数据模型；
    - 即：`#   define SUPPORT_PACKED_ISA 1`

```c++
// Define SUPPORT_PACKED_ISA=1 on platforms that store the class in the isa 
// field as a maskable pointer with other data around it.
#if (!__LP64__  ||  TARGET_OS_WIN32  ||  \
     (TARGET_OS_SIMULATOR && !TARGET_OS_IOSMAC))
#   define SUPPORT_PACKED_ISA 0
#else
#   define SUPPORT_PACKED_ISA 1
#endif
```

- 在`isa_t`中使用到了`ISA_BITFIELD`
- `ISA_BITFIELD` 定义在 `SUPPORT_PACKED_ISA` 内

```c++
union isa_t {
    isa_t() { }
    isa_t(uintptr_t value) : bits(value) { }

    Class cls;
    uintptr_t bits;
#if defined(ISA_BITFIELD)
    struct {
        ISA_BITFIELD;  // defined in isa.h
    };
#endif
};
```

```c++

#if SUPPORT_PACKED_ISA

# if __arm64__
#   define ISA_MASK        0x0000000ffffffff8ULL
#   define ISA_MAGIC_MASK  0x000003f000000001ULL
#   define ISA_MAGIC_VALUE 0x000001a000000001ULL
#   define ISA_BITFIELD                                                      \
      uintptr_t nonpointer        : 1;                                       \
      uintptr_t has_assoc         : 1;                                       \
      uintptr_t has_cxx_dtor      : 1;                                       \
      uintptr_t shiftcls          : 33; /*MACH_VM_MAX_ADDRESS 0x1000000000*/ \
      uintptr_t magic             : 6;                                       \
      uintptr_t weakly_referenced : 1;                                       \
      uintptr_t deallocating      : 1;                                       \
      uintptr_t has_sidetable_rc  : 1;                                       \
      uintptr_t extra_rc          : 19
#   define RC_ONE   (1ULL<<45)
#   define RC_HALF  (1ULL<<18)
# elif __x86_64__

    ......

# endif

// SUPPORT_PACKED_ISA
#endif

```


## SUPPORT_INDEXED_ISA

- `#   define SUPPORT_INDEXED_ISA 1` 主要针对 watchOS
- 在 `iOS` 中 `#   define SUPPORT_INDEXED_ISA 0`
- **注意点**: 
    - `__arm64__` 代表的是CPU架构
    - `LP64` 代表的采用哪种数据模型（可以回看文章首部关不`LP64`的说明）

```c++
// Define SUPPORT_INDEXED_ISA=1 on platforms that store the class in the isa 
// field as an index into a class table.
// Note, keep this in sync with any .s files which also define it.
// Be sure to edit objc-abi.h as well.
#if __ARM_ARCH_7K__ >= 2  ||  (__arm64__ && !__LP64__)
#   define SUPPORT_INDEXED_ISA 1
#else
#   define SUPPORT_INDEXED_ISA 0
#endif
```

## SUPPORT_NONPOINTER_ISA

- 与isa指针类型有关系
- `SUPPORT_NONPOINTER_ISA=1`: 非单纯指针类型的isa
- `iOS`中 `SUPPORT_INDEXED_ISA 0`，`SUPPORT_PACKED_ISA 1`
    - `#   define SUPPORT_NONPOINTER_ISA 1`


```c++
// Define SUPPORT_NONPOINTER_ISA=1 on any platform that may store something
// in the isa field that is not a raw pointer.
#if !SUPPORT_INDEXED_ISA  &&  !SUPPORT_PACKED_ISA
#   define SUPPORT_NONPOINTER_ISA 0
#else
#   define SUPPORT_NONPOINTER_ISA 1
#endif
```