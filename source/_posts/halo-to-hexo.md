---
title: 从 Halo 迁移到 Hexo 静态博客
date: 2026-08-12 00:00:00
tags:
  - Hexo
  - 迁移
  - 博客
categories:
  - 技术
description: 记录我的博客从 Halo 动态站迁移到 Hexo 静态站的全过程，包括文章、评论、图片和数据迁移，以及踩过的坑。
draft: false
---

我的博客原本跑在 Halo 上，用了一段时间，但一直有几个问题：国内访问慢、维护成本高、想改个样式还得去后台各种设置里找，直接改源码又有很多兼容性问题。索性决定整体迁到 Hexo。这篇文章把整个迁移过程记录下来，包括文章、图片、评论的数据迁移，希望能帮到有同样想法的人。

## 为什么迁移

先说动机，不然忙活几天容易中途放弃：

- **国内访问慢**：动态站每个页面都要实时渲染，套上 CDN 和缓存后虽然算能看，但缓存规则花了不少功夫，属于治标不治本。
- **维护成本**：服务器要常驻跑容器和数据库，还有插件更新、备份这些事，博客本身却没什么动态功能，而静态站足够单纯，不会把一个简单的博客搞那么复杂。
- **部署成本几乎为零**：不需要自己准备一台服务器，直接丢到 Cloudflare Pages 免费托管，域名绑定完就完事。

## 迁移前备份

动数据之前先备份。Halo 后台自带完整备份功能，设置里点一下就会生成一个 zip 包。

这个 zip 里最重要的东西是 `extensions.data`——Halo 把文章、评论、单页、设置等所有实体都按 base64 编码存在这个文件里。数据库层面它对应一张 `extensions` 表，字段很简单：

```text
name    varchar(255)  # 实体名
data    bytea         # 实体内容（JSON）
version bigint
```

备份包下载下来放好，后面迁移全靠它。

## 文章迁移

Halo 的存储原理：文章正文不在文章实体里，而是存在独立的 `Snapshot` 快照实体中，通过 `subjectRef` 关联回文章。每篇文章有一串快照，像 Git 的提交链——第一个快照（`baseSnapshot`）没有父快照，之后的快照用 `parentSnapshotName` 指向前一个，`rawPatch` 记录相对前一个的改动。所以直接读数据库只会看到一堆补丁，需要从 `baseSnapshot` 沿链把每个 `rawPatch` 依次套上，才能还原出完整 HTML。`rawPatch` 是一串 JSON 行级补丁，本质和 Git 打 patch 一样。

迁移时这部分直接让 AI 搞定：遍历 `extensions.data` 解码所有实体，筛出 `kind=Post` 的文章，按快照链还原正文；`title`、`date`、`tags`、`categories` 也从实体数据里取（标签分类是单独的 `Tag`/`Category` 实体，先解码拿名字），HTML 转 Markdown 后批量生成 Hexo 文章文件。

## 图片迁移

原来的图片都存在 Halo 的附件目录里，正好趁迁移一起换到 R2 对象存储，并绑了自定义域名。

图片链接变成：

```text
https://img.vemiy.com/img/xxxx.webp
```

## 评论迁移

评论系统选用了 Twikoo，部署在了 Vercel 上面，本来想用 giscus 让博客更纯粹，但是考虑到用户需要用 GitHub 登录，国内使用不太方便，且样式比较突兀，修改起来也麻烦，所以才用了 Twikoo。

接下来难点在于把 Halo 的评论搬过去。

Halo 的评论分散在两个实体里：访客发的评论在 `comments`，回复在 `replies`。这里有个坑：**站长在后台登录后发的"评论"，其实也是 `replies` 实体，不是 `comments`**。如果只导 `comments`，站长的回复会全部丢失。

评论/回复实体比文章简单得多：就是普通的 base64 实体，内容直接存在 `spec.raw`（原文）和 `spec.content`（渲染后的 HTML）里，解码就能拿到，不需要像文章那样还原快照。然后让 AI 把每条评论的字段（昵称、邮箱、网站、内容、时间等）映射成 Twikoo 导入格式，生成一个 JSON 文件，访客评论在 Twikoo 管理后台导入就行。站长评论（`replies` 里那几条）当时没包含在这个文件里，是单独调 Twikoo 的管理接口补进去的（`accessToken` 用后台密码的 MD5）。

两条站长回复按原时间线补上，评论区才算完整。头像走 Gravatar 这类通用头像服务，评论者的邮箱和网站信息都能保留。

## 部署上线

部署用的是 Cloudflare Pages：

1. 博客源码推到 GitHub 仓库。
2. Cloudflare Pages 关联仓库，构建命令填 `npx hexo generate`，输出目录 `public`。
3. 绑定自定义域名 `www.vemiy.com`。
4. 确认线上正常后，停掉旧的 Halo 容器。

之后的发布流程变成：写完文章 → git 推送 → 一两分钟后自动上线，全程不需要碰服务器。
