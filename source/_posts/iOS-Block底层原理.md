---
title: iOS Block底层原理
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

![最普通的Block](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vkpdbpxj31hf0u0wlp.jpg)

### 带参数的Block
![带参数的Block](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vl1ca8zj31g40u0n3j.jpg)

### 访问了外部 auto 变量的Block
![访问了外部 auto 变量的Block](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vinbabpj31gu0u0tgh.jpg)

### 访问了外部 static 变量的Block
![访问了外部 static 变量的Block](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vinbabpj31gu0u0tgh.jpg)

### 访问了全局变量的Block
![访问了全局变量的Block](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vke9h90j31fq0u0q88.jpg)


## Block的本质及类型
![Block的本质及类型](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vlhfo54j31ps0u0jwn.jpg)

![Block的本质及类型](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vlsvl2nj31k10u0jye.jpg)

![Block的本质及类型](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vlxw4fej32960n8n1j.jpg)

![Block的本质及类型](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vm35jz2j32bo0m841n.jpg)


## Block的Copy操作

![Block的Copy操作](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vmehynyj31jm0u079w.jpg)

![Block的Copy操作](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vmikprkj32cc0ng78f.jpg)

## Block的变量捕获

![Block的变量捕获](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vn9cjglj31hs0u0wor.jpg)

![Block的变量捕获](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vnhaejtj31ha0u047l.jpg)

![Block的变量捕获](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vnkklw3j31ft0u0ajl.jpg)

![Block的变量捕获](https://tva1.sinaimg.cn/large/0081Kckwly1gk2vnotm8lj31np0u0gst.jpg)




