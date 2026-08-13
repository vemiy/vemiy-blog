---
title: "Win11恢复旧版开始菜单"
date: 2026-04-10
description: "Win11 新版开始菜单不好用？用 ViVeTool 恢复旧版开始菜单的详细教程。"
categories:
  - "软件"
tags:
  - "Windows"
draft: false
---

莫名奇妙的windows这个开始菜单给我看吐了，于是分享一下如何改回旧版。

![新版开始菜单](https://img.vemiy.com/img/15b649bc-2010-41a6-ae3c-8521166ca1fd.webp)

## 开始操作

开始之前如果怕出问题记得先创建系统还原点或者备份系统。

首先在官网下载[ViVeTool](https://vivetool.com/download/)，或者在[github](https://github.com/thebookisclosed/ViVe/releases)下载最新版。

下载后的压缩包解压到一个文件夹里。

![ViVeTool](https://img.vemiy.com/img/0fc807ff-84eb-4d4a-9704-c8643302caec.webp)

按WIN+R，输入cmd，并按CTRL+SHIFT+ENTER。

先切换到刚才解压到的文件夹的目录。

```bat
cd /d "E:\ViVeTool-v0.3.3"
```

再输入以下命令后回车。

```bat
vivetool /disable /id:57048231,47205210,56328729,48433719
```

提示这些说明成功了：

ViVeTool v0.3.3 - Windows feature configuration tool

Successfully set feature configuration(s)

最后重启电脑就好了。

让我们来欣赏一下原本的开始菜单。

![旧版开始菜单](https://img.vemiy.com/img/20f9e359-bf06-439e-8df6-523e660a5ab8.webp)
