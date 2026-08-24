'use strict'

// Obfuscate plaintext emails in all generated HTML files.
// Run after `hexo generate`. Browsers render addresses normally;
// simple web crawlers cannot extract a plaintext email from the source.

const fs = require('fs')
const path = require('path')

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

// Encode each char as a random ascii or hex HTML entity.
function obfuscateChar(ch) {
  const code = ch.charCodeAt(0)
  return Math.random() < 0.5 ? `&#${code};` : `&#x${code.toString(16)};`
}

function obfuscate(str) {
  return str
    .split('')
    .map(obfuscateChar)
    .join('')
}

// Replace emails inside <body> only. Keeps <head> (title/meta/og metadata)
// and <script>/<style> untouched so search engines and social cards read them
// as-is.
function obfuscateEmails(html) {
  const headEnd = html.indexOf('</head>')
  if (headEnd === -1) return html
  const head = html.slice(0, headEnd)
  let body = html.slice(headEnd)

  const blocks = []
  body = body.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, (m) => {
    blocks.push(m)
    return `\u0000BLOCK${blocks.length - 1}\u0000`
  })
  body = body.replace(EMAIL_RE, obfuscate)
  body = body.replace(/(href=["']mailto:)([^"'@]+@[^"']+)(["'])/gi, (m, pre, mid, post) => pre + obfuscate(mid) + post)
  body = body.replace(/\u0000BLOCK(\d+)\u0000/g, (m, i) => blocks[+i])

  return head + body
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.html')) out.push(p)
  }
  return out
}

function main() {
  const publicDir = path.join(__dirname, 'public')
  if (!fs.existsSync(publicDir)) {
    console.log('public/ not found, skip.')
    process.exit(0)
  }
  let count = 0
  for (const file of walk(publicDir, [])) {
    const raw = fs.readFileSync(file, 'utf8')
    const out = obfuscateEmails(raw)
    if (out !== raw) {
      fs.writeFileSync(file, out, 'utf8')
      count++
    }
  }
  console.log(`email-obfuscate: ${count} html file(s) obfuscated.`)
}

main()
