---
title: nonnull、nullable、null_resettable、__null_unspecified
abbrlink: 2b53fdc4
date: 2016-11-21 10:51:57
tags:
---


> nonnull : 不能为空

- 使用方法:
```
@property (nonatomic, copy, nonnull) NSString   *name1;
@property (nonatomic, copy) NSString * _Nonnull  name2;
@property (nonatomic, copy) NSString * __nonnull name3;
```
![nonnull三种用法](http://upload-images.jianshu.io/upload_images/590107-92c4b5de1d6b1c4a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

<!-- more -->

> nullable : 可以为空

- 使用方法:
```
@property (nonatomic, copy, nullable)  NSString  *name1;
@property (nonatomic, copy) NSString *_Nullable  name2;
@property (nonatomic, copy) NSString *__nullable name3;
```
![nullable三种方法](http://upload-images.jianshu.io/upload_images/590107-829f408488ec279e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> null_resettable : get方法不能返回空, set方法可以为空

- 使用方法:
```
@property (nonatomic, strong, null_resettable) NSString *name;
```
![null_resettable使用方法.png](http://upload-images.jianshu.io/upload_images/590107-9e558ca75d2e7a48.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


> _Null_unspecified : 不确定是否为空

- 使用方法:
```
@property (nonatomic, strong) NSString *_Null_unspecified  name1;
@property (nonatomic, strong) NSString *__null_unspecified name2;
```
![_Null_unspecified2种方法.png](http://upload-images.jianshu.io/upload_images/590107-02f4b7ee43b3fece.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

注意点:
> 不能修饰一般数据类型

![不能修饰一般数据类型](http://upload-images.jianshu.io/upload_images/590107-599fa7f88114484f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)