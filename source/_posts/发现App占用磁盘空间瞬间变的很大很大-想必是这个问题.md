---
title: 发现App占用磁盘空间瞬间变的很大很大.想必是这个问题
abbrlink: ae72db13
date: 2016-04-09 10:49:53
tags:
---

这些天在开发公司产品新版本、开发中突然注意到我们的App占用了我5个多G的磁盘空间,况且我还是经常重装调试，想必这肯定是哪里出现了问题,回家后用越狱机查看该App磁盘文件占用情况,发现了这5个G左右的磁盘占用基本都来此一个出处:沙盒中`temp`文件夹下的一个名为`stack-logs.xxxxx.index`的文件,查阅资料后发现这与Xcode设置有关,突然想起来,前几天调试BUG将`Scheme`中的`logging`选项下的`Malloc Stack`给打钩了,想必肯定是此处忘记取消打钩了.
于是乎做了如下验证,将`Mallo Stack`取消打钩,重装App,用pp助手检测该App占用磁盘空间,发现在`tmp`下并没有发现之前的那个文件`stack-logs.xxxxx.index`,磁盘占用量也处于稳定状态(1~2M),并没有出现暴涨的情况,看来真是这个东西在做鬼.
为了更加认定是这个`Malloc Stack`在做鬼,于是又将`Mallo Stack`打钩,问题又出现了,刚装App,用PP助手立即查看App磁盘占用,瞬间已经暴涨到了`80+M`,哎呀我的小心脏,查看文件结构后发现,又是`tmp`下的`stack-logs.xxxxx.index`在做鬼,上图留念一下:

<!-- more -->

![App沙盒目录](http://upload-images.jianshu.io/upload_images/590107-03e73a7087fd90f1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![沙盒tmp文件夹下](http://upload-images.jianshu.io/upload_images/590107-c2e5c564caecd32e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

随手滑动了几下,又切换了几个页面便是这样一种情况,吓人啊.


![随手滑动了几下之后](http://upload-images.jianshu.io/upload_images/590107-ebbd1d11fef3bc07.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

此时此刻你还在什么,如果遇见类似问题立马查看你是不是也将`Malloc Stack`给打钩了(`Malloc Stack`设置如下图);


![Malloc Stack 设置页面](http://upload-images.jianshu.io/upload_images/590107-abc4f4aa3e7dd1f2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


最后,如果细心的同学在App运行的时候能在控制器看到类似的话语

![开启Malloc Stack后控制台提示](http://upload-images.jianshu.io/upload_images/590107-1c20c587763ce727.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)