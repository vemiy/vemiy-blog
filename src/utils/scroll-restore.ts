/** 列表页滚动位置记忆。 */

const STORE_PREFIX = "scrollY:";

/** 列表页路径判断。 */
const isListPath = (path: string): boolean =>
	path === "/posts" || path.startsWith("/posts/page/");

const keyOf = (path: string): string => STORE_PREFIX + path;

const readY = (path: string): number | null => {
	try {
		const raw = sessionStorage.getItem(keyOf(path));
		if (raw === null) return null;
		const y = Number.parseInt(raw, 10);
		return Number.isFinite(y) && y >= 0 ? y : null;
	} catch {
		return null;
	}
};

const writeY = (path: string, y: number): void => {
	try {
		sessionStorage.setItem(keyOf(path), String(Math.round(y)));
	} catch {
		// 存储不可用时忽略。
	}
};

const currentPath = (): string => {
	const p = window.location.pathname.replace(/\/+$/, "");
	return p === "" ? "/" : p;
};

/** 恢复滚动位置。 */
const applyY = (y: number): void => {
	const run = () => window.scrollTo({ top: y, behavior: "instant" });
	run();
	window.requestAnimationFrame(run);
	window.setTimeout(run, 120);
	window.setTimeout(run, 320);
};

export function initScrollRestore(): void {
	if (typeof window === "undefined") return;
	if (window.__scrollRestoreBound) return;
	window.__scrollRestoreBound = true;

	/** 记录当前滚动位置。 */
	const remember = (): void => {
		const path = currentPath();
		if (!isListPath(path)) return;
		writeY(path, window.scrollY);
	};

	/* 点击站内链接时记录。 */
	document.addEventListener(
		"click",
		(event) => {
			const target = event.target as HTMLElement | null;
			const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
			if (!link) return;
			const href = link.getAttribute("href") || "";
			if (!href || href.startsWith("#") || href.startsWith("http")) return;
			remember();
		},
		{ capture: true },
	);

	document.addEventListener("swup:link:click", remember);
	window.addEventListener("pagehide", remember);
	window.addEventListener("beforeunload", remember);

	/** 进入列表页后恢复位置。 */
	const restore = (): void => {
		const path = currentPath();
		if (!isListPath(path)) return;
		const y = readY(path);
		if (y === null) return;
		applyY(y);
	};

	document.addEventListener("swup:page:view", restore);
	if (document.readyState === "complete" || document.readyState === "interactive") {
		restore();
	} else {
		document.addEventListener("DOMContentLoaded", restore, { once: true });
	}
}
