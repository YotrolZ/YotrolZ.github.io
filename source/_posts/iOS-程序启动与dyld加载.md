---
title: iOS 程序启动与dyld加载
abbrlink: 687bc3c9
date: 2020-03-04 14:05:59
tags:
---


众所周知：我们iOS程序的入口是`main.m`中的`main()`函数

```objc
// main.m
#import <UIKit/UIKit.h>
#import "AppDelegate.h"

int main(int argc, char * argv[]) {
    NSString * appDelegateClassName;
    @autoreleasepool {
        appDelegateClassName = NSStringFromClass([AppDelegate class]);
    }
    return UIApplicationMain(argc, argv, nil, appDelegateClassName);
}
```

<!-- more -->

那如果我们在main函数中打上断点
```objc
// mian.m
int main(int argc, char * argv[]) {
    NSString * appDelegateClassName; // ⬅️ 断点①
    @autoreleasepool {
        // Setup code that might create autoreleased objects goes here.
        appDelegateClassName = NSStringFromClass([AppDelegate class]);
    }
    return UIApplicationMain(argc, argv, nil, appDelegateClassName);
}
```

```objc
// AppDelegate.m
@implementation AppDelegate

+ (void)load {
    NSLog(@"AppDelegate load"); // ⬅️ 断点②
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    return YES;
}
@end
```

此时运行程序，发现我们先卡在了`断点②`, 我们进入LLDB 输入`bt`
```c++
(lldb) bt
* thread #1, queue = 'com.apple.main-thread', stop reason = breakpoint 2.1
  * frame #0:  0x000000010eb8e0a7 dyld`+[AppDelegate load](self=AppDelegate, _cmd="load") at AppDelegate.m:17:5
    frame #1:  0x00007fff201804e3 libobjc.A.dylib`load_images + 1442
    frame #2:  0x000000010eba1e54 dyld_sim`dyld::notifySingle(dyld_image_states, ImageLoader const*, ImageLoader::InitializerTimingList*) + 425
    frame #3:  0x000000010ebb0887 dyld_sim`ImageLoader::recursiveInitialization(ImageLoader::LinkContext const&, unsigned int, char const*, ImageLoader::InitializerTimingList&, ImageLoader::UninitedUpwards&) + 437
    frame #4:  0x000000010ebaebb0 dyld_sim`ImageLoader::processInitializers(ImageLoader::LinkContext const&, unsigned int, ImageLoader::InitializerTimingList&, ImageLoader::UninitedUpwards&) + 188
    frame #5:  0x000000010ebaec50 dyld_sim`ImageLoader::runInitializers(ImageLoader::LinkContext const&, ImageLoader::InitializerTimingList&) + 82
    frame #6:  0x000000010eba22a9 dyld_sim`dyld::initializeMainExecutable() + 199
    frame #7:  0x000000010eba6d50 dyld_sim`dyld::_main(macho_header const*, unsigned long, int, char const**, char const**, char const**, unsigned long*) + 4431
    frame #8:  0x000000010eba11c7 dyld_sim`start_sim + 122
    frame #9:  0x0000000116e7057a dyld`dyld::useSimulatorDyld(int, macho_header const*, char const*, int, char const**, char const**, char const**, unsigned long*, unsigned long*) + 2093
    frame #10: 0x0000000116e6ddf3 dyld`dyld::_main(macho_header const*, unsigned long, int, char const**, char const**, char const**, unsigned long*) + 1199
    frame #11: 0x0000000116e6822b dyld`dyldbootstrap::start(dyld3::MachOLoaded const*, int, char const**, dyld3::MachOLoaded const*, unsigned long*) + 457
    frame #12: 0x0000000116e68025 dyld`_dyld_start + 37
(lldb) 
```

由此可见，在我们的main()函数之前，执行了一系列的操作，比如加载类(调用 `+load()`)等，一大推的`dyld`的字眼，我们下面就介绍一下这个神秘的`dyld`


## dyld 简介

- dyld(The dynamic link editor)动态链接编辑器，是操作系统的重要组成部分，在 macOS 系统中，dyld 位于 `Macintosh HD/usr/lib/dyld`。 

- dyld 源码是开源的，位于 https://opensource.apple.com/tarballs/dyld/


## dyld 执行流程

根据文头`LLDB bt` 信息得知：dyld 的入口是 `_dyld_start`

### _dyld_start

以 `arm64` 为例：

```
#if __arm64__
	.text
	.align 2
	.globl __dyld_start
__dyld_start:
	mov 	x28, sp
	and     sp, x28, #~15		// force 16-byte alignment of stack
	mov	x0, #0
	mov	x1, #0
	stp	x1, x0, [sp, #-16]!	// make aligned terminating frame
	mov	fp, sp			// set up fp to point to terminating frame
	sub	sp, sp, #16             // make room for local variables
#if __LP64__
	ldr     x0, [x28]               // get app's mh into x0
	ldr     x1, [x28, #8]           // get argc into x1 (kernel passes 32-bit int argc as 64-bits on stack to keep alignment)
	add     x2, x28, #16            // get argv into x2
#else
	ldr     w0, [x28]               // get app's mh into x0
	ldr     w1, [x28, #4]           // get argc into x1 (kernel passes 32-bit int argc as 64-bits on stack to keep alignment)
	add     w2, w28, #8             // get argv into x2
#endif
	adrp	x3,___dso_handle@page
	add 	x3,x3,___dso_handle@pageoff // get dyld's mh in to x4
	mov	x4,sp                   // x5 has &startGlue

	// call dyldbootstrap::start(app_mh, argc, argv, dyld_mh, &startGlue)
	// 根据 LLDB bt 及上述注释，这里调用了 dyldbootstrap::start
	bl	__ZN13dyldbootstrap5startEPKN5dyld311MachOLoadedEiPPKcS3_Pm
	mov	x16,x0                  // save entry point address in x16

	// 省略部分代码...

#endif // __arm64__
```

### dyldbootstrap::start

位于 命名空间 `namespace dyldbootstrap` 下的 start 方法

```c++

//
//  This is code to bootstrap dyld.  This work in normally done for a program by dyld and crt.
//  In dyld we have to do this manually.
//
uintptr_t start(const dyld3::MachOLoaded* appsMachHeader, int argc, const char* argv[],
				const dyld3::MachOLoaded* dyldsMachHeader, uintptr_t* startGlue)
{
    // Emit kdebug tracepoint to indicate dyld bootstrap has started <rdar://46878536>
    dyld3::kdebug_trace_dyld_marker(DBG_DYLD_TIMING_BOOTSTRAP_START, 0, 0, 0, 0);

    // if kernel had to slide dyld, we need to fix up load sensitive locations
    // we have to do this before using any global variables
    // 地址恢复
    rebaseDyld(dyldsMachHeader);

    // kernel sets up env pointer to be just past end of agv array
    const char** envp = &argv[argc+1];
	
    // kernel sets up apple pointer to be just past end of envp array
    const char** apple = envp;
    while(*apple != NULL) { ++apple; }
    ++apple;

    // set up random value for stack canary
    __guard_setup(apple);

/* DYLD_INITIALIZER_SUPPORT 的定义
// currently dyld has no initializers, but if some come back, set this to non-zero
#define DYLD_INITIALIZER_SUPPORT  0 
*/
#if DYLD_INITIALIZER_SUPPORT
    // run all C++ initializers inside dyld
    runDyldInitializers(argc, argv, envp, apple);
#endif

    // now that we are done bootstrapping dyld, call dyld's main
    uintptr_t appsSlide = appsMachHeader->getSlide();
    return dyld::_main((macho_header*)appsMachHeader, appsSlide, argc, argv, envp, apple, startGlue);
}
```

### dyld::_main

```c++
intptr_t
_main(const macho_header* mainExecutableMH, uintptr_t mainExecutableSlide,
		int argc, const char* argv[], const char* envp[], const char* apple[], 
		uintptr_t* startGlue)
{
	......

	uintptr_t result = 0;
	sMainExecutableMachHeader = mainExecutableMH;
	sMainExecutableSlide = mainExecutableSlide;

	......

	CRSetCrashLogMessage("dyld: launch started");

	// 设置上下文等信息
	setContext(mainExecutableMH, argc, argv, envp, apple);


	......


	// 检查环境变量
	checkEnvironmentVariables(envp);
	defaultUninitializedFallbackPaths(envp);
	// 根据环境变量进行打印输出
	if ( sEnv.DYLD_PRINT_OPTS )
		printOptions(argv);
	if ( sEnv.DYLD_PRINT_ENV ) 
		printEnvironmentVariables(envp);

	......

	// 加载 shared cache
	// load shared cache
	checkSharedRegionDisable((dyld3::MachOLoaded*)mainExecutableMH, mainExecutableSlide);
	if ( gLinkContext.sharedRegionMode != ImageLoader::kDontUseSharedRegion ) {
		mapSharedCache();
	}

	......

	// install gdb notifier
	stateToHandlers(dyld_image_state_dependents_mapped, sBatchHandlers)->push_back(notifyGDB);
	stateToHandlers(dyld_image_state_mapped, sSingleHandlers)->push_back(updateAllImages);
	// make initial allocations large enough that it is unlikely to need to be re-alloced
	sImageRoots.reserve(16);
	sAddImageCallbacks.reserve(4);
	sRemoveImageCallbacks.reserve(4);
	sAddLoadImageCallbacks.reserve(4);
	sImageFilesNeedingTermination.reserve(16);
	sImageFilesNeedingDOFUnregistration.reserve(8);


	try {
		// 将dyld本身添加到UUID列表
		// add dyld itself to UUID list
		addDyldImageToUUIDList();

		......

		// 实例化主程序
		// instantiate ImageLoader for main executable
		sMainExecutable = instantiateFromLoadedImage(mainExecutableMH, mainExecutableSlide, sExecPath);
		gLinkContext.mainExecutable = sMainExecutable;
		gLinkContext.mainExecutableCodeSigned = hasCodeSignatureLoadCommand(mainExecutableMH);

		......

		// 加载 inserted libraries
		// load any inserted libraries
		if	( sEnv.DYLD_INSERT_LIBRARIES != NULL ) {
			for (const char* const* lib = sEnv.DYLD_INSERT_LIBRARIES; *lib != NULL; ++lib) 
				loadInsertedDylib(*lib);
		}
		// record count of inserted libraries so that a flat search will look at 
		// inserted libraries, then main, then others.
		sInsertedDylibCount = sAllImages.size()-1;
		
		// 链接主程序
		// link main executable
		gLinkContext.linkingMainExecutable = true;
		link(sMainExecutable, sEnv.DYLD_BIND_AT_LAUNCH, true, ImageLoader::RPathChain(NULL, NULL), -1);
		sMainExecutable->setNeverUnloadRecursive();
		if ( sMainExecutable->forceFlat() ) {
			gLinkContext.bindFlat = true;
			gLinkContext.prebindUsage = ImageLoader::kUseNoPrebinding;
		}
    
		// 链接 inserted libraries
		// link any inserted libraries
		// do this after linking main executable so that any dylibs pulled in by inserted 
		// dylibs (e.g. libSystem) will not be in front of dylibs the program uses
		if ( sInsertedDylibCount > 0 ) {
			for(unsigned int i=0; i < sInsertedDylibCount; ++i) {
				ImageLoader* image = sAllImages[i+1];
				link(image, sEnv.DYLD_BIND_AT_LAUNCH, true, ImageLoader::RPathChain(NULL, NULL), -1);
				image->setNeverUnloadRecursive();
			}
			if ( gLinkContext.allowInterposing ) {
				// only INSERTED libraries can interpose
				// register interposing info after all inserted libraries are bound so chaining works
				for(unsigned int i=0; i < sInsertedDylibCount; ++i) {
					ImageLoader* image = sAllImages[i+1];
					image->registerInterposing(gLinkContext);
				}
			}
		}

		if ( gLinkContext.allowInterposing ) {
			// <rdar://problem/19315404> dyld should support interposition even without DYLD_INSERT_LIBRARIES
			for (long i=sInsertedDylibCount+1; i < sAllImages.size(); ++i) {
				ImageLoader* image = sAllImages[i];
				if ( image->inSharedCache() )
					continue;
				image->registerInterposing(gLinkContext);
			}
		}
	
		......

		// apply interposing to initial set of images
		for(int i=0; i < sImageRoots.size(); ++i) {
			sImageRoots[i]->applyInterposing(gLinkContext);
		}
		ImageLoader::applyInterposingToDyldCache(gLinkContext);

		// Bind and notify for the main executable now that interposing has been registered
		uint64_t bindMainExecutableStartTime = mach_absolute_time();
		sMainExecutable->recursiveBindWithAccounting(gLinkContext, sEnv.DYLD_BIND_AT_LAUNCH, true);
		uint64_t bindMainExecutableEndTime = mach_absolute_time();
		ImageLoaderMachO::fgTotalBindTime += bindMainExecutableEndTime - bindMainExecutableStartTime;
		gLinkContext.notifyBatch(dyld_image_state_bound, false);

		// Bind and notify for the inserted images now interposing has been registered
		if ( sInsertedDylibCount > 0 ) {
			for(unsigned int i=0; i < sInsertedDylibCount; ++i) {
				ImageLoader* image = sAllImages[i+1];
				image->recursiveBind(gLinkContext, sEnv.DYLD_BIND_AT_LAUNCH, true);
			}
		}
		
		// <rdar://problem/12186933> do weak binding only after all inserted images linked
		sMainExecutable->weakBind(gLinkContext);
		gLinkContext.linkingMainExecutable = false;

		sMainExecutable->recursiveMakeDataReadOnly(gLinkContext);

		CRSetCrashLogMessage("dyld: launch, running initializers");
		
		// 运行所有初始化程序(🔔🔔🔔这个方法相当的重要❗️❗️❗️)
		// run all initializers
		initializeMainExecutable();

		// 通知一些监视进程该进程将要进入main()
		// notify any montoring proccesses that this process is about to enter main()
		notifyMonitoringDyldMain();

		{
			// 查找主程序的入口
			// find entry point for main executable
			result = (uintptr_t)sMainExecutable->getEntryFromLC_MAIN();
			if ( result != 0 ) {
				// main executable uses LC_MAIN, we need to use helper in libdyld to call into main()
				if ( (gLibSystemHelpers != NULL) && (gLibSystemHelpers->version >= 9) )
					*startGlue = (uintptr_t)gLibSystemHelpers->startGlueToCallExit;
				else
					halt("libdyld.dylib support not present for LC_MAIN");
			}
			else {
				// main executable uses LC_UNIXTHREAD, dyld needs to let "start" in program set up for main()
				result = (uintptr_t)sMainExecutable->getEntryFromLC_UNIXTHREAD();
				*startGlue = 0;
			}
		}
	}
	catch(const char* message) {
		syncAllImages();
		halt(message);
	}
	catch(...) {
		dyld::log("dyld: launch failed\n");
	}
	
	return result;
}

```

- 设置上下文等信息 `setContext()`
- 检查环境变量 `checkEnvironmentVariables()`
- 加载共享缓存 `mapSharedCache()`
- 将dyld本身添加到UUID列表 `addDyldImageToUUIDList()`
- 实例化主程序 ImageLoader `instantiateFromLoadedImage`
- 主程序签名相关 `hasCodeSignatureLoadCommand`
- 链接主程序 `link()`
- 链接 inserted libraries `link()`
- 运行所有初始化程序 `initializeMainExecutable()`
- 通知一些监视进程该进程将要进入main() `notifyMonitoringDyldMain()`
- 查找主程序的入口 `getEntryFromLC_MAIN()`
