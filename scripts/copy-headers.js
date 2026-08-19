'use strict'
// 构建后把项目根的 _headers 复制到 public/，供 Cloudflare Pages 识别缓存头
const fs = require('fs')
const path = require('path')

hexo.extend.filter.register('after_generate', () => {
  const src = path.join(hexo.base_dir, '_headers')
  const dest = path.join(hexo.public_dir, '_headers')
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest)
  }
})
