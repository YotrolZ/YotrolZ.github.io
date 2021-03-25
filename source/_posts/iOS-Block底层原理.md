---
title: 图解iOS Block底层原理
abbrlink: d115d42e
date: 2019-09-22 16:56:00
tags:
---

## Block的底层结构
- 最普通的Block
- 带`参数`的Block
- 访问了外部`auto变量`的Block
- 访问了外部`static变量`的Block
- 访问了`全局变量`的Block

<!-- more -->

### 最普通的Block

![最普通的Block](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/最普通的Block.jpeg)

### 带参数的Block
![带参数的Block](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/带参数的Block.jpeg)

### 访问了外部 auto 变量的Block
![访问了外部 auto 变量的Block](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/访问了外部auto变量的Block.jpeg)

### 访问了外部 static 变量的Block
![访问了外部 static 变量的Block](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/访问了外部static变量的Block.jpeg)

### 访问了全局变量的Block
![访问了全局变量的Block](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/访问了全局变量的Block.jpeg)


## Block的本质及类型
![Block的本质及类型](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/Block的本质及类型.jpeg)

![Block的本质及类型](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/Block的本质及类型-2.jpeg)

![Block的本质及类型](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/Block的本质及类型-3.jpeg)

![Block的本质及类型](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/Block的本质及类型-总结.jpeg)


## Block的Copy操作

![Block的Copy操作](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/Block的Copy操作-1.jpeg)

![Block的Copy操作](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/Block的Copy操作-2.jpeg)

## Block的变量捕获

![Block的变量捕获](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/Block的变量捕获-1.jpeg)

![Block的变量捕获](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/Block的变量捕获-2.jpeg)

![Block的变量捕获](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/Block的变量捕获-3.jpeg)

![Block的变量捕获](https://cdn.jsdelivr.net/gh/yotrolz/image@master/blog/图解iOS-Block底层原理/Block的变量捕获-4.jpeg)




