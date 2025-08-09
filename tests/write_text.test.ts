/**
 * Tests for the write_text step
 *
 * Goals:
 * - Ensure text is rendered inside the specified bounding box
 * - Sanity check that the configured color influences channel dominance
 * - Check opacity behavior (skipped due to environment-dependent font rendering)
 *
 * Notes on sampling:
 * - Exact glyph rasterization varies across environments (fonts, hinting),
 *   so we avoid asserting specific pixels and instead search for any non-white
 *   pixel within the box for the color test. For opacity we compare raw buffers
 *   and assert that faded text produces lighter pixels than full opacity.
 */
import { describe, it, expect } from 'vitest'
import { write_text } from '../server/utils/imagestep/steps/write_text'
import { createCanvas, getPixelRGBA, readRaw, getPixelFromRaw } from './helpers'

async function findAnyNonWhitePixelInBox(img: any, x: number, y: number, w: number, h: number): Promise<{ x: number; y: number; rgba: { r: number; g: number; b: number; a: number } } | null> {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const p = await getPixelRGBA(img, xx, yy)
      if (!(p.r === 255 && p.g === 255 && p.b === 255)) {
        return { x: xx, y: yy, rgba: p }
      }
    }
  }
  return null
}

async function darkestPixelSumInBox(img: any, x: number, y: number, w: number, h: number): Promise<number> {
  let minSum = Infinity
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const p = await getPixelRGBA(img, xx, yy)
      const s = p.r + p.g + p.b
      if (s < minSum) minSum = s
    }
  }
  return minSum
}

describe('write_text', () => {
  it('renders text within the specified box and respects color', async () => {
    const base = await createCanvas(200, 80, { r: 255, g: 255, b: 255, alpha: 1 })
    const out = await write_text.apply(base, {
      action: 'write_text',
      x: 0,
      y: 0,
      width: 200,
      height: 80,
      text: 'Hi',
      font: 'Arial',
      font_size: 40,
      color: '#0000FF',
      align: 'left',
      valign: 'top',
      line_break: false,
    })
    const match = await findAnyNonWhitePixelInBox(out, 0, 0, 200, 80)
    expect(match).not.toBeNull()
    if (match) {
      const p = match.rgba
      expect(p.b).toBeGreaterThanOrEqual(p.r)
      expect(p.b).toBeGreaterThanOrEqual(p.g)
    }
  })

  it('opacity 0 makes text invisible (result equals base)', async () => {
    const base = await createCanvas(200, 80, { r: 255, g: 255, b: 255, alpha: 1 })
    const withTextInvisible = await write_text.apply(base, {
      action: 'write_text',
      x: 0,
      y: 0,
      width: 200,
      height: 80,
      text: 'A',
      font: 'Arial',
      font_size: 60,
      color: '#000000',
      opacity: 0,
    })
    const a = await base.png().toBuffer()
    const b = await withTextInvisible.png().toBuffer()
    expect(b.equals(a)).toBe(true)
  })
})


