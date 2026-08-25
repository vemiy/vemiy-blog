#!/usr/bin/env node
'use strict'
const fs = require('fs')
const path = require('path')

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi

const MODES = { ENTITIES: 'entities', REVEAL: 'reveal-on-load' }

function obfuscateChar(ch) {
  const c = ch.charCodeAt(0)
  return Math.random() < 0.5 ? `&#${c};` : `&#x${c.toString(16)};`
}

function obfuscate(str) { return str.split('').map(obfuscateChar).join('') }

function xorHex(email) {
  const key = 1 + Math.floor(Math.random() * 254)
  let out = key.toString(16).padStart(2, '0')
  for (let i = 0; i < email.length; i++) {
    out += (email.charCodeAt(i) ^ key).toString(16).padStart(2, '0')
  }
  return out
}

function revealSpan(email, label) {
  const attr = label ? ` data-t="${label.replace(/"/g, '&quot;')}"` : ''
  return `<span class="eo-reveal" data-e="${xorHex(email)}"${attr}>[email]</span>`
}

const DECODER_JS = '<script>(function(){function r(){for(var els=document.querySelectorAll(".eo-reveal[data-e]"),i=0;i<els.length;i++){var el=els[i],h=el.getAttribute("data-e");if(!h)continue;for(var k=parseInt(h.slice(0,2),16),s="",j=2;j<h.length;j+=2)s+=String.fromCharCode(parseInt(h.substr(j,2),16)^k);var a=document.createElement("a");a.href="mailto:"+s;var t=el.getAttribute("data-t");a.textContent=t||s;el.textContent="",el.appendChild(a)}}r();document.addEventListener("pjax:complete",r)})();</script>'

function splitHead(html) {
  const headEnd = html.indexOf('</head>')
  if (headEnd === -1) return { head: '', body: html }
  return { head: html.slice(0, headEnd), body: html.slice(headEnd) }
}

function shieldBlocks(body) {
  const blocks = []
  body = body.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, (m) => { blocks.push(m); return '\u0000B' + (blocks.length - 1) + '\u0000' })
  const restore = (b) => b.replace(/\u0000B(\d+)\u0000/g, (m, i) => blocks[+i])
  return { body, restore }
}

function obfuscateEntities(html) {
  const { head, body: b0 } = splitHead(html)
  const { body: b1, restore } = shieldBlocks(b0)
  let body = b1.replace(/(href=["']mailto:)([^"'@]+@[^"']+)(["'])/gi, (m, pre, mid, post) => pre + obfuscate(mid) + post)
  body = body.replace(EMAIL_RE, obfuscate)
  return head + restore(body)
}

function revealTransform(html) {
  const { head, body: b0 } = splitHead(html)
  const { body: b1, restore } = shieldBlocks(b0)
  let hits = 0
  let body = b1.replace(/<a\b[^>]*href\s*=\s*(["'])mailto:[^"']*@[^"']*\1[^>]*>[\s\S]*?<\/a>/gi, (m) => {
    const addr = m.match(EMAIL_RE)
    if (!addr) return m
    hits++
    const innerM = m.match(/>([\s\S]*)<\/a>/i)
    const label = innerM ? innerM[1].replace(/<[^>]*>/g, '').trim() : ''
    return revealSpan(addr[0], label && !label.includes('@') ? label : '')
  })
  body = body.replace(EMAIL_RE, (s) => { hits++; return revealSpan(s) })
  body = restore(body)
  if (!hits) return html
  const closer = body.toLowerCase().lastIndexOf('</body>')
  if (closer !== -1) body = body.slice(0, closer) + DECODER_JS + body.slice(closer)
  else body += DECODER_JS
  return head + body
}

function obfuscateEmails(html, mode) {
  return mode === MODES.REVEAL ? revealTransform(html) : obfuscateEntities(html)
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.html')) out.push(p)
  }
  return out
}

function resolveMode(argv) {
  let mode = process.env.EMAIL_OBFUSCATE_MODE || MODES.ENTITIES
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--mode') { mode = argv[i + 1]; i++ }
    else if (a.indexOf('--mode=') === 0) { mode = a.slice('--mode='.length) }
  }
  if (mode !== MODES.ENTITIES && mode !== MODES.REVEAL) {
    console.error(`email-obfuscate: unknown mode "${mode}" (expected "${MODES.ENTITIES}" or "${MODES.REVEAL}")`)
    process.exit(1)
  }
  return mode
}

if (require.main === module) {
  const mode = resolveMode(process.argv)
  const publicDir = path.join(process.cwd(), 'public')
  if (!fs.existsSync(publicDir)) { console.log('public/ not found, skip.'); process.exit(0) }
  let count = 0
  for (const file of walk(publicDir, [])) {
    try {
      const raw = fs.readFileSync(file, 'utf8')
      const out = obfuscateEmails(raw, mode)
      if (out !== raw) { fs.writeFileSync(file, out, 'utf8'); count++ }
    } catch (err) { console.error(`skip ${file}: ${err.message}`) }
  }
  const tag = mode === MODES.REVEAL ? ' (reveal-on-load)' : ''
  console.log(`email-obfuscate: ${count} html file(s) obfuscated${tag}.`)
}

module.exports = { obfuscateEmails }
