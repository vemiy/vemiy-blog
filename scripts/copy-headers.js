'use strict'
// 构建后把 source/_headers 复制到 public/，供 Cloudflare Pages 识别缓存头
// （Hexo 默认跳过 _ 开头文件，需手动复制）
const fs = require('fs')
const path = require('path')

hexo.extend.filter.register('after_generate', () => {
  const src = path.join(hexo.source_dir, '_headers')
  const dest = path.join(hexo.public_dir, '_headers')
  if (fs.existsSync(src)) {
    fs.mkdirSync(hexo.public_dir, { recursive: true })
    fs.copyFileSync(src, dest)
  }
})
