/**
 * Tests for the draw_line (polyline) step
 *
 * Goals:
 * - Ensure a polyline drawn across the canvas affects pixels near the path
 * - Confirm distant pixels remain unchanged
 *
 * Notes on assertions:
 * - Due to anti-aliasing, we don't assert exact color values. We instead check
 *   that sampled pixels near the path are darker than the white background.
 */
import { describe, it, expect } from 'vitest'
import { draw_line } from '../server/utils/imagestep/steps/draw_line'
import { createCanvas, getPixelRGBA } from './helpers'

describe('draw_line', () => {
  it('draws a polyline and colors along the path', async () => {
    const img = await createCanvas(200, 200, { r: 255, g: 255, b: 255, alpha: 1 })
    const out = await draw_line.apply(img, {
      action: 'draw_line',
      points: [
        [10, 10],
        [60, 40],
        [120, 20],
        [180, 80],
      ],
      stroke: '#000',
      stroke_width: 4,
    })
    const pNearPath = await getPixelRGBA(out, 60, 40)
    expect(pNearPath.r).toBeLessThan(255)
    expect(pNearPath.g).toBeLessThan(255)
    expect(pNearPath.b).toBeLessThan(255)
    const pFar = await getPixelRGBA(out, 5, 190 - 5)
    expect(pFar.r).toBe(255)
    expect(pFar.g).toBe(255)
    expect(pFar.b).toBe(255)
  })

  it('respects stroke color and width', async () => {
    const img = await createCanvas(200, 200, { r: 255, g: 255, b: 255, alpha: 1 })
    const out = await draw_line.apply(img, {
      action: 'draw_line',
      points: [
        [20, 20],
        [180, 20],
      ],
      stroke: '#FF0000',
      stroke_width: 6,
    })
    // On the path
    const p = await getPixelRGBA(out, 100, 20)
    expect(p.r).toBeGreaterThan(150)
    expect(p.g).toBeLessThan(100)
    expect(p.b).toBeLessThan(100)
    // Slightly above should be white with given width
    const above = await getPixelRGBA(out, 100, 12)
    const below = await getPixelRGBA(out, 100, 28)
    expect(above.r).toBe(255)
    expect(below.r).toBe(255)
  })
})


