---
title: "Cloudflare SaaS 回源 优选域名配置"
date: 2026-04-21
description: "使用 Cloudflare SaaS 功能实现回源与优选域名配置的实操记录，单个域名即可完成接入。"
categories:
  - "建站"
tags:
  - "Cloudflare"
draft: false
---

这篇文章是一个 Cloudflare SaaS 回源优选配置思路。

这里仅演示只使用一个域名的案例。

为了方便说明，下面统一用这几个示例，实际根据自身情况修改：

- `www.example.com`：最终访问域名
- `cdn.example.com`：优选入口域名
- `origin.example.com`：源站回源域名
- `cf.090227.xyz`：优选域名，可以从 <https://cf.090227.xyz> 里面挑选优选域名

## 一、DNS 配置

进入 Cloudflare 的 DNS 页面，添加这三条记录：

### 1. 添加 `origin.example.com`

这条记录指真实服务器 IP。

- 类型：根据情况选择 `A` 或者 `AAAA`
- 名称：`origin`
- 内容：服务器的公网 IP
- 代理状态：**已代理（橙云）**

### 2. 添加 `cdn.example.com`

这条记录指向优选域名：

- 类型：`CNAME`
- 名称：`cdn`
- 目标：优选域名，例如 `youxuan.cf.090227.xyz`
- 代理状态：**仅 DNS（灰云）**

### 3. 添加 `www.example.com`

这条记录指向 `cdn.example.com`：

- 类型：`CNAME`
- 名称：`www`
- 目标：`cdn.example.com`
- 代理状态：**仅 DNS（灰云）**

到这里既然最终就是走优选，为什么不直接把 `www.example.com`去 CNAME 到优选域名上？

确实可以直接 CNAME，但是如果有好几个站，那么要换优选域名的话就得一个一个换。

而这样做只需要改 `cdn.example.com`这条记录就够了。

这里提一嘴反向代理，可以把 `www.example.com`正常反代到网站后端地址，

`origin.example.com`不作为站点入口，可直接关闭连接或返回错误响应等。

## 二、Cloudflare SaaS 自定义主机名配置

进入 Cloudflare 后台：

**SSL/TLS → 自定义主机名**

第一次使用必须绑定支付方式，推荐使用PayPal。

进去以后找到 **回退源**

填入：`origin.example.com`后保存。

然后点击 **添加自定义主机名**

填写：

- 自定义主机名：`www.example.com`
- 验证方式：`TXT 验证`
- 自定义源服务器：`origin.example.com`

<img src="https://img.vemiy.com/img/78eb6847-f4fa-4879-8388-f6d0a4ce041c.webp" alt="自定义主机名" width="1357" height="1027">

添加 `www.example.com` 这个自定义主机名后，底下会给出一条 TXT 验证记录，复制下来。

回到 DNS 页面，新增对应的 TXT 记录即可：

- 类型：`TXT`
- 名称：按 Cloudflare 提示填写
- 值：按 Cloudflare 提示填写

<img src="https://img.vemiy.com/img/8ab36721-c10c-4de0-af9a-05bb6ae4a8fe.webp" alt="TXT验证" width="1309" height="561">

## 三、配置汇总

### DNS 记录

- `origin.example.com` A/AAAA→ 真实服务器 IP → **橙云**
- `cdn.example.com` CNAME→ 优选域名 → **灰云**
- `www.example.com` CNAME→ `cdn.example.com` → **灰云**

### 自定义主机名

- 回退源：`origin.example.com`
- 自定义主机名：`www.example.com`
- 自定义源服务器：`origin.example.com`

配置好后等待一会，状态显示有效，说明配置已通过验证。此时再测试 `www.example.com` 是否可以正常访问。
