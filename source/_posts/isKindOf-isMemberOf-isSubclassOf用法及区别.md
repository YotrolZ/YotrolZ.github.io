---
title: 'isKindOf,isMemberOf,isSubclassOf用法及区别'
abbrlink: c46b1cd
date: 2015-08-29 19:41:11
tags:
---


- isKindOfClass

> Returns a Boolean value that indicates whether the receiver is an instance of given class or an instance of any class that inherits from that class.

```objc
// 调用该方法的对象是aClass或其子类的一个对象，则返回YES；否则返回NO；
- (BOOL)isKindOfClass:(Class)aClass;
```
<!-- more -->

- isMemberOfClass

> Returns a Boolean value that indicates whether the receiver is an instance of a given class.

```objc
// 调用该方法的对象是参数类的一个对象，就返回YES，否则返回NO
- (BOOL)isMemberOfClass:(Class)aClass;
```


- isSubclassOfClass

> Returns a Boolean value that indicates whether the receiving class is a subclass of, or identical to, a given class.

```objc
// 调用该方法的类是aClass的子类或与aClass相同，则为YES，否则为NO。
+ (BOOL)isSubclassOfClass:(Class)aClass;
```

  