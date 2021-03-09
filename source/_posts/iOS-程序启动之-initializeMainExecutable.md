---
title: iOS 程序启动之 initializeMainExecutable
date: 2020-03-05 17:47:31
tags:
---


## initializeMainExecutable

```c++
void initializeMainExecutable()
{
    // record that we've reached this step
    gLinkContext.startedInitializingMainExecutable = true;

    // 为所有 inserted dylibs 执行 初始化
    // run initialzers for any inserted dylibs
    ImageLoader::InitializerTimingList initializerTimes[allImagesCount()];
    initializerTimes[0].count = 0;
    const size_t rootCount = sImageRoots.size();
    if ( rootCount > 1 ) {
        for(size_t i=1; i < rootCount; ++i) {
            sImageRoots[i]->runInitializers(gLinkContext, initializerTimes[0]);
        }
    }
	
    // 主程序的初始化等
    // run initializers for main executable and everything it brings up 
    sMainExecutable->runInitializers(gLinkContext, initializerTimes[0]);
	
    // register cxa_atexit() handler to run static terminators in all loaded images when this process exits
    if ( gLibSystemHelpers != NULL ) 
        (*gLibSystemHelpers->cxa_atexit)(&runAllStaticTerminators, NULL, NULL);

    // dump info if requested
    if ( sEnv.DYLD_PRINT_STATISTICS )
        ImageLoader::printStatistics((unsigned int)allImagesCount(), initializerTimes[0]);
    if ( sEnv.DYLD_PRINT_STATISTICS_DETAILS )
        ImageLoaderMachO::printStatisticsDetails((unsigned int)allImagesCount(), initializerTimes[0]);
}
```

## ImageLoader::runInitializers

```c++
void ImageLoader::runInitializers(const LinkContext& context, InitializerTimingList& timingInfo)
{
    uint64_t t1 = mach_absolute_time();
    mach_port_t thisThread = mach_thread_self();
    ImageLoader::UninitedUpwards up;
    up.count = 1;
    up.imagesAndPaths[0] = { this, this->getPath() };
    processInitializers(context, thisThread, timingInfo, up);
    context.notifyBatch(dyld_image_state_initialized, false);
    mach_port_deallocate(mach_task_self(), thisThread);
    uint64_t t2 = mach_absolute_time();
    fgTotalInitTime += (t2 - t1);
}
```



## ImageLoader::processInitializers

```c++
// <rdar://problem/14412057> upward dylib initializers can be run too soon
// To handle dangling dylibs which are upward linked but not downward, all upward linked dylibs
// have their initialization postponed until after the recursion through downward dylibs
// has completed.
void ImageLoader::processInitializers(const LinkContext& context, mach_port_t thisThread,
                        InitializerTimingList& timingInfo, ImageLoader::UninitedUpwards& images)
{
    uint32_t maxImageCount = context.imageCount()+2;
    ImageLoader::UninitedUpwards upsBuffer[maxImageCount];
    ImageLoader::UninitedUpwards& ups = upsBuffer[0];
    ups.count = 0;
    // Calling recursive init on all images in images list, building a new list of
    // uninitialized upward dependencies.
    for (uintptr_t i=0; i < images.count; ++i) {
        images.imagesAndPaths[i].first->recursiveInitialization(context, thisThread, images.imagesAndPaths[i].second, timingInfo, ups);
    }
    // If any upward dependencies remain, init them.
    if ( ups.count > 0 )
        processInitializers(context, thisThread, timingInfo, ups);
}
```

## ImageLoader::recursiveInitialization

```c++
void ImageLoader::recursiveInitialization(const LinkContext& context, mach_port_t this_thread, const char* pathToInitialize,
                    InitializerTimingList& timingInfo, UninitedUpwards& uninitUps)
{
    recursive_lock lock_info(this_thread);
    recursiveSpinLock(lock_info);

    if ( fState < dyld_image_state_dependents_initialized-1 ) {
        uint8_t oldState = fState;
        // break cycles
        fState = dyld_image_state_dependents_initialized-1;
        try {
            // initialize lower level libraries first
            for(unsigned int i=0; i < libraryCount(); ++i) {
                ImageLoader* dependentImage = libImage(i);
                if ( dependentImage != NULL ) {
                    // don't try to initialize stuff "above" me yet
                    if ( libIsUpward(i) ) {
                        uninitUps.imagesAndPaths[uninitUps.count] = { dependentImage, libPath(i) };
                        uninitUps.count++;
                    }
                    else if ( dependentImage->fDepth >= fDepth ) {
                        dependentImage->recursiveInitialization(context, this_thread, libPath(i), timingInfo, uninitUps);
                    }
                }
            }
            
            // record termination order
            if ( this->needsTermination() )
                context.terminationRecorder(this);

            // let objc know we are about to initialize this image
            uint64_t t1 = mach_absolute_time();
            fState = dyld_image_state_dependents_initialized;
            oldState = fState;
            context.notifySingle(dyld_image_state_dependents_initialized, this, &timingInfo);
            
            // 初始化这个 image
            // initialize this image
            bool hasInitializers = this->doInitialization(context);

            // let anyone know we finished initializing this image
            fState = dyld_image_state_initialized;
            oldState = fState;
            context.notifySingle(dyld_image_state_initialized, this, NULL);
            
            if ( hasInitializers ) {
                uint64_t t2 = mach_absolute_time();
                timingInfo.addTime(this->getShortName(), t2-t1);
            }
        }
        catch (const char* msg) {
            // this image is not initialized
            fState = oldState;
            recursiveSpinUnLock();
            throw;
        }
    }

    recursiveSpinUnLock();
}
```

## ImageLoaderMachO::doInitialization

```c++
bool ImageLoaderMachO::doInitialization(const LinkContext& context)
{
    CRSetCrashLogMessage2(this->getPath());

    // mach-o has -init and static initializers
    doImageInit(context);
    doModInitFunctions(context);

    CRSetCrashLogMessage2(NULL);

    return (fHasDashInit || fHasInitializers);
}
```

## ImageLoaderMachO::doImageInit
```c++
void ImageLoaderMachO::doImageInit(const LinkContext& context)
{
    if ( fHasDashInit ) {
        const uint32_t cmd_count = ((macho_header*)fMachOData)->ncmds;
        const struct load_command* const cmds = (struct load_command*)&fMachOData[sizeof(macho_header)];
        const struct load_command* cmd = cmds;
        for (uint32_t i = 0; i < cmd_count; ++i) {
            switch (cmd->cmd) {
                case LC_ROUTINES_COMMAND:
                    Initializer func = (Initializer)(((struct macho_routines_command*)cmd)->init_address + fSlide);
    #if __has_feature(ptrauth_calls)
                    func = (Initializer)__builtin_ptrauth_sign_unauthenticated((void*)func, ptrauth_key_asia, 0);
    #endif
                    // <rdar://problem/8543820&9228031> verify initializers are in image
                    if ( ! this->containsAddress(stripPointer((void*)func)) ) {
                        dyld::throwf("initializer function %p not in mapped image for %s\n", func, this->getPath());
                    }
                    if ( ! dyld::gProcessInfo->libSystemInitialized ) {
                        // <rdar://problem/17973316> libSystem initializer must run first
                        dyld::throwf("-init function in image (%s) that does not link with libSystem.dylib\n", this->getPath());
                    }
                    if ( context.verboseInit )
                        dyld::log("dyld: calling -init function %p in %s\n", func, this->getPath());
                    {
                        dyld3::ScopedTimer(DBG_DYLD_TIMING_STATIC_INITIALIZER, (uint64_t)fMachOData, (uint64_t)func, 0);
                        func(context.argc, context.argv, context.envp, context.apple, &context.programVars);
                    }
                    break;
            }
            cmd = (const struct load_command*)(((char*)cmd)+cmd->cmdsize);
        }
    }
}
```
