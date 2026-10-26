const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = 'https://app.pif.community'
const FALLBACK_IMAGE = 'https://app.pif.community/pif-og-image.png'

// Convert all non-ASCII characters to HTML entities
// This makes the output pure ASCII so encoding never matters
function toHtmlEntities(str: string): string {
  return Array.from(str).map(char => {
    const code = char.charCodeAt(0)
    return code > 127 ? `&#${code};` : char
  }).join('')
}

function escapeAscii(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeHtml(str: string): string {
  return toHtmlEntities(escapeAscii(str))
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const itemId = url.searchParams.get('id')

  if (!itemId) {
    return new Response('Not found', { status: 404 })
  }

  const apiUrl = `${SUPABASE_URL}/rest/v1/items?id=eq.${itemId}&select=id,title,description,images,item_type&limit=1`

  const apiRes = await fetch(apiUrl, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Accept': 'application/json',
    },
  })

  const buffer = await apiRes.arrayBuffer()
  const text = new TextDecoder('utf-8').decode(buffer)
  const rows = JSON.parse(text)

  if (!rows || rows.length === 0) {
    return new Response('Not found', { status: 404 })
  }

  const item = rows[0]
  const isOffer = item.item_type === 'offer'
  const titlePrefix = isOffer ? 'Piffas nu' : 'S&#246;kes'
  const rawTitle = item.title ?? ''
  const rawDescription = item.description || ''
  const ogTitle = safeHtml(`${titlePrefix}: ${rawTitle}`)
  const title = safeHtml(rawTitle)
  const description = safeHtml(rawDescription)
  const image = (item.images && item.images.length > 0)
    ? item.images[0]
    : FALLBACK_IMAGE
  const pageUrl = `${APP_URL}/item/${item.id}`
  const siteName = 'PIF &#8212; Pay It Forward'
  const dash = '&#8212;'

  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <title>${ogTitle} ${dash} PIF</title>
  <meta property="og:title" content="${ogTitle} ${dash} PIF" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${siteName}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ogTitle} ${dash} PIF" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=${pageUrl}" />
</head>
<body>
  <p>Omdirigerar till <a href="${pageUrl}">${title}</a>...</p>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
})
