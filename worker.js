/**
 * Cloudflare Worker: Email Obfuscation
 *
 * Protects email addresses in HTML responses from being scraped by bots.
 * Browsers render emails normally; crawlers see entity-encoded gibberish.
 *
 * Works with any static site on Cloudflare (Pages, Workers Static Assets, etc.).
 */

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi

function obfuscateChar(ch) {
  const code = ch.charCodeAt(0)
  return Math.random() < 0.5 ? `&#${code};` : `&#x${code.toString(16)};`
}

function obfuscate(str) {
  return str.split('').map(obfuscateChar).join('')
}

function obfuscateEmails(html) {
  const headEnd = html.indexOf('</head>')
  let head = ''
  let body = html
  if (headEnd !== -1) {
    head = html.slice(0, headEnd)
    body = html.slice(headEnd)
  }

  const blocks = []
  body = body.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, (m) => {
    blocks.push(m)
    return `\u0000B${blocks.length - 1}\u0000`
  })

  body = body.replace(
    /(href=["']mailto:)([^"'@]+@[^"']+)(["'])/gi,
    (m, pre, mid, post) => pre + obfuscate(mid) + post
  )
  body = body.replace(EMAIL_RE, obfuscate)
  body = body.replace(/\u0000B(\d+)\u0000/g, (m, i) => blocks[+i])

  return head + body
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.includes('text/html')) return response

    try {
      const html = await response.text()
      const out = obfuscateEmails(html)
      const headers = new Headers(response.headers)
      headers.set('X-Worker-Processed', 'true')
      return new Response(out, { status: response.status, headers })
    } catch {
      return response
    }
  }
}
