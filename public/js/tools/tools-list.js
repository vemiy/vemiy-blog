(function () {
  // 工具列表前端过滤：按关键字匹配名称与描述，无匹配时展示空提示

  function initToolsSearch() {
    const input = document.querySelector("#vemiyToolsSearch");
    if (!input) return;
    if (input.dataset.searchBound === "true") return;

    const list = document.querySelector("#vemiyToolsList");
    const empty = document.querySelector("#vemiyToolsEmpty");
    if (!list || !empty) return;

    const items = Array.from(list.querySelectorAll(".vemiy-tools-item"));

    input.addEventListener("input", () => {
      const keyword = input.value.trim().toLowerCase();
      let visible = 0;

      items.forEach((item) => {
        const matched =
          !keyword || item.textContent.toLowerCase().includes(keyword);
        item.style.display = matched ? "flex" : "none";
        if (matched) visible++;
      });

      empty.style.display = visible ? "none" : "block";
    });

    input.dataset.searchBound = "true";
  }

  // 首屏加载与客户端路由切换后均执行初始化，函数内部保证幂等
  if (!window.__vemiyToolsListBound) {
    window.__vemiyToolsListBound = true;
    document.addEventListener("DOMContentLoaded", initToolsSearch);
    document.addEventListener("astro:page-load", initToolsSearch);
    document.addEventListener("pjax:complete", initToolsSearch);
  }
  initToolsSearch();
})();
