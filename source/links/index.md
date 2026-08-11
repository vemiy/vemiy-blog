---
title: 友链
type: link
date: 2026-08-11 00:00:00
comments: false
---

## 申请友链

点击下方按钮，在打开的编辑页面中把示例改成你的信息，然后点 Commit changes 提交即可（GitHub 会自动创建 Pull Request）：

<a class="vimy-link-apply-btn" href="https://github.com/vemiy/vemiy-blog/edit/main/source/_data/link.yml" target="_blank" rel="noopener">提交友链</a>

填写格式：

```yaml
- name: 站点名
  link: https://example.com
  avatar: https://example.com/avatar.png
  descr: 一句话简介
```

提交后机器人会自动校验格式，并检查你的网站是否包含本站回链（`https://www.vemiy.com`）。通过后站长合并即可上架。

<style>
  /* 友链申请按钮 */
  .vimy-link-apply-btn {
    display: inline-block;
    margin: 0.5rem 0 1rem;
    padding: 0.7rem 1.4rem;
    border-radius: 999px;
    background: var(--text-highlight-color);
    color: #fff;
    font-weight: 600;
    text-decoration: none;
    transition: 0.2s;
  }
  .vimy-link-apply-btn:hover {
    filter: brightness(0.88);
    color: #fff;
  }
</style>
