---
title: OBS input-overlay 鼠标移动箭头抽搐
date: 2026-08-12 23:03:00
tags:
  - OBS
  - 插件
categories:
  - 技术
description: input-overlay 的鼠标移动箭头在鼠标停止后回到默认方向，斜向移动还会抖动。这篇文章记录问题原因和修复过程。
draft: false
---

之前在 OBS 里用 input-overlay 做键鼠输入显示时，鼠标移动箭头有两个问题：鼠标静止后箭头会回到默认方向，斜向移动时箭头会抖动。我朋友也遇到过同样的问题。

## 问题

- 鼠标静止后，箭头回到默认角度。
- 斜向移动时，箭头抖动明显。

## 说明

这个仓库是 [univrsal/input-overlay](https://github.com/univrsal/input-overlay) 的 fork，原作者版权和 GPLv2 许可不变。

## 发布版本

修复版做成基于官方 `v5.0.0` 的 fork，发布版本为：

```text
input-overlay 5.0.0-fixed.1
```

仓库地址：

```text
https://github.com/vemiy/input-overlay-fixed
```

Release：

```text
https://github.com/vemiy/input-overlay-fixed/releases/tag/v5.0.0-fixed.1
```

目前提供 Windows x64 的安装器和手动解压包：

```text
input-overlay-5.0.0-fixed.1-windows-x64-Installer.exe
input-overlay-5.0.0-fixed.1-windows-x64.zip
```

安装器会读取 OBS 的安装路径，直接装到插件目录。zip 则需要手动把 `obs-plugins` 和 `data` 两个文件夹分别放到 OBS 安装目录下对应的路径。
