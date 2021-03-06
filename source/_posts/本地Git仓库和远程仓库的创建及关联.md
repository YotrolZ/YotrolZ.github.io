---
title: 本地Git仓库和远程仓库的创建及关联
comments: true
categories:
  - iOS
abbrlink: c6b5a9b8
date: 2015-07-21 21:06:25
tags:
  - Git
---
# 远程仓库
## 新建一个远程的仓库(空的)

![新建一个远程仓库](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-b418bdb7b2618512.png)
<!-- more -->

## 设置远程仓库的名字,并创建

![设置仓库名](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-966974948122a71e.png)

  **切记**:如果我们在创建远程仓库的时候添加了README和.ignore等文件,我们在后面关联仓库后,需要先执行`pull`操作

# 本地仓库
## 在本地创建一个本地的文件夹
![在本地创建一个文件夹](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-4dc8ff3f88197e85.png)

## 利用终端进入当前的文件夹目录
```
cd /Users/Sunshine/Documents/xxx/helloTest
```


## 初始化这个本地的文件夹为一个`Git`可以管理的仓库
```
git init
```
注意:Git会自动为我们创建唯一一个`master`分支
我们能够发现在当前目录下多了一个`.git`的目录，这个目录是Git来跟踪管理版本库的，千万不要手动修改这个目录里面的文件，不然改乱了，就把Git仓库给破坏了。

![初始化本地的仓库](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-5d56d64385c58de1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


# 将本地的仓库和远程的仓库进行关联
```
git remote add origin git@github.com:YotrolZ/helloTest.git
```
备注:`origin`就是我们的远程库的名字，这是Git默认的叫法，`也可以改成别的`;
     `git@github.com:YotrolZ/helloTest.git`是我们远程仓库的路径(这里我们使用的github)

![将本地的仓库与远程的仓库进行关联](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-eb043bab35f1f385.png)

# 后续开发
- 完成上面的步骤后我们就可以开始在本地的文件夹中做事了,这里我们先创建一个`main.m`文件

## 新建文件操作
### 新建文件

```
touch main.m
```

### 添加到本地Git仓库进行管理(暂存区)

```
git add main.m
```

- 将新建的main.m文件添加到仓库(这样git就会`追踪`这个文件)

### 提交修改到本地Git仓库

```
git commit -m "新建了一个man.m文件"
```

- 把文件提交到仓库

![在本地仓库新建一个main.m文件](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-dc8057577858eee2.png)


### 把本地库的内容推送到远程

```
git push -u origin master
```
- 备注:`origin`:远程仓库名字;    `master`:分支
- 注意:我们第一次`push`的时候,加上`-u`参数,Git就会把本地的master分支和远程的master分支进行关联起来,我们以后的`push`操作就不再需要加上`-u`参数了

![push到远程的仓库](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-11a791bf3ba8c621.png)

- 我们用浏览器进入远程仓库中查看,发现远程仓库中也出现了`mian.m`文件
![远程仓库中也有了一个main.m文件](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-831ffcf600a81ceb.png)

## 文件修改操作
### 修改文件
- 假如某天我们又对mian.m文件进行了修改(这里我们在main.m文件里面添加了一句"hello world")
![修改main.m文件](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-e77ba295b3b51acc.png)

- 我们可以利用`git status`查看状态
![查看状态](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-e4c0e7a283e27493.png)

### 提交文件修改到暂存区
- 将文件添加到Git版本库,实际上就是把`文件修改`添加到`暂存区`
```
git add main.m
git commit -m "修改了man.m文件"
```

- 提交修改,实际上就是把`暂存区`的所有内容提交到`当前分支`。
![提交修改](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-a118eb21f387fbd7.png)


- 再次查看状态
```
git status
```
![再次查看状态](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-6f83676a4446bd4b.png)


### 推送至GitHub上的远程仓库
```
git push origin master
```
![将修改后的main.m文件push到远程仓库](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-2587f175710e86ef.png)


- 利用浏览器在远程仓库查看,我们看到已经将本地上的修改推送到远程仓库了
![在远程仓库中查看](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-9686ee29d6eb11b1.png)


# 总结

## 初始化一个本地Git仓库 
- 初始化一个本地Git仓库(把本地的文件夹初始化成一个Git可以管理的版本库)
```
git init
```
注意:需让命令行终端处在`当前文件目录`下

## 把文件添加到本地Git仓库 
- 把文件添加到本地版本库
```
git add 文件名
```
## 把文件修改提交到本地Git仓库
```
git commit -m "注释"
```

## 关联一个远程仓库
```
git remote add origin git@github.com:YotrolZ/helloTest.git
```

## 将最新的修改推送到远程仓库
```
git push -u origin master
```
- 注意:
    - 1.每次push前要先进行`git add 文件名` 和  `git commit -m "注释"`
    - 2.在第一次进行push时,我们加上`-u`参数,后期push时就不用再加`-u`参数
