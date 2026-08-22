(function () {
  function initToolsSearch() {
    const page = document.querySelector('.vemiy-tools-page');
    if (!page || page.dataset.searchBound === 'true') return;

    const input = page.querySelector('#vemiyToolsSearch');
    const list = page.querySelector('#vemiyToolsList');
    const empty = page.querySelector('#vemiyToolsEmpty');
    const items = Array.from(list.querySelectorAll('.vemiy-tools-item'));

    input.addEventListener('input', function () {
      const keyword = input.value.trim().toLowerCase();
      let visible = 0;

      items.forEach(item => {
        const matched = !keyword || item.textContent.toLowerCase().includes(keyword);
        item.style.display = matched ? 'flex' : 'none';
        if (matched) visible++;
      });

      empty.style.display = visible ? 'none' : 'block';
    });

    page.dataset.searchBound = 'true';
  }

  initToolsSearch();
  document.addEventListener('pjax:complete', initToolsSearch);
})();
