// 生成时按名称拼音排序友链
hexo.extend.filter.register('template_locals', function (locals) {
  const link = locals.site && locals.site.data && locals.site.data.link
  if (Array.isArray(link)) {
    link.forEach(function (c) {
      if (Array.isArray(c.link_list)) {
        c.link_list.sort(function (a, b) {
          return (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN')
        })
      }
    })
  }
  return locals
})
