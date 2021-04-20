---
title: 再说iOS中的Class
abbrlink: 993b4752
date: 2021-02-25 16:01:57
tags:
---

OBJC源码地址：https://opensource.apple.com/tarballs/objc4/

<!-- more -->

## objc_class

说起iOS中的Class, 网上一大推的文章，那必定会提到`objc_class`,你是否见过如下代码：

```objc
struct objc_class {
    Class _Nonnull isa  OBJC_ISA_AVAILABILITY;

#if !__OBJC2__
    Class _Nullable super_class                              OBJC2_UNAVAILABLE;
    const char * _Nonnull name                               OBJC2_UNAVAILABLE;
    long version                                             OBJC2_UNAVAILABLE;
    long info                                                OBJC2_UNAVAILABLE;
    long instance_size                                       OBJC2_UNAVAILABLE;
    struct objc_ivar_list * _Nullable ivars                  OBJC2_UNAVAILABLE;
    struct objc_method_list * _Nullable * _Nullable methodLists                    OBJC2_UNAVAILABLE;
    struct objc_cache * _Nonnull cache                       OBJC2_UNAVAILABLE;
    struct objc_protocol_list * _Nullable protocols          OBJC2_UNAVAILABLE;
#endif

} OBJC2_UNAVAILABLE;
/* Use `Class` instead of `struct objc_class *` */
```

### OBJC2_UNAVAILABLE和__OBJC2__

```objc
// Define __OBJC2__ for the benefit of our asm files.
#ifndef __OBJC2__
#   if TARGET_OS_OSX  &&  !TARGET_OS_IOSMAC  &&  __i386__
        // old ABI
#   else
#       define __OBJC2__ 1
#   endif
#endif
```

```objc
/* OBJC2_UNAVAILABLE: unavailable in objc 2.0, deprecated in Leopard */
#if !defined(OBJC2_UNAVAILABLE)
#   if __OBJC2__
#       define OBJC2_UNAVAILABLE UNAVAILABLE_ATTRIBUTE
#   else
        /* plain C code also falls here, but this is close enough */
#       define OBJC2_UNAVAILABLE                                       \
            __OSX_DEPRECATED(10.5, 10.5, "not available in __OBJC2__") \
            __IOS_DEPRECATED(2.0, 2.0, "not available in __OBJC2__")   \
            __TVOS_UNAVAILABLE __WATCHOS_UNAVAILABLE __BRIDGEOS_UNAVAILABLE
#   endif
#endif
```

- 在2006年7月苹果全球开发者会议中，Apple宣布了“Objective-C 2.0”的发布，其增加了“现代的垃圾收集，语法改进，运行时性能改进，以及64位支持”。
- 2007年10月发布的Mac OS X v10.5中包含了Objective-C 2.0的编译器。

由此可见：上述`objc_class`代码在Objective-C 2.0中`已经过期`了;


## objc_object
```objc
#if !OBJC_TYPES_DEFINED
/// An opaque type that represents an Objective-C class.
typedef struct objc_class *Class;

/// Represents an instance of a class.
struct objc_object {
    Class _Nonnull isa  OBJC_ISA_AVAILABILITY;
};

/// A pointer to an instance of a class.
typedef struct objc_object *id;
#endif
```


## OBJC_TYPES_DEFINED和OBJC_ISA_AVAILABILITY

```objc
// objc-private.h 41行
#define OBJC_TYPES_DEFINED 1
```

```objc
/* OBJC_ISA_AVAILABILITY: `isa` will be deprecated or unavailable 
 * in the future */
#if !defined(OBJC_ISA_AVAILABILITY)
#   if __OBJC2__
#       define OBJC_ISA_AVAILABILITY  __attribute__((deprecated))
#   else
#       define OBJC_ISA_AVAILABILITY  /* still available */
#   endif
#endif

```

由此可见：上述`objc_object`中的代码也是`无效的`


了解了上述说明后，我们再次看Runtime源码，就要排除部分代码的干扰了

## 再说 objc_class

```objc
// objc-runtime-new.h 1111行
struct objc_class : objc_object {
    // Class ISA;
    Class superclass;
    cache_t cache;             // formerly cache pointer and vtable
    class_data_bits_t bits;    // class_rw_t * plus custom rr/alloc flags

    class_rw_t *data() { 
        return bits.data();
    }
    void setData(class_rw_t *newData) {
        bits.setData(newData);
    }

    void setInfo(uint32_t set) {
        assert(isFuture()  ||  isRealized());
        data()->setFlags(set);
    }

    void clearInfo(uint32_t clear) {
        assert(isFuture()  ||  isRealized());
        data()->clearFlags(clear);
    }

    // set and clear must not overlap
    void changeInfo(uint32_t set, uint32_t clear) {
        assert(isFuture()  ||  isRealized());
        assert((set & clear) == 0);
        data()->changeFlags(set, clear);
    }

    bool hasCustomRR() {
        return ! bits.hasDefaultRR();
    }
    void setHasDefaultRR() {
        assert(isInitializing());
        bits.setHasDefaultRR();
    }
    void setHasCustomRR(bool inherited = false);
    void printCustomRR(bool inherited);

    bool hasCustomAWZ() {
        return ! bits.hasDefaultAWZ();
    }
    void setHasDefaultAWZ() {
        assert(isInitializing());
        bits.setHasDefaultAWZ();
    }
    void setHasCustomAWZ(bool inherited = false);
    void printCustomAWZ(bool inherited);

    bool instancesRequireRawIsa() {
        return bits.instancesRequireRawIsa();
    }
    void setInstancesRequireRawIsa(bool inherited = false);
    void printInstancesRequireRawIsa(bool inherited);

    bool canAllocNonpointer() {
        assert(!isFuture());
        return !instancesRequireRawIsa();
    }
    bool canAllocFast() {
        assert(!isFuture());
        return bits.canAllocFast();
    }


    bool hasCxxCtor() {
        // addSubclass() propagates this flag from the superclass.
        assert(isRealized());
        return bits.hasCxxCtor();
    }
    void setHasCxxCtor() { 
        bits.setHasCxxCtor();
    }

    bool hasCxxDtor() {
        // addSubclass() propagates this flag from the superclass.
        assert(isRealized());
        return bits.hasCxxDtor();
    }
    void setHasCxxDtor() { 
        bits.setHasCxxDtor();
    }


    bool isSwiftStable() {
        return bits.isSwiftStable();
    }

    bool isSwiftLegacy() {
        return bits.isSwiftLegacy();
    }

    bool isAnySwift() {
        return bits.isAnySwift();
    }


    // Return YES if the class's ivars are managed by ARC, 
    // or the class is MRC but has ARC-style weak ivars.
    bool hasAutomaticIvars() {
        return data()->ro->flags & (RO_IS_ARC | RO_HAS_WEAK_WITHOUT_ARC);
    }

    // Return YES if the class's ivars are managed by ARC.
    bool isARC() {
        return data()->ro->flags & RO_IS_ARC;
    }


#if SUPPORT_NONPOINTER_ISA
    // Tracked in non-pointer isas; not tracked otherwise
#else
    bool instancesHaveAssociatedObjects() {
        // this may be an unrealized future class in the CF-bridged case
        assert(isFuture()  ||  isRealized());
        return data()->flags & RW_INSTANCES_HAVE_ASSOCIATED_OBJECTS;
    }

    void setInstancesHaveAssociatedObjects() {
        // this may be an unrealized future class in the CF-bridged case
        assert(isFuture()  ||  isRealized());
        setInfo(RW_INSTANCES_HAVE_ASSOCIATED_OBJECTS);
    }
#endif

    bool shouldGrowCache() {
        return true;
    }

    void setShouldGrowCache(bool) {
        // fixme good or bad for memory use?
    }

    bool isInitializing() {
        return getMeta()->data()->flags & RW_INITIALIZING;
    }

    void setInitializing() {
        assert(!isMetaClass());
        ISA()->setInfo(RW_INITIALIZING);
    }

    bool isInitialized() {
        return getMeta()->data()->flags & RW_INITIALIZED;
    }

    void setInitialized();

    bool isLoadable() {
        assert(isRealized());
        return true;  // any class registered for +load is definitely loadable
    }

    IMP getLoadMethod();

    // Locking: To prevent concurrent realization, hold runtimeLock.
    bool isRealized() {
        return data()->flags & RW_REALIZED;
    }

    // Returns true if this is an unrealized future class.
    // Locking: To prevent concurrent realization, hold runtimeLock.
    bool isFuture() { 
        return data()->flags & RW_FUTURE;
    }

    bool isMetaClass() {
        assert(this);
        assert(isRealized());
        return data()->ro->flags & RO_META;
    }

    // NOT identical to this->ISA when this is a metaclass
    Class getMeta() {
        if (isMetaClass()) return (Class)this;
        else return this->ISA();
    }

    bool isRootClass() {
        return superclass == nil;
    }
    bool isRootMetaclass() {
        return ISA() == (Class)this;
    }

    const char *mangledName() { 
        // fixme can't assert locks here
        assert(this);

        if (isRealized()  ||  isFuture()) {
            return data()->ro->name;
        } else {
            return ((const class_ro_t *)data())->name;
        }
    }
    
    const char *demangledName(bool realize = false);
    const char *nameForLogging();

    // May be unaligned depending on class's ivars.
    uint32_t unalignedInstanceStart() {
        assert(isRealized());
        return data()->ro->instanceStart;
    }

    // Class's instance start rounded up to a pointer-size boundary.
    // This is used for ARC layout bitmaps.
    uint32_t alignedInstanceStart() {
        return word_align(unalignedInstanceStart());
    }

    // May be unaligned depending on class's ivars.
    uint32_t unalignedInstanceSize() {
        assert(isRealized());
        return data()->ro->instanceSize;
    }

    // Class's ivar size rounded up to a pointer-size boundary.
    uint32_t alignedInstanceSize() {
        return word_align(unalignedInstanceSize());
    }

    size_t instanceSize(size_t extraBytes) {
        size_t size = alignedInstanceSize() + extraBytes;
        // CF requires all objects be at least 16 bytes.
        if (size < 16) size = 16;
        return size;
    }

    void setInstanceSize(uint32_t newSize) {
        assert(isRealized());
        if (newSize != data()->ro->instanceSize) {
            assert(data()->flags & RW_COPIED_RO);
            *const_cast<uint32_t *>(&data()->ro->instanceSize) = newSize;
        }
        bits.setFastInstanceSize(newSize);
    }

    void chooseClassArrayIndex();

    void setClassArrayIndex(unsigned Idx) {
        bits.setClassArrayIndex(Idx);
    }

    unsigned classArrayIndex() {
        return bits.classArrayIndex();
    }

};
```

## objc_object

```objc
struct objc_object {
private:
    isa_t isa;

public:
    // isa相关方法
    // ISA() assumes this is NOT a tagged pointer object
    Class ISA();

    // getIsa() allows this to be a tagged pointer object
    Class getIsa();

    // initIsa() should be used to init the isa of new objects only.
    // If this object already has an isa, use changeIsa() for correctness.
    // initInstanceIsa(): objects with no custom RR/AWZ
    // initClassIsa(): class objects
    // initProtocolIsa(): protocol objects
    // initIsa(): other objects
    void initIsa(Class cls /*nonpointer=false*/);
    void initClassIsa(Class cls /*nonpointer=maybe*/);
    void initProtocolIsa(Class cls /*nonpointer=maybe*/);
    void initInstanceIsa(Class cls, bool hasCxxDtor);

    // changeIsa() should be used to change the isa of existing objects.
    // If this is a new object, use initIsa() for performance.
    Class changeIsa(Class newCls);

    bool hasNonpointerIsa();
    bool isTaggedPointer();
    bool isBasicTaggedPointer();
    bool isExtTaggedPointer();
    bool isClass();
    
    // 关联对象相关方法
    // object may have associated objects?
    bool hasAssociatedObjects();
    void setHasAssociatedObjects();

    // 弱引用相关方法
    // object may be weakly referenced?
    bool isWeaklyReferenced();
    void setWeaklyReferenced_nolock();

    // object may have -.cxx_destruct implementation?
    bool hasCxxDtor();

    // 内存管理相关方法
    // Optimized calls to retain/release methods
    id retain();
    void release();
    id autorelease();

    // Implementations of retain/release methods
    id rootRetain();
    bool rootRelease();
    id rootAutorelease();
    bool rootTryRetain();
    bool rootReleaseShouldDealloc();
    uintptr_t rootRetainCount();

    // Implementation of dealloc methods
    bool rootIsDeallocating();
    void clearDeallocating();
    void rootDealloc();

private:
    void initIsa(Class newCls, bool nonpointer, bool hasCxxDtor);

    // Slow paths for inline control
    id rootAutorelease2();
    bool overrelease_error();

#if SUPPORT_NONPOINTER_ISA
    // Unified retain count manipulation for nonpointer isa
    id rootRetain(bool tryRetain, bool handleOverflow);
    bool rootRelease(bool performDealloc, bool handleUnderflow);
    id rootRetain_overflow(bool tryRetain);
    bool rootRelease_underflow(bool performDealloc);

    void clearDeallocating_slow();

    // Side table retain count overflow for nonpointer isa
    void sidetable_lock();
    void sidetable_unlock();

    void sidetable_moveExtraRC_nolock(size_t extra_rc, bool isDeallocating, bool weaklyReferenced);
    bool sidetable_addExtraRC_nolock(size_t delta_rc);
    size_t sidetable_subExtraRC_nolock(size_t delta_rc);
    size_t sidetable_getExtraRC_nolock();
#endif

    // Side-table-only retain count
    bool sidetable_isDeallocating();
    void sidetable_clearDeallocating();

    bool sidetable_isWeaklyReferenced();
    void sidetable_setWeaklyReferenced_nolock();

    id sidetable_retain();
    id sidetable_retain_slow(SideTable& table);

    uintptr_t sidetable_release(bool performDealloc = true);
    uintptr_t sidetable_release_slow(SideTable& table, bool performDealloc = true);

    bool sidetable_tryRetain();

    uintptr_t sidetable_retainCount();
#if DEBUG
    bool sidetable_present();
#endif
};
```

![objc源码分析](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/objc/Runtime.png)

