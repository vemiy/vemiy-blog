'use strict'
// 复制 _headers 到 public/（Hexo 跳过 _ 开头文件）
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
