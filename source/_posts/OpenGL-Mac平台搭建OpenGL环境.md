---
title: OpenGL_Mac平台搭建OpenGL环境
abbrlink: d910df91
date: 2018-03-16 10:59:59
tags:
---


> **1、创建一个Mac应用工程**
- 打开Xcode --> Creat a new Xcode project -->  macOS --> Cocoa App

<!-- more -->

- ![新建一个Mac应用程序](https://upload-images.jianshu.io/upload_images/590107-f8f60fb967683126.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **2、添加系统库**
- 添加`OpenGL.framework` 和 `GLUT.framework`两个系统库
- ![添加系统库](https://upload-images.jianshu.io/upload_images/590107-b4bea138cbde1fbf.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


> **3、添加OpenGL工具库，并在Bulid Settings 的 Header Search path 中配置 `CLTool.h` 和 `glew.h` 路径**
- 文件(`include文件夹`和`libGLTools.a`)可从Demo中获取
- ![添加OpenGL工具库](https://upload-images.jianshu.io/upload_images/590107-6625ec3d1e626471.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
- ![在Bulid Settings 的 Header Search path 中配置CLTool.h和glew.h的路径](https://upload-images.jianshu.io/upload_images/590107-3e3dd9dcd3778f1e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **4、删除不需要的文件**
- ![删除选中的文件](https://upload-images.jianshu.io/upload_images/590107-facfac519e0718e1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **5、新建`main.cpp`文件**
- ![新建文件并选择 C++ File](https://upload-images.jianshu.io/upload_images/590107-1b839764b0a730f0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- ![填写文件名称“main”，并取消打钩](https://upload-images.jianshu.io/upload_images/590107-e57a6d78fa3647cc.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> **6、修改main.cpp文件**
- 在main.cpp文件中添加如下代码，先不用搞懂什么意思，后面再做介绍
```
#include "GLTools.h"
#include <GLUT/GLUT.h>

void draw() {
    
    glClear(GL_COLOR_BUFFER_BIT);
    glColor3f(1.0f, 0.0f, 0.0f); 
 
    glBegin(GL_POLYGON);
    glVertex2f(-0.5f, 0.0f);
    glVertex2f(0.5f, 0.0f);
    glVertex2f(0.0f, 0.5f);
    glEnd();
    
    glFlush();
}

int main(int argc,const char *argv[]) {
    
    glutInit(&argc, (char **)argv);
    glutCreateWindow("OpenGL环境搭建--显示三角形");
    glutDisplayFunc(draw);
    glutMainLoop();
    
    return 0;
}
```

> **7、运行程序**
- 如果没有问题的话你应该看到如下图案，至此我们的OpenGL搭建工作也告一段落
- ![运行结果](https://upload-images.jianshu.io/upload_images/590107-0632d0f5f149a965.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)






