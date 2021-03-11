---
title: iOS逆向-SSH WiFi连接不上
abbrlink: edadc223
date: 2018-01-20 10:59:23
tags:
---


> SSH WiFi的方法链接不上的解决方法
- 如果你在SSH WiFi链接越狱设备的时候卡住,如下:可以试试下面的方法:
![卡住无反应](http://upload-images.jianshu.io/upload_images/590107-26ecc271b7cbcce9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 注:一般越狱机的系统在iOS 10以上会出现SSH WiFi链接不上的问题
- iOS 10的越狱环境已经自带了SSH,我们不需要安装 open SSH 了,直接去Cydia里面卸载!

<!-- more -->

-下面开始操作:
  - 1.先用USB链接越狱设备,可以通过PP助手进入`/private/var/containers/Bundle/Application/xxxxx-xxxxx-xxxxx/yalu102.app/`,这里的`xxxxxxx-xxxxxx-xxxxx`一般是一堆数字,最笨的方法就是挨个点击进入看看有否有`yalu102.app`,找到后我们进行下一步;
![yalu102目录](http://upload-images.jianshu.io/upload_images/590107-87a2f706c9d5fd14.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 2.进入`yalu 102.app`,找到`dropbear.plist`文件
![dropbear.plist](http://upload-images.jianshu.io/upload_images/590107-78d2518d534387ae.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 3.打开`dropbear.plist`文件,将`127.0.0.1:22`修改成`22`,如下:
![将127.0.0.1:22修改成22](http://upload-images.jianshu.io/upload_images/590107-492b59c7e6261913.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 4.修改完成后保存,再次打开查看是否修改成功,如果没有成功的话,可以将`dropbear.plist`文件导出到Mac修改,然后将修改后的`dropbear.plist`文件再导入到原来的位置进行替换即可

- 5. 确保修改成功后,将`越狱设备重启`,此时你可能还需要重新激活越狱环境;

- 6.激活越狱环境后,快来试试 SSH WiFi链接吧;
`ssh root@你的设备ip`


