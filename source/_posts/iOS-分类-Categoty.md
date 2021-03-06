---
title: iOS 分类(Categoty)
categories:
  - iOS
abbrlink: 638a6f77
date: 2019-08-25 10:11:30
tags:
---

## Categoty 底层结构

在`objc-runtime-new.h`中有定义
```objc
struct category_t {
    const char *name;
    classref_t cls;
    struct method_list_t *instanceMethods;
    struct method_list_t *classMethods;
    struct protocol_list_t *protocols;
    struct property_list_t *instanceProperties;
    // Fields below this point are not always present on disk.
    struct property_list_t *_classProperties;

    method_list_t *methodsForMeta(bool isMeta) {
        if (isMeta) return classMethods;
        else return instanceMethods;
    }

    property_list_t *propertiesForMeta(bool isMeta, struct header_info *hi);
};
```
<!-- more -->

## Categoty 加载顺序

- 通过Runtime加载类的所有分类；
- 把所有分类的方法、属性、协议 合并到一个大数组中；
    - 后参与编译的分类数据会在数组的前面；
    - 也就是说后参与编译的分类数据会覆盖先编译的相同的的数据，如：相同的方法；
- 将合并后的分类数据（方法、属性、协议），插入到类原来的数据的前面；
    - 这也就造成了分类中的方法会覆盖掉类中的相同的方法；

![Categoty 加载顺序-源码分析](https://upload-images.jianshu.io/upload_images/590107-cec967d140f1dedb.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
