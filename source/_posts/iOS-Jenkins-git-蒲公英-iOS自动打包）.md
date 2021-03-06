---
title: iOS+Jenkins+git+蒲公英 (iOS自动打包）
abbrlink: e07c4cd6
date: 2017-06-21 10:36:04
tags:
---


![](http://upload-images.jianshu.io/upload_images/590107-dc58ad8f1d6f8129.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
## 1、Jenkins的安装与启动
- 方式一：直接下载安装包
https://jenkins.io/index.html
安装完成后在 Terminal 中输入，即可打开 Jenkins。
```
open /Applications/Jenkins/jenkins.war
```

- 方式二：使用homebrew
  1. 安装 homebrew（如果已经安装，跳过此步）
    ```
    ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    ```

  2. 安装 Jenkins
    ```
  brew install jenkins     
  ```  

  3.启动 Jenkins
  ```
  jenkins
  ```

## 2、访问Jenkins
- 当Jenkins启动后，浏览器中输入  http://localhost:8080/

- 使用安装包安装会自动弹出了浏览器打开

- 如果端口冲突那么请修改端口
```
defaults write /Library/Preferences/org.jenkins-ci httpPort xxxx
```
![](http://upload-images.jianshu.io/upload_images/590107-2e947f45037f0381.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 请前往图中红字所示地址
![受保护-请修改文件访问权限](http://upload-images.jianshu.io/upload_images/590107-c40bddef94c4f86d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 修改文件访问权限后，进入该文件夹中，将`initialAdminPassword`中的密码拷贝到输入框，点击`continue`

- 下载插件
![选择左边-安装建议的插件](http://upload-images.jianshu.io/upload_images/590107-dcb0e7074609d615.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 插件安装中。。。
![插件安装中](http://upload-images.jianshu.io/upload_images/590107-cff5482499c94487.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 插件安装完毕，创建账户->`Save and Finish`
![创建管理员账户](http://upload-images.jianshu.io/upload_images/590107-cf6aea14195ed426.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 账户创建成功

## 3、Jenkins插件安装
- 依次安装以下Jenkins插件
```
GitLab
Xcode integration
Keychains and Provisioning Profiles Management
```

- 插件安装步骤
![进入插件管理页面](http://upload-images.jianshu.io/upload_images/590107-434038a2912b1fa9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![搜索并安装插件](http://upload-images.jianshu.io/upload_images/590107-c2f49af7c047b3ee.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 4、创建Jenkins任务
- 回到Jenkins首页，点击`新建`
![创建Jenkins任务](http://upload-images.jianshu.io/upload_images/590107-efe92edfb9f37717.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 5、配置刚刚创建好的Jenkins任务
#### 5.1、设置源码管理（这里我们使用的是git）
![配置Git远程仓库](http://upload-images.jianshu.io/upload_images/590107-91b8e142ec059222.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 设置Gredentials
![进入Gredentials页面](http://upload-images.jianshu.io/upload_images/590107-314317f40aa835a7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![创建](http://upload-images.jianshu.io/upload_images/590107-3b68540b0ceaf7d6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![配置](http://upload-images.jianshu.io/upload_images/590107-c1fafb236668c622.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 如果不清楚上如中的`Key`, 应该填什么，请看下面
1、前往文件夹
```
 ~/.ssh/id_rsa
```
2、用文本编辑器打开`id_rsa`, 拷贝里面的内容到上图中`Key`的输入框，如下图
  ![~/.ssh/id_rsa](http://upload-images.jianshu.io/upload_images/590107-535a453b70136339.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 配置好Credential, 点击ok，再次回到项目的`源码管理`,选择Gredentials为我们刚刚创建的，如图
![选择Gredentials](http://upload-images.jianshu.io/upload_images/590107-765a020e8d0863a7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### 5.2、设置构建触发器（可以触发构建操作的配置）
![非必填，不配置的话需要手动点击构建](http://upload-images.jianshu.io/upload_images/590107-42d1da1fdc261a8a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### 5.3、设置构建环境，这里我们选择`Keychains and Code Signing Identities`

- 勾选`Keychains and Code Signing Identities`

- 配置`Keychain`和` Provisioning Profiles`
    - 保存后进入`Keychains and Provisioning Profiles Management`页面，如果没有该选项，请参考上述`第三步：Jenkins插件`安装来安装`Keychains and Provisioning Profiles Management`插件
![进入`Keychains and Provisioning Profiles Management`页面](http://upload-images.jianshu.io/upload_images/590107-a67676aed151ce9a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
   - 
![配置`Keychain`和` Provisioning Profiles`](http://upload-images.jianshu.io/upload_images/590107-458c88c5b7258a60.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![上图中的的`Code Sining Identities`来源(钥匙串中)](http://upload-images.jianshu.io/upload_images/590107-46823912e5866f36.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 注意：保存后，在`/Users/Shared/Jenkins`文件夹下如图：
![需要出现`Keychains`和`MobileDevice`文件夹](http://upload-images.jianshu.io/upload_images/590107-32c0a3562d782b64.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
如果未出现：
1、直接将`/Users/‘你的用户名’/Library/Keychains`文件夹拷贝到`/Users/Shared/Jenkins`文件夹下；
2、直接将`/Users/‘你的用户名’/Library/MobileDevice`文件夹拷贝到`/Users/Shared/Jenkins`文件夹下；

- 注意：这里配置的证书是将来用来打包项目用的证书，必须与你将要打包的Xcode项目中的配置一致！！！
- 注意：这里配置的证书是将来用来打包项目用的证书，必须与你将要打包的Xcode项目中的配置一致！！！
- 注意：这里配置的证书是将来用来打包项目用的证书，必须与你将要打包的Xcode项目中的配置一致！！！

- 需要手动配置Xcode项目的profile文件，不要使用`Auto........`,这里不再说明如何手动配置Xcode项目的profile文件
至此，我们完成如下图的构建环境配置（如下图）
![构建环境配置](http://upload-images.jianshu.io/upload_images/590107-1935ff0937c69a92.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


#### 5.4、设置构建操作（这里我们选择`Xcode`）

- 点击增加构建步骤， 选择Xcode
- 如果没有Xcode选项，请参考上述`第三步：Jenkins插件`安装来安装`Xcode integration`插件
![增加构建步骤-Xcode](http://upload-images.jianshu.io/upload_images/590107-1d7cd44873448e41.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 配置Xcode构建步骤
  -  配置`General build settings`
![General build settings](http://upload-images.jianshu.io/upload_images/590107-29ee273591301013.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

  - 配置`Code signing & OS X keychain options`
![Code signing & OS X keychain options](http://upload-images.jianshu.io/upload_images/590107-c63c0e36bfc45576.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

  -  配置`Advanced Xcode build options`
![Advanced Xcode build options](http://upload-images.jianshu.io/upload_images/590107-e594f8bee6a79572.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 此时我们所有的打包操作已经完毕，如果你仅仅是打包用，到此你可以点击保存，点击`立即构建`，进行构建操作了

![立即构建](http://upload-images.jianshu.io/upload_images/590107-062b0ae9fb30fcc8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

既然已经做到这一步（自动打包），我们还可以配置一些构建操作，将打包后的IPA文件上传到蒲公英，便于测试！配置如下：

- 1、在蒲公英网站上创建用户，获取到`userKey`和`apiKey`
- 2、在Jenkins上再次配置下我们之前配置好的项目，在之前添加的`Xcode`构建步骤下，新增一个`Execute shell`构建步骤，如图：
![Execute shell](http://upload-images.jianshu.io/upload_images/590107-232d94822576574b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
- 3、在`command`中填写如下命令：

```
#蒲公英上的User Key
uKey="xxxxxxxxxxxxxxxxxxxxxxxx"

#蒲公英上的API Key
apiKey="xxxxxxxxxxxxxxxxxxxxxxxx"

#要上传的ipa文件路径
IPA_PATH="我们打包后的IPA文件地址"

#执行上传至蒲公英的命令，这句不需要修改
curl -F "file=@${IPA_PATH}" -F "uKey=${uKey}" -F "_api_key=${apiKey}" https://www.pgyer.com/apiv1/app/upload
```
- 配置完毕，点击保存，我们再次构建我们的项目，如果不出意外，我们看到的是这样的标志
![构建成功](http://upload-images.jianshu.io/upload_images/590107-47ad1b10c8040920.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
说明我们的项目构建成功，并成功发布到蒲公英，快去蒲公英上看看吧~~


## 6、常见报错及解决办法
1、This project contains no schemes
![This project contains no schemes](http://upload-images.jianshu.io/upload_images/590107-f931c2e4070d605b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
- 解决办法：
![勾选shared](http://upload-images.jianshu.io/upload_images/590107-f98d06a7ccc900d6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 注意点：
  - 这里我们不能去Jenkins项目目录下修改Xcode项目的shared勾选，我们应该在本地的开发源码上修改，然后提交到git远程仓库，再次构建！！！
  - 由于gitignor文件，我们有可能没有注意的情况下，并没有将shared勾选这个设置提交到远程仓库，导致再次侯建依旧失败！
![](http://upload-images.jianshu.io/upload_images/590107-71fbbf44f2cb8aaa.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)