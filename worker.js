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

/**
 * Obfuscate emails inside <body> only.
 * <head> (title/meta/og) preserved for SEO and social cards.
 * <script>/<style> preserved so JS and CSS keep working.
 */
function obfuscateEmails(html) {
  const headEnd = html.indexOf('</head>')
  let head = ''
  let body = html
  if (headEnd !== -1) {
    head = html.slice(0, headEnd)
    body = html.slice(headEnd)
  }

  // Protect <script>/<style> blocks from being modified
  const blocks = []
  body = body.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, (m) => {
    blocks.push(m)
    return `\u0000B${blocks.length - 1}\u0000`
  })

  // Encode mailto: hrefs
  body = body.replace(
    /(href=["']mailto:)([^"'@]+@[^"']+)(["'])/gi,
    (m, pre, mid, post) => pre + obfuscate(mid) + post
  )

  // Encode plaintext emails in body
  body = body.replace(EMAIL_RE, obfuscate)

  // Restore protected blocks
  body = body.replace(/\u0000B(\d+)\u0000/g, (m, i) => blocks[+i])

  return head + body
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)

    // Only process HTML responses
    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.includes('text/html')) return response

    try {
      const html = await response.text()
      console.log('[DEBUG] html length:', html.length, 'contains email:', /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(html))
      const obf = obfuscateEmails(html)
      console.log('[DEBUG] obf length:', obf.length, 'still has email:', /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(obf))
      return new Response(obf, response)
    } catch (e) {
      // On any error, return the original response unchanged
      return response
    }
  }
}
