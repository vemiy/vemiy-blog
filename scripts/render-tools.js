const { escapeHTML } = require('hexo-util');

hexo.extend.filter.register('before_post_render', data => {
  if (data.source !== 'tools/index.md') return data;

  const tools = hexo.locals.get('data').tools || [];
  const cards = tools.map(tool => [
    '<a class="vemiy-tools-item" href="' + escapeHTML(tool.href) + '">',
    '<div class="vemiy-tools-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' + tool.icon + '</svg></div>',
    '<div class="vemiy-tools-text"><div class="vemiy-tools-name">' + escapeHTML(tool.name) + '</div><div class="vemiy-tools-desc">' + escapeHTML(tool.desc) + '</div></div>',
    '</a>'
  ].join('')).join('');

  data.content = data.content.replace('<!-- tools-list -->', cards);
  return data;
});
