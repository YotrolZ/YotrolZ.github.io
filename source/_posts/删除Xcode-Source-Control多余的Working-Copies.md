---
title: 删除Xcode Source Control多余的Working Copies
abbrlink: 8d6a4db4
date: 2016-05-04 10:50:40
tags:
---


由于公司最近开发新项目,在SVN上重新建了仓库,在一次提交代码的时候发现有点不对劲,莫名其妙的在Xcode `Source Control -> Working Copies` 下有两个远程的仓库(一个是之前的老项目.一个是现在的新项目),见下图

![Working Copies](http://upload-images.jianshu.io/upload_images/590107-be6158dd2ee39871.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

<!-- more -->

这个其实并不影响开发,但是对于强迫症的人来说也格外不爽,比如:(为了方便观看,将文件目录收缩了)
![提交代码](http://upload-images.jianshu.io/upload_images/590107-6bb1c110d0fb14bb.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

每次提交为什么总是要提示老项目(表示已经被老项目折磨的体无完肤...)等等

> 解决办法


- 1.进入新项目的所在的文件夹->找到`项目名称.xcodeproj`-> 右击:显示包内容

![](http://upload-images.jianshu.io/upload_images/590107-0e5d9a44e078f9f4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 2.找到`project.xcworkspace`->右击:显示包内容

![](http://upload-images.jianshu.io/upload_images/590107-d995fea464962886.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 3.找到`xcshareddata` -> `项目名称.xcscmblueprint`文件,并且用文本编辑器打开

![文本编辑器打开:项目名称.xcscmblueprint](http://upload-images.jianshu.io/upload_images/590107-ab53a0430a05c603.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 4.修改`项目名称.xcscmblueprint`文件
用文本编辑器打开后你会看到,大概是这个样子
![项目名称.xcscmblueprint](http://upload-images.jianshu.io/upload_images/590107-59d897ace6173d83.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在
`DVTSourceControlWorkspaceBlueprintWorkingCopyRepositoryLocationsKey `
`DVTSourceControlWorkspaceBlueprintWorkingCopyStatesKey `
`DVTSourceControlWorkspaceBlueprintWorkingCopyPathsKey `
`DVTSourceControlWorkspaceBlueprintRemoteRepositoriesKey `
下面分别各有两个值,这就是问题的所在,我们只需删除我们不需要的并`保存`即可,见下图

![删除不需要的并保存](http://upload-images.jianshu.io/upload_images/590107-3ff455ea542968ea.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 5.重启Xcode

![重启Xcode后Working Copies](http://upload-images.jianshu.io/upload_images/590107-2f9d4b451ffcf5c6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

