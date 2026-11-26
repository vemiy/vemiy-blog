# 迁移清单（对齐原 Hexo 站 www.vemiy.com）

原站：`E:\Dev\projects\hexo-blog`　目标站：本仓库

## 一、URL 与原站一致

| 原站 URL | 状态 |
|---|---|
| `/posts/:slug/` | ✅ 一致 |
| `/about/` | ✅ 已改（读 `src/content/spec/about.md`） |
| `/links/` | ✅ 已改名（原 `/friends/`） |
| `/privacy/` | ✅ 已建（`src/pages/privacy.astro` + `src/content/spec/privacy.md`） |
| `/tools/` | ✅ 页面已建（`src/pages/tools/index.astro`） |
| `/tools/random-string/` | ✅ 页面已建 |
| `/tools/image-color/` | ✅ 页面已建 |
| `/tools/tuner/` | ✅ 页面已建 |
| `/tools/metronome/` | ✅ 页面已建 |
| `/tools/ip-pure/` | ✅ 页面已建 |
| `/archives/` | ✅ 已改名（原 `/archive/`） |
| `/categories/` | ✅ |
| `/tags/` | ✅ |
| `/atom.xml` | ✅ |
| `/rss/`、`/atom/` 展示页 | ✅ 已删除（原站无） |
| `/search/` 独立页 | ✅ 已删除，搜索改为顶栏弹窗 |

## 二、外观

- [x] favicon 换为原站 `vemiy.png` → `src/public/favicon/vemiy-32.png`
- [x] 左上角 logo：原站 295×113 横版图，高 26px 等比，无文字
- [x] logo 视觉居中微调
- [x] 星空粒子背景（`src/components/features/UniverseEffect.astro`）
- [x] 鼠标点击特效（`src/components/features/ClickEffect.astro`）
- [x] 建站信息迁移到侧栏：运行时长、访客数/访问量（Vercount）、版权、萌ICP备、订阅
- [x] 页脚链接与运行时间同色，不随悬停变橙
- [x] 毛玻璃卡片：`rgba(30,30,30,0.6)` + `blur(2px)` + `rgba(255,255,255,0.08)` 描边 + `0 8px 16px -4px rgba(0,0,0,0.2)` 阴影（`src/styles/app-shell.css` 的 `--app-glass-*`）
- [x] 主题色对齐原站：`themeColor.hue: 28`，对应原站行内代码色 `#F47466`（oklch 色相 28.1）
- [x] 首页删除"个人技术博客 · 持续记录"徽标
- [x] 侧栏删除"所有系统运行正常"状态行
- [x] 圆角整体收敛（中等）：卡片 0.9→0.6rem，小组件 0.75/0.55→0.45/0.35rem，Tailwind 档位同步压低
- [x] 页脚运行时长接入 Odometer 逐位上滑动画（`public/js/odometer.min.js` + `public/css/odometer-theme-minimal.css`）
- [x] 侧栏「文章/分类/标签」标题改为正常白字，仅选中时高亮为主色
- [x] 侧栏「首页/友链/关于」选中态改为 2x.nz 风格：主色 2px 描边 + 主色淡底
- [x] 页脚订阅、侧栏订阅均指向 `/atom.xml`，浏览器内联显示 XML 而非下载（Content-Type 改 `application/xml`）
- [x] 页脚运行时长动画：ribbon 过渡 2s → 0.45s，逐位数字改用 `.stand` 类消除相邻间隙
- [x] 首页去掉发光/阴影特效：「浏览文章」主按钮与右侧分类拼图块改为纯色底 + 2px 描边（对齐 2x.nz）
- [x] ~~主题色切换~~（已按用户要求废弃，见下方「删除主题配色」）
- [x] ~~默认主题色熔岩橙 hue 43~~（已废弃）
- [x] ~~小米三色预设~~（已废弃）
- [x] 星空粒子不再透过文章图片显示（画布 `z-index: 0`，外壳与主区背景透明）
- [x] 页脚文字恢复为白字（覆盖 Tailwind `.text-50` 的 50% 灰）
- [x] 侧栏「订阅 Atom →」改为 `target="_blank"` 新标签打开，与页脚订阅一致
- [x] 首页「最新文章」右侧「查看全部」跳转 `/posts/`（原为 `/archives/`）
- [x] 侧栏改为 `position: fixed`，长列表页滚到底不再跟随上移
- [x] 主题色胶囊与明暗胶囊同高（1.75rem）、同 1px `--line-color` 描边、同 `--card-bg` 60% 底
- [x] 明暗切换：主题色切换右侧三档分段控件（跟随系统 / 亮 / 暗），明暗胶囊同高（1.75rem）同 1px 描边，写入 `localStorage.theme` 并派发 `theme-change`
- [x] 工具页样式重构：`tools-common.css` 与 5 个工具页内联样式中的 `#49b1f5`、`rgba(255,255,255,…)`、`rgba(30,30,30,0.6)`、`color-scheme: dark` 全部换成 `--primary` / `--line-color` / `--btn-*` / `--card-bg` / `--content-meta`，亮暗与主题色均跟随；节拍器灯珠与摆杆握柄改由 `.is-on` 类控制，颜色写在 CSS
- [x] 工具页圆角统一：分区卡片与面板统一 `--app-radius`（0.6rem），输入框/色块 0.45rem，分段控件与主按钮保持胶囊 999px
- [x] 页脚移除并迁移到侧边栏：`Footer.astro` 已删除，运行时长 / 访客数 / 访问量 / 版权 / 萌ICP备 / 订阅并入侧栏 `.app-side__stats`，Odometer 与 Vercount 脚本一并迁移；侧栏由 `sticky` 改 `fixed` + 主区 `margin-left` 留位，滚动时不再跟随上移；折叠态与移动抽屉均隐藏信息块
- [x] 右下角帧率显示：`src/components/controls/FpsCounter.astro`，固定右下 12px、`#aaa` 纯文字、无背景无阴影、`pointer-events: none`
- [x] 右下角悬浮目录按钮移除：`FloatingTOC.astro` 已删除，`#floating-toc-wrapper` 从 swup 容器与沉浸阅读样式里移除，`env.d.ts` 类型声明同步清理
- [ ] **重做文章右侧目录：整份抄 `https://github.com/MmzMing/my-blog`**（源码已 clone 到本地可读）
  - 抄 `src/components/layout/ArticleTocPanel.astro`（334 行）+ `src/styles/components/article-toc-panel.css`（1219 行）+ `src/utils/article-toc-panel-controller.ts`（2220 行）+ `src/utils/article-toc-tree.ts`（122 行），合计 3895 行
  - 必须包含：工具栏三按钮（自动收缩 / 全部展开 / 思维导图）、层级树、SVG 虚线与进度竖轨、圆点、高亮块跟随、阅读进度条、纸飞机阅读位置指示器、`grid-template-rows` 折叠动画、赞助弹窗、分享按钮、原文入口、站点统计滚动卡片
  - 需补依赖：`Icon.astro`、`RelatedPostCards.astro`、`cover-image.ts`、`related-posts.ts`、`swup-lifecycle.ts`、`home-data-layer.js`、相关 i18n 键
  - 正文宽度按参考站参数走（见下条），`left` 公式直接可用
  - 硬要求：**目录不得遮挡正文**
- [ ] **文章页正文宽度 64rem（仅文章详情页，其他任何页面保持 82rem 不变）**：目录显示阈值从 96rem 降到 80rem（1280px）；归档 / 分类 / 标签 / 博客 / 工具 / 关于 / 隐私 / 友链 等页面一律不得收窄
- [ ] 现有 `ArticleToc.astro` + `article-toc.css`（自写简化版）在整份抄完参考站后删除
- [x] 搜索功能修复：新增 `src/pages/api/search-index.json.ts` 构建期索引，Pagefind 不可用或未命中时回退到该 JSON 检索；dev 与构建产物均已实测可搜（`cloudflare` 命中两篇）

### 硬朗画风改造（对齐 2x.nz / commandcode.ai）

- [ ] **删除主题配色功能，全站改黑白**（alignment 参考 commandcode.ai）
  - 侧栏主题色胶囊 DOM 已删，脚本内 `paletteOpen` / `setPaletteOpen` / `applyHue` / `syncSwatch` 逻辑仍在，须清干净
  - `themeColors` 数组已删；`setting-utils.ts` 的 `getHue` / `setHue` / `hue-config` 缓存逻辑待删
  - `Layout.astro` 首帧脚本里的 `--hue` 读写待删；`siteConfig.themeColor.hue` 待删
  - `variables.styl` 色阶已全部去色相（`var(--hue)` → `0`），`--primary` 已改暗色近白 / 亮色近黑
  - 其余 84 处 `--hue` 引用点逐项核查清理
- [x] **修复黑白后白底白字/白图看不见**
  - 已加 `--primary-fg` 前景对偶变量，`--deep-text` 补齐暗色定义，删除 12 条纯翻转文字色的 `:root.dark` 补丁
  - 明暗按钮选中态改「描边 + 文字着色」，`:root.dark` 补丁特异性压过选中态导致的 hover 白底白字已修
  - 新增 `--state-accent-fg` / `--state-accent-bg` / `--state-accent-bg-hover` / `--state-accent-border` 四个语义变量，替换全部实心主色按钮
  - CDP 实测 12 个页面 × 亮暗组合，按钮与链接对比度全部 ≥ 4.5（WCAG AA）
- [x] **去掉毛玻璃与阴影，改硬描边**
  - `--app-glass-bg` 由硬编码深色 `rgba(30,30,30,.6)` 改为 `var(--card-bg)`；`--app-border` 改用 `--line-color`
  - 删除 `.app-panel` / `.app-entry` / 顶栏的 `backdrop-filter` 与 `box-shadow`；工具页列表卡阴影一并删除
  - 侧栏调色板残留 CSS（约 120 行死代码）已删
- [x] **去除所有按钮的悬停浮起动画**
  - 已清除：工具页列表卡 `translateY(-2px)`、banner 链接 `translateY(-2px) scale(1.05)`、代码块复制按钮、404 页 `translateY(-2px)` 与阴影
- [ ] **全面直角 + 少量 4px 圆角**（对齐 commandcode.ai 的 96% 直角）
  - 已完成：`--app-radius` 0.6rem → 0.25rem，面板与入口卡改用 `--app-radius-card`
  - 待办：工具页、分类、标签等仍有 0.2 / 0.35 / 0.45 / 0.5 / 0.55rem 零散圆角，需收敛到 0 或 0.25rem；头像、圆点、分段胶囊保留圆形
- [ ] **引入 Geist 字体**（commandcode.ai 全站使用）
  - Astro Font API 加 `Geist` 与 `Geist Mono`，`fontConfig.selected` 指向它
  - 标题 `letter-spacing: -0.02em`，字重补 500 / 640 中间档
  - 正文行高收紧到 1.55
- [ ] **修复刷新途中点击导航导致反复刷新**：浏览器正在刷新/加载时点击「工具 / 博客 / 首页」等导航链接，页面会反复刷新停不下来，必须等到某次刷新期间不点击才能恢复
  - 排查方向：swup 在页面未就绪时接管链接点击、`astro:page-load` 与 `swup:page:view` 重复绑定、首帧脚本重复执行、导航工具函数（`navigateToPage` / `layout-init`）在 loading 状态下触发整页跳转
  - 验收：刷新过程中连续点击多个导航项，页面最终停在点击的目标页，不出现重复刷新
- [ ] **注释规范化复查**：本轮新增/改动的 `ArticleToc.astro`、`FpsCounter.astro`、`article-toc.css`、`search-index.json.ts`、`tools-common.css`、`AppSidebar.astro`、`MainGridLayout.astro`、`app-shell.css`、`variables.styl` 中，新写的注释须按 AGENTS.md 复查（只写功能含义，不写原因/历史/背景/参考）

## 三、清理主题自带内容

- [x] 打赏收款码图片（alipay/wechat）
- [x] 赞助页 `sponsor.astro`
- [x] 赞助配置中的 ko-fi / 爱发电（指向主题作者）
- [x] 主题作者打赏者列表
- [x] 导航栏 GitHub/Gitee/Firefly文档 作者链接
- [x] bangumi / vndb / myanimelist / bilibili 已用 `siteConfig.pages` 关闭
- [x] 友链真实数据（11 条，与原站 `source/_data/link.yml` 完全一致）
- [ ] 主题自带演示内容仍在磁盘：`src/content/dynamic/`（4 篇）、`src/content/projects/`（example-project、firefly）、`gallery`、`series`、`guestbook`、`booknav` 页面

## 四、功能

- [x] 搜索：Pagefind + 静态 JSON 索引双通道，dev 与线上均可检索
- [x] PJAX 切页不刷新 + 侧栏高亮跟随 + 顶栏标题跟随
- [x] 侧栏 logo / 导航（归档、分类、标签）
- [x] 侧栏快捷区六个入口：首页 / 博客 / 工具 / 友链 / 关于 / 隐私；订阅改为 `/atom.xml`
- [x] 新增 `/posts/` 分页列表页（`src/pages/posts/[...page].astro`）
- [x] 横幅社交链接换为本站（GitHub / Bilibili / Email / RSS）
- [x] 侧边栏可折叠（桌面图标轨道 + 移动端抽屉 + 遮罩 + 状态持久化）
- [x] 移动端适配：顶栏菜单按钮、抽屉滑入、遮罩点击关闭、Esc 关闭
- [ ] **注释规范化**：全项目源码注释按 AGENTS.md 规范核查改写（只写功能含义，不写背景/原因/历史/参考）
- [ ] 工具页 5 个工具的逻辑实测（页面均 200，功能待逐项点测）
