---
title: iOS 自动释放池(autoreleasepool)
categories:
  - iOS
abbrlink: 7f2a4d1e
date: 2019-08-26 21:10:55
tags:
---

## AutoreleasePool简介
- [Apple官方说明](https://developer.apple.com/documentation/foundation/nsautoreleasepool)：一个用来支持引用计数内存管理系统的对象；

<!-- more -->
![NSAutoreleasePool](https://upload-images.jianshu.io/upload_images/590107-1991d31d02d6fea7.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 从Apple官方文档中我们可以得出以下比较重要的几点
* 如果你使用ARC，你不能直接`NSAutoreleasePool`，你可以使用`@autoreleasepool` block.
* `NSAutoreleasePool`对象不能调用`retain`和`autorelease`；
    ```objc
    autorelease
        Raises an exception. // 抛出异常

    retain
        Raises an exception. // 抛出异常
    ```
* 在引用计数环境中，一个`NSAutoreleasePool`对象内部包含了很多接受到`autorelease`消息的对象，当`NSAutoreleasePool`对象释放后，它将向其包含的每个对象发送`release`消息，因此给对象发送`autorelease`消息比`release`消息，延长了该对象的寿命(发送`release`可能直接销毁，而调用`autorelease`消息，会将其添加到`NSAutoreleasePool`中，随着`NSAutoreleasePool`的销毁才可能销毁)；
* 一个对象可以多次放到同一个自动释放池中，这种情况下，该对象将会收到多次的`release`消息；
* `Application Kit` 在事件循环开始的时候在主线程创建了一个自动释放池，并且在结束的时候去清空它，从而释放所有进程事件中生成的自动释放的对象。如果使用了 `Application Kit` ，就没必要再去创建自己的自动释放池。
- 如果你的应用在事件循环中创建了很多临时的`autorelease`的对象，你可以创建一个自动释放池以最大程度地减少峰值内存占用。
    - 其实这句话的意思大概是这样的：主线程中默认创建了一个自动释放池，由于调用了`autorelease`的对象会延迟释放(等到自动释放池销毁)，如果你在应用的事件循环中创建了很多临时的`autorelease`对象，你可以自己创建一个自动释放池以最大程度地减少峰值内存占用。

    ```objc
    NSArray *urls = <# An array of file URLs #>;
    for (NSURL *url in urls) {
        @autoreleasepool {
            NSError *error;
            NSString *fileContents = [NSString stringWithContentsOfURL:url
                                            encoding:NSUTF8StringEncoding 
                                            error:&error];
            /* Process the string, creating and autoreleasing more objects. */
        }
    }
    ```

> 疑问1：为什么ARC下还需要使用@autoreleasepool？

- ARC模式只是在编译阶段帮你插入必要的 `retain/release/autorelease`等相关代码调用，跟MRC模式下手动调用本质上是没有区别的；
- 而NSAutoReleasePool就是用来支持引用计数(Reference Counting)的。

> 疑问2：在事件循环开始的时候在主线程创建的自动释放池是指`main`方法中的那个`@autoreleasepool`?

- 应该不是的，这个事件循环中创建的自动释放池应该是在Runloop中创建的一个自动释放池，和`main`中的自动释放池不是同一个；
- 验证：可以将`main`中的自动释放池`@autoreleasepool`去掉，能发现对象任然能正常释放；

> 疑问3：为什么当事件循环中创建了很多临时的`autorelease`对象，你可以自己创建一个自动释放池以最大程度地减少峰值内存占用？

## NSAutoreleasePool 底层原理

### @autoreleasepool{ }的底层结构
```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // insert code here..
    }
    return 0;
}
```

通过`xcrun -sdk iphoneos clang -arch arm64 -rewrite-objc main.m -o main.cpp`命令我们将OC代码转化为C++源码`main.cpp`

```objc
int main(int argc, const char * argv[]) {
    /* @autoreleasepool */ { __AtAutoreleasePool __autoreleasepool; 

    }
    return 0;
}
```
根据上面编译后的代码我们可以得知：
- 所谓的`@autoreleasePool` block，其实对应着`__AtAutoreleasePool`的结构体;

### __AtAutoreleasePool 底层结构
```objc
extern "C" __declspec(dllimport) void * objc_autoreleasePoolPush(void);
extern "C" __declspec(dllimport) void objc_autoreleasePoolPop(void *);

struct __AtAutoreleasePool {
    __AtAutoreleasePool() { // C++中的构造函数
        atautoreleasepoolobj = objc_autoreleasePoolPush();
    }
    ~__AtAutoreleasePool() { // C++中的析构函数
        objc_autoreleasePoolPop(atautoreleasepoolobj);
    }
    void * atautoreleasepoolobj;
};
```

### @autoreleasepool{ } 的真实面目
```objc
int main(int argc, const char * argv[]) {

    void *ctxt = objc_autoreleasePoolPush();
    // 这里是@autoreleasepool{}中间的代码

    objc_autoreleasePoolPop(ctxt);

    return 0;
}
```

### 在`objc-runtime`源码`NSObject.mm`中继续探索

- `objc_autoreleasePoolPush()`
- `objc_autoreleasePoolPop()`

```objc
void *
objc_autoreleasePoolPush(void) {
    return AutoreleasePoolPage::push();
}

void
objc_autoreleasePoolPop(void *ctxt) {
    AutoreleasePoolPage::pop(ctxt);
}
```

### `AutoreleasePoolPage`

- 关键源码如下：

```objc
#define I386_PGBYTES            4096   /* bytes per 80386 page */
#define PAGE_SIZE               I386_PGBYTES
#define PAGE_MAX_SIZE           PAGE_SIZE

class AutoreleasePoolPage  
{
    #define EMPTY_POOL_PLACEHOLDER ((id*)1)

    #define POOL_BOUNDARY nil
    static pthread_key_t const key = AUTORELEASE_POOL_KEY;
    static uint8_t const SCRIBBLE = 0xA3;  // 0xA3A3A3A3 after releasing
    static size_t const SIZE = 
        #if PROTECT_AUTORELEASEPOOL
            PAGE_MAX_SIZE;  // must be multiple of vm page size
        #else
            PAGE_MAX_SIZE;  // size and alignment, power of 2
        #endif
    static size_t const COUNT = SIZE / sizeof(id);

    magic_t const magic;
    id *next;
    pthread_t const thread;
    AutoreleasePoolPage * const parent;
    AutoreleasePoolPage *child;
    uint32_t const depth;
    uint32_t hiwat;

    ...
}
```
- 有源码可知`AutoreleasePoolPage`其实是一个C++的类，本质上是一个`双向链表`;
- 每个`AutoreleasePoolPage`对象占用`4096字节`内存，除了用来存放它内部的成员变量，剩下的空间用来存放autorelease对象的地址

#### AutoreleasePoolPage::push()
```objc
static inline void *push() 
{
    id *dest;
    if (DebugPoolAllocation) {
        // Each autorelease pool starts on a new pool page.
        dest = autoreleaseNewPage(POOL_BOUNDARY);
    } else {
        dest = autoreleaseFast(POOL_BOUNDARY);
    }
    assert(dest == EMPTY_POOL_PLACEHOLDER || *dest == POOL_BOUNDARY);
    return dest;
}
```

##### autoreleaseNewPage(id obj)

```objc
static __attribute__((noinline))
id *autoreleaseNewPage(id obj) 
{
    AutoreleasePoolPage *page = hotPage();
    if (page) return autoreleaseFullPage(obj, page);
    else return autoreleaseNoPage(obj);
}
```

##### autoreleaseFast(id obj)

```objc
static inline id *autoreleaseFast(id obj)
{
    AutoreleasePoolPage *page = hotPage();
    if (page && !page->full()) { // page有值并且没有满
        return page->add(obj);   // 就向page中添加obj
    } else if (page) { // page有值并且满了 -> 接着看下文分析
        return autoreleaseFullPage(obj, page);
    } else {
        return autoreleaseNoPage(obj);
    }
}
```

##### autoreleaseFullPage(obj, page)
- 当前hotPage已满时调用
```objc
static __attribute__((noinline))
id *autoreleaseFullPage(id obj, AutoreleasePoolPage *page)
{
    // The hot page is full. 
    // Step to the next non-full page, adding a new page if necessary.
    // Then add the object to that page.
    assert(page == hotPage());
    assert(page->full()  ||  DebugPoolAllocation);

    do {
        if (page->child) page = page->child;
        else page = new AutoreleasePoolPage(page); // 给传入page新建一个child page
    } while (page->full());

    setHotPage(page);
    return page->add(obj);
}
```
- 查找可用的page：
    - 如果传入的 page (已为full状态) 有 child page, 并且这个child page 没有 full，就把这个child page 设置为 hotPage, 并将obj添加这个child page中，(如果child page full 就继续递归查询)
    - 如果传入的 page (已为full状态) 并且也没有 child page，那就新建一个page(作为传入的page的child page)，并把这个新建的page设置为hotPage；
- 将对象obj添加到hotPage中；

##### autoreleaseNoPage(id obj)
- 当前hotpage不存在时调用
```objc
static __attribute__((noinline))
id *autoreleaseNoPage(id obj)
{
    // "No page" could mean no pool has been pushed
    // or an empty placeholder pool has been pushed and has no contents yet
    assert(!hotPage());

    bool pushExtraBoundary = false;
    if (haveEmptyPoolPlaceholder()) {
        // We are pushing a second pool over the empty placeholder pool
        // or pushing the first object into the empty placeholder pool.
        // Before doing that, push a pool boundary on behalf of the pool 
        // that is currently represented by the empty placeholder.
        pushExtraBoundary = true;
    }
    else if (obj != POOL_BOUNDARY  &&  DebugMissingPools) {
        // We are pushing an object with no pool in place, 
        // and no-pool debugging was requested by environment.
        _objc_inform("MISSING POOLS: (%p) Object %p of class %s "
                        "autoreleased with no pool in place - "
                        "just leaking - break on "
                        "objc_autoreleaseNoPool() to debug", 
                        pthread_self(), (void*)obj, object_getClassName(obj));
        objc_autoreleaseNoPool(obj);
        return nil;
    }
    else if (obj == POOL_BOUNDARY  &&  !DebugPoolAllocation) {
        // We are pushing a pool with no pool in place,
        // and alloc-per-pool debugging was not requested.
        // Install and return the empty pool placeholder.
        return setEmptyPoolPlaceholder();
    }

    // We are pushing an object or a non-placeholder'd pool.

    // Install the first page.
    AutoreleasePoolPage *page = new AutoreleasePoolPage(nil);
    setHotPage(page);
    
    // Push a boundary on behalf of the previously-placeholder'd pool.
    if (pushExtraBoundary) {
        page->add(POOL_BOUNDARY);
    }
    
    // Push the requested object or pool.
    return page->add(obj);
}
```

- 新建一个全新的page(可以简单的理解为根page)，并不是作为了某个page的child page；
- 设置这个page为hotPage;
- 可能还会将 `POOL_BOUNDARY` 先添加到page中；
- 添加obj到page中；


#### AutoreleasePoolPage::pop(ctxt);

```objc
static inline void pop(void *token) 
{
    AutoreleasePoolPage *page;
    id *stop;

    if (token == (void*)EMPTY_POOL_PLACEHOLDER) {
        // Popping the top-level placeholder pool.
        if (hotPage()) {
            // Pool was used. Pop its contents normally.
            // Pool pages remain allocated for re-use as usual.
            pop(coldPage()->begin());
        } else {
            // Pool was never used. Clear the placeholder.
            setHotPage(nil);
        }
        return;
    }

    page = pageForPointer(token); // 寻找page
    stop = (id *)token;
    if (*stop != POOL_BOUNDARY) {
        if (stop == page->begin()  &&  !page->parent) {
            // Start of coldest page may correctly not be POOL_BOUNDARY:
            // 1. top-level pool is popped, leaving the cold page in place
            // 2. an object is autoreleased with no pool
        } else {
            // Error. For bincompat purposes this is not 
            // fatal in executables built with old SDKs.
            return badPop(token);
        }
    }

    if (PrintPoolHiwat) printHiwat();

    // 向栈中的对象发送release消息，直到遇到第一个边界对象(POOL_BOUNDARY)
    page->releaseUntil(stop);

    // memory: delete empty children
    if (DebugPoolAllocation  &&  page->empty()) {
        // special case: delete everything during page-per-pool debugging
        AutoreleasePoolPage *parent = page->parent;
        page->kill();
        setHotPage(parent);
    } else if (DebugMissingPools  &&  page->empty()  &&  !page->parent) {
        // special case: delete everything for pop(top) 
        // when debugging missing autorelease pools
        page->kill();
        setHotPage(nil);
    } 
    else if (page->child) {
        // hysteresis: keep one empty child if page is more than half full
        if (page->lessThanHalfFull()) {
            page->child->kill();
        }
        else if (page->child->child) {
            page->child->child->kill();
        }
    }
}
```
- 根据传入的地址值token，找到page；
- 向栈中的对象发送release消息，直到遇到第一个边界对象(POOL_BOUNDARY)；这句话其实引出了一个问题：到目前为止其实我们只明白了`@autoreleasepool`的底层实现，那么`@autoreleasepool`内部的对象是怎么添加到pool中呢？

> 问题：`@autoreleasepool`中的对象是怎么和pool进行关联的呢？

- 这里就要说一下`autorelease`方法的实现了，毕竟`autoreleasepool`是与`autorelease`紧密相连的；

```objc
- [NSObject autorelease]
└── id objc_object::rootAutorelease()
    └── id objc_object::rootAutorelease2()
        └── static id AutoreleasePoolPage::autorelease(id obj)
            └── static id AutoreleasePoolPage::autoreleaseFast(id obj)
                └── ...
```

- 有调用栈可知`@autoreleasepool`内部的对象在调用`autorelease`方法时，最终调用了`AutoreleasePoolPage`的`autoreleaseFast(obj)`，将其添加到了page中；

- 也就是说：
    - 创建这个pool的时候调用了`AutoreleasePoolPage::autoreleaseFast(obj)`,此时传入的obj是边界对象(`POOL_BOUNDARY`);
    - pool内部的对象调用`autorelease`,最终还是调用了`AutoreleasePoolPage::autoreleaseFast(obj)`，只不过这时的obj就是这个具体的对象了；











