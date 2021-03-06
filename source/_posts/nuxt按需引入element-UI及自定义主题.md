---
title: nuxt按需引入element-UI及自定义主题
comments: true
categories:
  - nuxt
  - vue
tags:
  - nuxt按需加载
  - element-UI自定义主题
  - element-UI按需加载
abbrlink: '97624e89'
date: 2019-08-16 11:08:16
keywords: nuxt按需加载 element-UI按需加载 element-UI自定义主题
description: nuxt按需引入element-UI及自定义主题
---
## 前言
> 使用nuxt+element-UI开发的项目，在进行打包的时候打包提示vendor.xxxxx.js文件过大的警告，所以需要进行优化

## 打包分析
### nuxt配置打包分析
#### 说明：
  Nuxt.js 使用`webpack-bundle-analyzer`分析并可视化构建后的打包文件，你可以基于分析结果来决定如何优化它。
<!-- more -->

#### 配置：
  在`nuxt.config.js`文件中进行配置，具体配置如下：
  ```js
  module.exports = {
    build: {
      analyze: true
      // or
      analyze: {
        analyzerMode: 'static'
      }
    }
  }
  ```
  - 具体可参考官网配置说明[https://zh.nuxtjs.org/api/configuration-build#analyze](https://zh.nuxtjs.org/api/configuration-build#analyze)
#### 使用：
  可通过 `nuxt build --analyze` 或 `nuxt build -a` 命令来启用该分析器进行编译构建

#### 分析结果：
  ![nuxt build --analyze分析结果](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-dcd618eae83b9b16.png)

## 优化前
  按照上面的配置后我们可以看到分析结果，如下图：
  ![优化前](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-aceadb6939c8e417.png)

  可以看的出项目`element-UI`以及项目依赖的vue等js库都打包到vendor.xxxxx.js文件中了，随着引用的库越多，vendor.xxxxx.js文件肯定就是越大。(这里我们主要对`element-ui`库进行优化)

## 优化后
### 优化方案
  由于项目中并没有用到`element-UI`中的全部组件，所以我们的优化方案就是只引入我们使用的组件及样式；
### 优化步骤
#### 本地安装按需加载插件babel-plugin-component（已安装的忽略次步骤）
  `npm install babel-plugin-component -D`
#### 配置`nuxt.config.js`
  ```js
  // nuxt.config.js

  build: {
    ...other
    // 按需引入element-ui
    babel: {
      plugins: [
        [ "component", 
          {
            "libraryName": "element-ui",
            "styleLibraryName": "theme-chalk"
          }
        ] 
      ] 
    },
  },
  ```

#### 修改`plugins/element-ui.js`
  ```js
  // plugins/element-ui.js

  import Vue from 'vue'
  import locale from 'element-ui/lib/locale/lang/en'

  // 全局引用
  // import Element from 'element-ui'

  // 按需引用
  import { Button, Input } from 'element-ui'
  
  // 自定义主题样式(这里我们会在这个文件内引入我们所需的组件的样式)
  import '../assets/stylesheets/element-variables.scss'
  
  // Vue.use(Element, { locale })

  // 按需使用
  Vue.use(Button, { locale })
  Vue.use(Input, { locale })
  ```

#### 修改`element-variables.scss`
  ```js
  // element-variables.scss

  /* 改变主题色变量 */
  $--color-primary: teal;

  /* 改变 icon 字体路径变量，必需 */
  $--font-path: '../../node_modules/element-ui/lib/ theme-chalk/fonts';
  
  /* 样式--全局引入 */
  // @import "~element-ui/packages/theme-chalk/src/index";
  
  /* 样式--按需引入 */
  @import "../../node_modules/element-ui/packages/theme-chalk/src/button";
  @import "../../node_modules/element-ui/packages/theme-chalk/src/input";
  ```

### 优化结果
![优化结果](https://raw.githubusercontent.com/YotrolZ/hexo/master/img/590107-8e605500c8c12765.png)
