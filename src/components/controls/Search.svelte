<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { navigateToPage } from "@utils/navigation-utils";
import { onMount } from "svelte";
import Icon from "@/components/common/Icon.svelte";
import type { SearchResult } from "@/global";
import { FLOATING_PANEL_CLOSE_EVENT } from "@/utils/floating-panel-utils";
import { url as formatUrl, getSearchUrl } from "@/utils/url-utils";

// --- State ---
let keywordDesktop = "";
let keywordMobile = "";
let result: SearchResult[] = [];
let isSearching = false;
let initialized = false;
let debounceTimer: NodeJS.Timeout;
let searchRequestId = 0;

// --- 静态索引回退 ---
// Pagefind 索引只存在于构建产物，开发环境没有；此时改用构建期生成的 JSON 索引检索。
interface StaticIndexEntry {
	url: string;
	title: string;
	description: string;
	content: string;
}

let staticIndex: StaticIndexEntry[] | null = null;
let staticIndexLoading: Promise<void> | null = null;

const loadStaticIndex = (): Promise<void> => {
	if (staticIndexLoading) return staticIndexLoading;
	staticIndexLoading = fetch(formatUrl("/api/search-index.json"))
		.then((response) => (response.ok ? response.json() : []))
		.then((data: StaticIndexEntry[]) => {
			staticIndex = Array.isArray(data) ? data : [];
		})
		.catch(() => {
			staticIndex = [];
		});
	return staticIndexLoading;
};

/** 按空格分词在静态索引中匹配，标题命中权重高于正文 */
const searchStaticIndex = (keyword: string): SearchResult[] => {
	const words = keyword.toLowerCase().split(/\s+/).filter(Boolean);
	if (words.length === 0 || !staticIndex) return [];

	const hits: Array<{ score: number; result: SearchResult }> = [];
	for (const entry of staticIndex) {
		const title = entry.title.toLowerCase();
		const body = `${entry.description} ${entry.content}`.toLowerCase();
		let score = 0;
		for (const word of words) {
			if (title.includes(word)) score += 10;
			if (body.includes(word)) score += 3;
		}
		if (score === 0) continue;
		const hit = body.indexOf(words[0]);
		const start = Math.max(0, hit - 40);
		hits.push({
			score,
			result: {
				url: entry.url,
				meta: { title: entry.title },
				excerpt: `${start > 0 ? "…" : ""}${entry.content.slice(start, start + 160)}…`,
			},
		});
	}

	return hits
		.sort((a, b) => b.score - a.score)
		.slice(0, 20)
		.map((item) => item.result);
};

// --- UI Logic ---
// pagefind.js 是按需加载的（见 Navbar.astro），搜索 UI 一被碰到就触发。
// 幂等，重复调用只会拿到同一个 promise。
const requestPagefind = (): void => {
	window.__loadPagefind?.();
	loadStaticIndex();
};

const togglePanel = () => {
	requestPagefind();
	document
		.getElementById("search-panel")
		?.classList.toggle("float-panel-closed");
};

const handleDesktopFocus = (event: FocusEvent): void => {
	requestPagefind();

	const input = event.currentTarget;
	if (
		input instanceof HTMLElement &&
		input.hasAttribute("data-floating-panel-focus-return")
	)
		return;

	search(keywordDesktop, true);
};

const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
	const panel = document.getElementById("search-panel");
	if (
		!panel ||
		(isDesktop && !keywordDesktop) ||
		(!isDesktop && !keywordMobile)
	)
		return;
	show
		? panel.classList.remove("float-panel-closed")
		: panel.classList.add("float-panel-closed");
};

const closeSearchPanel = (): void => {
	document.getElementById("search-panel")?.classList.add("float-panel-closed");
	keywordDesktop = "";
	keywordMobile = "";
	result = [];
};

const cancelPendingSearch = (): void => {
	clearTimeout(debounceTimer);
	searchRequestId += 1;
	isSearching = false;
};

const handleResultClick = (event: Event, url: string): void => {
	event.preventDefault();
	closeSearchPanel();
	navigateToPage(url);
};

// --- Core Search Logic ---
const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
	if (!keyword) {
		cancelPendingSearch();
		setPanelVisibility(false, isDesktop);
		result = [];
		return;
	}
	if (!initialized) return;

	clearTimeout(debounceTimer);
	const requestId = ++searchRequestId;
	isSearching = true;

	debounceTimer = setTimeout(async () => {
		try {
			let searchResults: SearchResult[] = [];

			if (window.pagefind) {
				const response = await window.pagefind.search(keyword);
				searchResults = await Promise.all(
					response.results.map((item) => item.data()),
				);
			}

			// Pagefind 不可用或未命中时走静态索引
			if (searchResults.length === 0) {
				await loadStaticIndex();
				searchResults = searchStaticIndex(keyword);
			}

			if (requestId !== searchRequestId) return;

			result = searchResults;
			setPanelVisibility(true, isDesktop);
		} catch (error) {
			if (requestId !== searchRequestId) return;

			console.error("Search error:", error);
			result = [];
			setPanelVisibility(false, isDesktop);
		} finally {
			if (requestId === searchRequestId) {
				isSearching = false;
			}
		}
	}, 300); // 300ms debounce
};

// --- Initialization onMount ---
onMount(() => {
	const initializePagefind = () => {
		initialized = true;
		if (keywordDesktop) search(keywordDesktop, true);
		if (keywordMobile) search(keywordMobile, false);
	};

	// 静态索引在开发环境同样可用，先加载后放行输入
	loadStaticIndex().then(initializePagefind);

	if (window.pagefind) {
		// If script already loaded
		initializePagefind();
	} else {
		// Listen for the event
		document.addEventListener("pagefindready", initializePagefind, {
			once: true,
		});
		document.addEventListener("pagefindloaderror", initializePagefind, {
			once: true,
		});
	}

	const panel = document.getElementById("search-panel");
	panel?.addEventListener(FLOATING_PANEL_CLOSE_EVENT, cancelPendingSearch);

	return () => {
		panel?.removeEventListener(FLOATING_PANEL_CLOSE_EVENT, cancelPendingSearch);
		document.removeEventListener("pagefindready", initializePagefind);
		document.removeEventListener("pagefindloaderror", initializePagefind);
		cancelPendingSearch();
	};
});

// --- Reactive Statements ---
$: if (initialized && (keywordDesktop || keywordDesktop === "")) {
	search(keywordDesktop, true);
}
$: if (initialized && (keywordMobile || keywordMobile === "")) {
	search(keywordMobile, false);
}
</script>

<!-- search bar for desktop view -->
<div id="search-bar" class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg
      bg-black/4 hover:bg-black/6 focus-within:bg-black/6
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
">
    <Icon icon="material-symbols:search"
          class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
    <input id="search-input-desktop" placeholder="{i18n(I18nKey.search)}" bind:value={keywordDesktop}
           aria-controls="search-panel" data-floating-panel-no-expanded
           on:focus={handleDesktopFocus}
           class="transition-all pl-10 text-sm bg-transparent outline-0
         h-full w-40 active:w-60 focus:w-60 text-black/50 dark:text-white/50"
    >
</div>

<!-- toggle btn for phone/tablet view -->
<button on:click={togglePanel} aria-label="Search Panel" aria-controls="search-panel" aria-expanded="false" id="search-switch"
		class="btn-plain scale-animation lg:hidden! rounded-lg w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- search panel -->
<div id="search-panel" class="float-panel float-panel-closed search-panel absolute md:w-120
top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2"
     data-floating-panel data-floating-panel-trigger="search-switch search-input-desktop" inert aria-hidden="true">

    <!-- search bar inside panel for phone/tablet -->
    <div id="search-bar-inside" class="flex relative lg:hidden transition-all items-center h-11 rounded-xl
      bg-black/4 hover:bg-black/6 focus-within:bg-black/6
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  ">
        <Icon icon="material-symbols:search"
              class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
        <input placeholder={i18n(I18nKey.search)} bind:value={keywordMobile}
               on:focus={requestPagefind}
               class="pl-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
        >
    </div>

    <!-- search results -->
    {#if isSearching}
        <div class="transition first-of-type:mt-2 lg:first-of-type:mt-0 block rounded-xl text-lg px-3 py-2 text-50">
            {i18n(I18nKey.searchLoading)}
        </div>
    {:else if result.length > 0}
        {#each result.slice(0, 5) as item}
            <a href={item.url}
               on:click={(e) => handleResultClick(e, item.url)}
               class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
           rounded-xl text-lg px-3 py-2 hover:bg-(--btn-plain-bg-hover) active:bg-(--btn-plain-bg-active)">
                <div class="transition text-90 inline-flex font-bold group-hover:text-(--primary)">
                    {@html item.meta.title}
                    <Icon icon="fa7-solid:chevron-right"
                          class="transition text-[0.75rem] translate-x-1 my-auto text-(--primary)"></Icon>
                </div>
                {#if item.excerpt.includes('<mark>')}
                    <div class="transition text-sm text-50" style="display: flex; align-items: flex-start; margin-top: 0.1rem">
                        <div>
                            {@html item.excerpt}
                        </div>
                    </div>
                {/if}

                {#if item.content && item.content.includes('<mark>')}
                    <div class="transition text-sm text-30" style="display: flex; align-items: flex-start; margin-top: 0.1rem">
                        <span style="display: inline-block; background-color: var(--btn-plain-bg-active); color: var(--primary); padding: 0.1em 0.4em; border-radius: 5px; font-size: 0.75em; font-weight: 600; margin-right: 0.5em; shrink: 0;">
                            {i18n(I18nKey.searchContent)}
                        </span>
                        <div>
                            {@html item.content}
                        </div>
                    </div>
                {/if}
            </a>
        {/each}
        {#if result.length > 5}
            <a href={getSearchUrl(keywordDesktop || keywordMobile)}
               on:click={(e) => handleResultClick(e, getSearchUrl(keywordDesktop || keywordMobile))}
               class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block rounded-xl text-lg px-3 py-2 hover:bg-(--btn-plain-bg-hover) active:bg-(--btn-plain-bg-active) text-(--primary) font-bold text-center">
                <span class="inline-flex items-center">
                    {i18n(I18nKey.searchViewMore).replace('{count}', (result.length - 5).toString())}
                    <Icon icon="fa7-solid:arrow-right" class="transition text-[0.75rem] ml-1"></Icon>
                </span>
            </a>
        {/if}
    {:else if result.length === 0}
        <div class="transition first-of-type:mt-2 lg:first-of-type:mt-0 block rounded-xl text-lg px-3 py-2 text-50">
            {i18n(I18nKey.searchNoResults)}
        </div>
    {:else if keywordDesktop || keywordMobile}
        <div class="transition first-of-type:mt-2 lg:first-of-type:mt-0 block rounded-xl text-lg px-3 py-2 text-50">
            {i18n(I18nKey.searchTypeSomething)}
        </div>
    {/if}
</div>

<style>
    input:focus {
        outline: 0;
    }

    .search-panel {
        max-height: calc(100vh - 100px);
        overflow-y: auto;
    }
</style>
