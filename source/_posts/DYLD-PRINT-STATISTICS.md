---
title: DYLD_PRINT_STATISTICS
abbrlink: 82d040e4
date: 2020-03-05 11:22:35
tags:
---


我们在阅读一些关于启动优化的文章的时候，经常能看到这样的场景：

> 打印 main() 之前程序耗时时长

<!-- more -->

具体做法就使用到了 `DYLD_PRINT_STATISTICS`,步骤如下：

- `Edit Scheme` -> 选择`Arguments` -> 在`Environment Variables` 中添加 name: `DYLD_PRINT_STATISTICS`  value: `YES`


此时运行程序，我们能看到如下打印：
```
Total pre-main time: 644.58 milliseconds (100.0%)
         dylib loading time:  32.92 milliseconds (5.1%)
        rebase/binding time: 429.93 milliseconds (66.6%)
            ObjC setup time:  94.78 milliseconds (14.7%)
           initializer time:  86.93 milliseconds (13.4%)
           slowest intializers :
             libSystem.B.dylib :   8.51 milliseconds (1.3%)
               libobjc.A.dylib :  15.61 milliseconds (2.4%)
    libMainThreadChecker.dylib :  51.92 milliseconds (8.0%)
```



## DYLD_PRINT_STATISTICS 简介

`DYLD_PRINT_STATISTICS`其实就是一个环境变量，我们将这个环境变量设置为`YES`后，系统能为我们打印了一些日志信息；

## DYLD_PRINT_STATISTICS 底层

说起`DYLD_PRINT_STATISTICS`环境变量，那就一定要说起`程序的启动过程`，在程序启动过程中(这里特指main()函数之前)，就涉及到了`dyld 的加载流程`,大致流程如下：具体可以阅读 `dyld 源码`:位于 https://opensource.apple.com/tarballs/dyld/ 或者也可以参考下之前的文章

```
- 设置上下文等信息 setContext()
- 检查环境变量 checkEnvironmentVariables()
- 加载共享缓存 mapSharedCache()
- 将dyld本身添加到UUID列表 addDyldImageToUUIDList()
- 实例化主程序 ImageLoader instantiateFromLoadedImage
- 主程序签名相关 hasCodeSignatureLoadCommand
- 链接主程序 link()
- 链接 inserted libraries link()
- 运行所有初始化程序 initializeMainExecutable()
- 通知一些监视进程该进程将要进入main() notifyMonitoringDyldMain()
- 查找主程序的入口 getEntryFromLC_MAIN()
```

### initializeMainExecutable()

`dyld` 中 `initializeMainExecutable` 源码如下：
```c++
void initializeMainExecutable() 
{
    // record that we've reached this step
    gLinkContext.startedInitializingMainExecutable = true;

    // run initialzers for any inserted dylibs
    ImageLoader::InitializerTimingList initializerTimes[allImagesCount()];
    initializerTimes[0].count = 0;
    const size_t rootCount = sImageRoots.size();
    if ( rootCount > 1 ) {
        for(size_t i=1; i < rootCount; ++i) {
            sImageRoots[i]->runInitializers(gLinkContext, initializerTimes[0]);
        }
    }
    
    // run initializers for main executable and everything it brings up 
    sMainExecutable->runInitializers(gLinkContext, initializerTimes[0]);
    
    // register cxa_atexit() handler to run static terminators in all loaded images when this process exits
    if ( gLibSystemHelpers != NULL ) 
        (*gLibSystemHelpers->cxa_atexit)(&runAllStaticTerminators, NULL, NULL);

    // dump info if requested
    // ⬇️ 🔔🔔🔔 这里就是我们分析的重点❗️❗️❗️ 
    if ( sEnv.DYLD_PRINT_STATISTICS )
        ImageLoader::printStatistics((unsigned int)allImagesCount(), initializerTimes[0]);
    if ( sEnv.DYLD_PRINT_STATISTICS_DETAILS )
        ImageLoaderMachO::printStatisticsDetails((unsigned int)allImagesCount(), initializerTimes[0]);
}

```

### ImageLoader::printStatistics()

```c++
void ImageLoader::printStatistics(unsigned int imageCount, const InitializerTimingList& timingInfo)
{
    uint64_t totalTime = fgTotalLoadLibrariesTime  + fgTotalRebaseTime + fgTotalBindTime + fgTotalWeakBindTime + fgTotalDOF + fgTotalInitTime;

    uint64_t totalDyldTime = totalTime - fgTotalDebuggerPausedTime - fgTotalRebindCacheTime;
    printTime("Total pre-main time", totalDyldTime, totalDyldTime);
    printTime("         dylib loading time", fgTotalLoadLibrariesTime-fgTotalDebuggerPausedTime, totalDyldTime);
    printTime("        rebase/binding time", fgTotalRebaseTime+fgTotalBindTime+fgTotalWeakBindTime-fgTotalRebindCacheTime, totalDyldTime);
    printTime("            ObjC setup time", fgTotalObjCSetupTime, totalDyldTime);
    printTime("           initializer time", fgTotalInitTime-fgTotalObjCSetupTime, totalDyldTime);
    dyld::log("           slowest intializers :\n");
    for (uintptr_t i=0; i < timingInfo.count; ++i) {
        uint64_t t = timingInfo.images[i].initTime;
        if ( t*50 < totalDyldTime )
            continue;
        dyld::log("%30s ", timingInfo.images[i].shortName);
        if ( strncmp(timingInfo.images[i].shortName, "libSystem.", 10) == 0 )
            t -= fgTotalObjCSetupTime;
            printTime("", t, totalDyldTime);
    }
    dyld::log("\n");
}
```

上述代码中的打印信息果然与我们文章开始时运行程序打印的日志一致。


## dyld 中定义的环境变量

```c++
// 
// state of all environment variables dyld uses
//
struct EnvironmentVariables {
    const char* const *    DYLD_FRAMEWORK_PATH;
    const char* const *    DYLD_FALLBACK_FRAMEWORK_PATH;
    const char* const *    DYLD_LIBRARY_PATH;
    const char* const *    DYLD_FALLBACK_LIBRARY_PATH;
    const char* const *    DYLD_INSERT_LIBRARIES;
    const char* const *    LD_LIBRARY_PATH;            // for unix conformance
    const char* const *    DYLD_VERSIONED_LIBRARY_PATH;
    const char* const *    DYLD_VERSIONED_FRAMEWORK_PATH;
    bool                   DYLD_PRINT_LIBRARIES_POST_LAUNCH;
    bool                   DYLD_BIND_AT_LAUNCH;
    bool                   DYLD_PRINT_STATISTICS;
    bool                   DYLD_PRINT_STATISTICS_DETAILS;
    bool                   DYLD_PRINT_OPTS;
    bool                   DYLD_PRINT_ENV;
    bool                   DYLD_DISABLE_DOFS;
    bool                   hasOverride;
                     //    DYLD_SHARED_CACHE_DIR           ==> sSharedCacheOverrideDir
                     //    DYLD_ROOT_PATH                  ==> gLinkContext.rootPaths
                     //    DYLD_IMAGE_SUFFIX               ==> gLinkContext.imageSuffix
                     //    DYLD_PRINT_OPTS                 ==> gLinkContext.verboseOpts
                     //    DYLD_PRINT_ENV                  ==> gLinkContext.verboseEnv
                     //    DYLD_FORCE_FLAT_NAMESPACE       ==> gLinkContext.bindFlat
                     //    DYLD_PRINT_INITIALIZERS         ==> gLinkContext.verboseInit
                     //    DYLD_PRINT_SEGMENTS             ==> gLinkContext.verboseMapping
                     //    DYLD_PRINT_BINDINGS             ==> gLinkContext.verboseBind
                     //    DYLD_PRINT_WEAK_BINDINGS        ==> gLinkContext.verboseWeakBind
                     //    DYLD_PRINT_REBASINGS            ==> gLinkContext.verboseRebase
                     //    DYLD_PRINT_DOFS                 ==> gLinkContext.verboseDOF
                     //    DYLD_PRINT_APIS                 ==> gLogAPIs
                     //    DYLD_IGNORE_PREBINDING          ==> gLinkContext.prebindUsage
                     //    DYLD_PREBIND_DEBUG              ==> gLinkContext.verbosePrebinding
                     //    DYLD_NEW_LOCAL_SHARED_REGIONS   ==> gLinkContext.sharedRegionMode
                     //    DYLD_SHARED_REGION              ==> gLinkContext.sharedRegionMode
                     //    DYLD_PRINT_WARNINGS             ==> gLinkContext.verboseWarnings
                     //    DYLD_PRINT_RPATHS               ==> gLinkContext.verboseRPaths
                     //    DYLD_PRINT_INTERPOSING          ==> gLinkContext.verboseInterposing
                     //    DYLD_PRINT_LIBRARIES            ==> gLinkContext.verboseLoading
};

```
