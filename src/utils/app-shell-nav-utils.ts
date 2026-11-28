/**
 * 应用外壳导航的真源：路由前缀 → 顶栏标题、侧栏高亮的判定集中在此。
 * SSR 渲染与客户端 swup 切页共用同一份规则。
 */

/** 顶栏标题路由映射，顺序即优先级（更具体的路径需排在前面） */
const TOPBAR_ROUTES: ReadonlyArray<{ prefix: string; label: string }> = [
	{ prefix: "/posts/", label: "文章" },
	{ prefix: "/archive", label: "文章" },
	{ prefix: "/categories", label: "分类" },
	{ prefix: "/tags", label: "标签" },
	{ prefix: "/series", label: "系列" },
	{ prefix: "/search", label: "搜索" },
	{ prefix: "/links", label: "友链" },
	{ prefix: "/tools", label: "工具" },
	{ prefix: "/about", label: "关于" },
	{ prefix: "/privacy", label: "隐私政策" },
];

const DEFAULT_LABEL = "首页";

/** 按当前路径推导顶栏标题 */
export function resolveTopbarLabel(pathname: string): string {
	const matched = TOPBAR_ROUTES.find((route) =>
		pathname.startsWith(route.prefix),
	);
	return matched?.label ?? DEFAULT_LABEL;
}

/** 判断导航项是否对应当前路径（供侧栏高亮使用） */
export function isNavLinkActive(pathname: string, href: string): boolean {
	if (href === "/") return pathname === "/";
	const base = href.replace(/\/$/, "");
	return pathname === base || pathname.startsWith(`${base}/`);
}

/** 顶栏标题节点 id */
export const TOPBAR_TITLE_ID = "app-topbar-title";

/** 侧栏导航项标记属性，客户端据此重算高亮 */
export const NAV_LINK_ATTR = "data-nav-href";

/** 侧栏各导航组的高亮类名，与组件中的写法保持一致 */
const ACTIVE_CLASSES = [
	"app-side__card--active",
	"app-side__quick-link--active",
];

/**
 * 同步顶栏标题与侧栏高亮。
 * 顶栏与侧栏均位于 swup 容器之外（切页不重渲染），故路由变化后需手动刷新。
 */
export function syncAppShellNavigation(pathname: string): void {
	const titleNode = document.getElementById(TOPBAR_TITLE_ID);
	if (titleNode) {
		const label = resolveTopbarLabel(pathname);
		if (titleNode.textContent !== label) titleNode.textContent = label;
	}

	// 限定在侧栏内：移动端抽屉另有一套导航，各有自己的高亮规则
	document
		.querySelectorAll<HTMLElement>(`.app-shell__sidebar [${NAV_LINK_ATTR}]`)
		.forEach((link) => {
			const href = link.getAttribute(NAV_LINK_ATTR);
			if (!href) return;
			const isActive = isNavLinkActive(pathname, href);
			for (const cls of ACTIVE_CLASSES) {
				link.classList.toggle(cls, isActive);
			}
		});
}
