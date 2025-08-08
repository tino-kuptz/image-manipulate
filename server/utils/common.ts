import sharp from 'sharp'

/**
 * Measure the rendered width (in pixels) of a text string for a given font and size.
 *
 * Why: We need reliable word wrapping in SVG without a full layout engine. By
 * rendering the text into an off-screen SVG and trimming it with Sharp, we can
 * approximate the occupied width closely enough for greedy wrapping.
 */
export async function measureTextWidthPx(text: string, fontFamily: string, fontSizePx: number): Promise<number> {
  if (!text) return 0
  const w = 2048
  const h = Math.max(32, Math.ceil(fontSizePx * 2))
  const ascent = Math.round(fontSizePx * 0.8)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <style>text{font-family:'${fontFamily}', sans-serif; font-size:${fontSizePx}px; fill:#000}</style>
  <text x="0" y="${ascent}">${escapeXml(text)}</text>
</svg>`

  const rendered = await sharp(Buffer.from(svg)).png().toBuffer()
  const { info } = await sharp(rendered).trim().toBuffer({ resolveWithObject: true })
  return info.width
}

/**
 * Escape XML special characters to prevent malformed SVG when injecting text.
 */
export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Fetch a remote resource and return it as a Node Buffer. Throws for non-OK HTTP.
 *
 * Why: Step implementations often need to load external images for composition.
 */
export async function loadBufferFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load: ${url}`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

/**
 * Greedy word-wrapping based on measured pixel width. Falls back to per-character
 * splitting only for words that individually exceed the available width.
 *
 * Why: This produces visually pleasing lines while avoiding pathological breaks
 * with long uninterrupted tokens.
 */
export async function wrapTextByMeasuredWidth(text: string, maxWidthPx: number, font: string, fontSize: number): Promise<string[]> {
  if (maxWidthPx <= 0) return [text]
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  let currentWidth = 0
  for (const word of words) {
    const proposal = current ? current + ' ' + word : word
    const widthProposal = await measureTextWidthPx(proposal, font, fontSize)
    if (widthProposal <= maxWidthPx) {
      current = proposal
      currentWidth = widthProposal
    } else {
      if (current) lines.push(current)
      const wordWidth = await measureTextWidthPx(word, font, fontSize)
      if (wordWidth > maxWidthPx) {
        let chunk = ''
        for (const ch of word) {
          const test = chunk + ch
          const tw = await measureTextWidthPx(test, font, fontSize)
          if (tw <= maxWidthPx) {
            chunk = test
          } else {
            if (chunk) lines.push(chunk)
            chunk = ch
          }
        }
        current = chunk
        currentWidth = await measureTextWidthPx(current, font, fontSize)
      } else {
        current = word
        currentWidth = wordWidth
      }
    }
  }
  if (current) lines.push(current)
  return lines
}


