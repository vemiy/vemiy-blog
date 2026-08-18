// 生成时按名称排序友链
function charClass(ch) {
  if (/[0-9]/.test(ch)) return 1
  if (/[a-zA-Z]/.test(ch)) return 2
  if (/[\u4e00-\u9fff]/.test(ch)) return 3
  return 0
}

hexo.extend.filter.register('template_locals', function (locals) {
  const link = locals.site && locals.site.data && locals.site.data.link
  if (Array.isArray(link)) {
    link.forEach(function (c) {
      if (Array.isArray(c.link_list)) {
        c.link_list.sort(function (a, b) {
          const na = a.name || '', nb = b.name || ''
          const ca = charClass(na.charAt(0)), cb = charClass(nb.charAt(0))
          if (ca !== cb) return ca - cb
          return na.localeCompare(nb, undefined, { numeric: true, sensitivity: 'base' })
        })
      }
    })
  }
  return locals
})
