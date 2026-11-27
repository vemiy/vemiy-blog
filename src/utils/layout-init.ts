import { syncAppShellNavigation } from "@/utils/app-shell-nav-utils";
import {
	registerContentOverflowListeners,
	scheduleContentOverflowEnhancements,
} from "@/utils/content-overflow-utils";
import {
	initializeFloatingPanels,
	setClickOutsideToClose,
} from "@/utils/floating-panel-utils";
import {
	initFullscreenWallpaper,
	syncFullscreenStateAfterInit,
} from "@/utils/fullscreen-wallpaper-utils";
import {
	refreshSidebarStickyState,
	updateMainGridCols,
	updateSidebarComponentsVisibility,
} from "@/utils/grid-layout-utils";
import { initIconLoader } from "@/utils/icon-loader";
import { initImageLoadFadeIn } from "@/utils/lqip-utils";
import { initScroll } from "@/utils/scroll-utils";
import { initWallpaperMode } from "@/utils/setting-utils";
import { setupSwupTransitions } from "@/utils/swup-transitions";
import { initTouchCodeCopyReveal } from "@/utils/touch-copy-utils";

/** 布局初始化编排（从 Layout.astro 迁出） */
export function initLayout(): void {
	// 防止 Swup 切页重跑模块化脚本时重复注册监听器/钩子（一次性注册；
	// 切页后的页面状态刷新由下方 swup 钩子与一次性注册的 document 监听器负责）
	if (window.__fireflyLayoutInit) return;
	window.__fireflyLayoutInit = true;

	initializeFloatingPanels();

	setClickOutsideToClose("display-setting", [
		"display-setting",
		"display-settings-switch",
	]);
	// nav-menu-panel 现为全屏抽屉（inset-0），点击外部永不触发且由遮罩点击关闭，
	// 不再注册 click-outside（见 NavMenuPanel.astro 的 document 委托）。
	setClickOutsideToClose("search-panel", [
		"search-panel",
		"search-bar",
		"search-switch",
	]);
	setClickOutsideToClose("wallpaper-mode-panel", [
		"wallpaper-mode-panel",
		"wallpaper-mode-switch",
	]);
	setClickOutsideToClose("theme-mode-panel", [
		"theme-mode-panel",
		"scheme-switch",
	]);

	setupSwupTransitions();
	initFullscreenWallpaper();
	registerContentOverflowListeners();
	// 滚动路径不再读取布局；先在初始化时填充侧边栏 top 容器可见性缓存
	refreshSidebarStickyState();
	initScroll();
	initTouchCodeCopyReveal();

	// 页面加载完成后初始化banner和内容溢出容器
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			scheduleContentOverflowEnhancements();
		});
	} else {
		scheduleContentOverflowEnhancements();
	}

	// Initialize wallpaper mode
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			updateMainGridCols();
			updateSidebarComponentsVisibility();
			initWallpaperMode();
				initIconLoader();
			syncFullscreenStateAfterInit();
		});
	} else {
		updateMainGridCols();
		updateSidebarComponentsVisibility();
		initWallpaperMode();
		initIconLoader();
		syncFullscreenStateAfterInit();
	}

	// 顶栏与侧栏在 swup 容器之外，切页后需与首次加载同样刷新标题与高亮
	syncAppShellNavigation(window.location.pathname);
	document.addEventListener("swup:page:view", () => {
		syncAppShellNavigation(window.location.pathname);
	});

	initImageLoadFadeIn();
	// 切页换入后延到下一帧重扫 LQIP 淡入
	document.addEventListener("astro:page-load", () => {
		requestAnimationFrame(initImageLoadFadeIn);
	});
	document.addEventListener("swup:content:replace", () => {
		requestAnimationFrame(initImageLoadFadeIn);
	});

	// 切页后重播内容对焦动画
	const replayContentFocus = (): void => {
		const target = document.querySelector<HTMLElement>(
			"#content-wrapper > :first-child",
		);
		if (!target) return;
		target.style.animation = "none";
		void target.offsetWidth;
		target.style.animation = "";
	};

	// 后退时恢复页面滚动位置
	const SCROLL_KEY = "swupScrollY:";
	const keyOf = (path = window.location.pathname): string => SCROLL_KEY + path;
	const scrollYOf = (path: string): number =>
		Number(sessionStorage.getItem(keyOf(path)) ?? 0);

	if ("scrollRestoration" in history) history.scrollRestoration = "manual";

	/** 记录当前位置，用作返回目标。 */
	const rememberScroll = (): void => {
		sessionStorage.setItem(keyOf(), String(Math.round(window.scrollY)));
	};
	// 点击站内链接时记录滚动位置
	document.addEventListener("swup:link:click", rememberScroll);

	type Visit = { to?: { url?: string }; history?: { popstate?: boolean } };

	/** 在 DOM 换入后恢复滚动位置。 */
	let pendingScrollY: number | null = null;
	document.addEventListener("swup:visit:start", (event) => {
		const visit = (event as CustomEvent<{ visit?: Visit }>).detail?.visit;
		pendingScrollY =
			visit?.history?.popstate && visit.to?.url
				? scrollYOf(new URL(visit.to.url, location.origin).pathname) || null
				: null;
	});

	document.addEventListener("swup:content:replace", () => {
		if (!pendingScrollY) return;
		const y = pendingScrollY;
		pendingScrollY = null;
		let tries = 0;
		const attempt = (): void => {
			window.scrollTo({ top: y, behavior: "instant" });
			if (Math.abs(window.scrollY - y) < 4 || ++tries > 20) return;
			window.setTimeout(attempt, 50);
		};
		attempt();
	});

	document.addEventListener("swup:page:view", () => {
		requestAnimationFrame(replayContentFocus);
	});
}
