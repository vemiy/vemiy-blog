---
title: Google 站点推送配置
date: 2026-08-15
updated: 2026-08-15
description: 静态博客接入 Google Indexing API 主动推送 URL 的完整配置流程，包括服务账号、API 启用、Search Console 权限设置与常见问题。
categories:
  - 建站
tags:
  - Google
  - Hexo
draft: false
---

前提：网络环境能访问 Google（推送请求要走代理），站点已在 Search Console 验证。

官方文档：<https://developers.google.com/search/apis/indexing-api/v3/prereqs>

## 1. 创建 Google Cloud 项目

进入 <https://console.cloud.google.com/>，新建一个项目，后续操作都在这个项目下进行。

## 2. 创建服务账号并获取凭据

左侧菜单进入 IAM 和管理 → 服务账号，创建服务账号，名称随意。创建完成后点进该账号，在"密钥"标签页添加密钥，选择创建新密钥，类型选 JSON，会自动下载一个 `xxx.json` 文件，这就是凭据。

创建完复制下服务账号邮箱（形如 `xxx@xxx.iam.gserviceaccount.com`），后面要用。

注意：创建密钥时报"服务账号密钥创建功能已停用"，说明组织策略禁止了密钥创建。需要先切换到组织账号（页面左上角资源选择器切到组织，不是项目），再去 IAM 和管理 → 组织策略，按报错提示的策略 ID 搜索（这里是 `iam.disableServiceAccountKeyCreation`）改为停用，等一两分钟生效再回来创建。如果列表里新旧两条策略都显示"有效"，则都要改。

## 3. 启用 Indexing API

左侧菜单进入 APIs & Services → Library，搜索 `Indexing API`，启用。

创建服务账号不等于启用 API，漏掉这步推送时会报 403：

```json
{
  "error": {
    "code": 403,
    "message": "Web Search Indexing API has not been used in project ... before or it is disabled.",
    "status": "PERMISSION_DENIED"
  }
}
```

启用后等几分钟生效再重试。

## 4. Search Console 添加用户权限

打开 <https://search.google.com/search-console/>，选择已验证的站点资源，进入设置 → 用户和权限 → 添加用户，填入第 2 步的服务账号邮箱，权限选**所有者**（一定要是所有者）。

注意：这个邮箱不是你的 Google 登录邮箱，就是第 2 步创建服务账号时复制的那个，也可以在下载的 JSON 文件里找 `client_email` 字段。漏掉这步推送时会报：

```json
{
  "error": {
    "code": 403,
    "message": "Permission denied. Failed to verify the URL ownership.",
    "status": "PERMISSION_DENIED"
  }
}
```

## 5. 站点配置推送

我用的是 Hexo 的 hexo-submit-urls-to-search-engine 插件，在 `_config.yml` 里配置：

```yaml
deploy:
- type: cjh_google_url_submitter
- type: cjh_bing_url_submitter

hexo_submit_urls_to_search_engine:
  google: 1
  google_host: https://www.vemiy.com
  google_key_file: google-key.json
  google_proxy: socks5h://127.0.0.1:10808
```

示例里是本站的域名和代理，`google_host` 换成你自己的域名，`google_proxy` 换成你自己能用的代理。`google_key_file` 指向第 2 步下载的 JSON 凭据，放到站点根目录。推送：

```sh
hexo generate && hexo deploy
```

推送成功响应：

```json
{ "urlNotificationMetadata": { "url": "https://www.vemiy.com/posts/xxx/" } }
```

## 注意事项

- **代理**：Google 接口国内无法直连，`google_proxy` 必须配可用代理，否则推送失败
- **密钥安全**：凭据 JSON 是私密文件，仓库公开的话一定要加进 .gitignore，不能泄露
- **配额**：Indexing API 每天 200 条，个人博客文章量小完全够用；配额主要面向招聘、直播类时效内容，申请提高配额可能被拒，被拒不影响已有配额使用
- **时效**：API 启用、组织策略修改后都有传播延迟，报错后等几分钟再重试
