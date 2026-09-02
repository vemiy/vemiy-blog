---
title: 清理 GitHub 仓库残留的贡献者
date: 2026-09-02
updated: 2026-09-02
description: git push --force 重写历史后，GitHub 贡献者列表仍残留旧条目的原因与修复方法。保留完整 commit 历史，只清缓存。
categories:
  - 建站
tags:
  - GitHub
  - Git
draft: false
---

## 问题

用 `git commit --amend` 或 `git rebase` 重写提交信息后 `git push --force`，本地历史已经干净了，但 GitHub 仓库的 **Insights → Contributors** 页面里，被抹掉的署名仍然作为贡献者显示。

## 原因

GitHub 的贡献者列表是一个**缓存索引**，不是实时读取 commit 图谱。`git push --force` 替换了分支引用，但不会让这个缓存失效。即使旧提交已经变成悬空对象（dangling commit）不再被任何分支可达，缓存中仍然保留着它们的贡献者信息。

REST API 和页面侧边栏走的是**不同的缓存**，所以可能出现 API 已经返回正确结果、但页面侧边栏还显示旧数据的情况。

## 修复方法

确认本地历史确实干净后（`git log --all --format='%an' | grep -i 旧名称` 无输出），用以下方法强制刷新缓存。

### 方法一：重命名默认分支

最简单的方法，重命名默认分支再改回来，强制触发缓存重建。

**用 gh CLI：**

```bash
gh api -X POST "repos/OWNER/NAME/branches/main/rename" -f new_name=main-tmp
gh api -X POST "repos/OWNER/NAME/branches/main-tmp/rename" -f new_name=main
```

**用 GitHub 网页：**

Settings → Branches → Rename branch，改成 `main-tmp`，确认后再改回 `main`。

操作完成后 **Ctrl+F5** 强制刷新页面——GitHub 侧边栏有客户端缓存（Turbo snapshot），普通刷新可能还是旧数据。

注意事项：
- 两条命令之间不要有其他推送
- 进行中的 Pull Request 会被 GitHub 自动重新指向
- 本地克隆不需要任何操作，分支名最终没变

### 方法二：切换默认分支 + 删除重建

如果方法一不生效，可以尝试更彻底的方式：临时切换默认分支，删除 main 后从本地重建。

```bash
# 1. 创建临时分支推到远程
git checkout -b temp-clean
git push origin temp-clean

# 2. 去 GitHub Settings → General → Default branch 改成 temp-clean

# 3. 删除远程 main 并从本地重建
git checkout main
git push origin --delete main
git push origin main

# 4. 去 GitHub Settings 把默认分支改回 main

# 5. 清理临时分支
git push origin --delete temp-clean
git branch -D temp-clean
```

## 参考

- [Removing a stale contributor from a GitHub repository](https://gist.github.com/khasky/3939637b842510c4ff44d2e4d84acd0f)（GitHub Gist，2026-08-22）
- [Git清除贡献者信息和历史提交记录](https://blog.csdn.net/Liu_Wd/article/details/120910899)（CSDN，2021-10-22）
