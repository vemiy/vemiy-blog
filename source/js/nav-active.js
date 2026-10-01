/* 导航当前页高亮：为当前页面对应的导航项添加 active 类 */
(function () {
  function normalize(url) {
    var s = String(url || '');
    if (!s) return '';
    s = s.replace(/^https?:\/\/[^/]+/, '');
    s = s.replace(/\?.*$/, '').replace(/#.*$/, '');
    s = s.replace(/\/+$/, '');
    return s || '/';
  }

  function findMatch() {
    var path = normalize(location.pathname);
    var j;

    var tops = document.querySelectorAll('#nav .menus_items > .menus_item > a.site-page');
    for (j = 0; j < tops.length; j++) {
      var href = normalize(tops[j].getAttribute('href'));
      if (!href || href === '/') continue;
      if (path === href || path.indexOf(href + '/') === 0) return tops[j];
    }

    var groups = document.querySelectorAll('#nav .menus_items > .menus_item');
    for (var g = 0; g < groups.length; g++) {
      var group = groups[g].querySelector('span.site-page.group');
      if (!group) continue;
      var kids = groups[g].querySelectorAll('.menus_item_child a.site-page');
      for (var k = 0; k < kids.length; k++) {
        if (normalize(kids[k].getAttribute('href')) === path) return group;
      }
    }

    if (path === '/') {
      return document.querySelector('#nav .menus_items > .menus_item > a.site-page');
    }
    return null;
  }

  function mark() {
    var old = document.querySelectorAll('#nav .menus_items .site-page.active');
    for (var i = 0; i < old.length; i++) old[i].classList.remove('active');

    var matched = findMatch();
    if (matched) matched.classList.add('active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mark);
  } else {
    mark();
  }
  document.addEventListener('pjax:complete', mark);
})();
