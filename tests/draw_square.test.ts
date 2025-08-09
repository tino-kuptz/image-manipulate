/**
 * Tests for the draw_square step
 *
 * Goals:
 * - Verify that a filled rectangle is drawn at the correct coordinates
 * - Check that pixels inside the rect match the fill color and outside remain unchanged
 */
import { describe, it, expect } from 'vitest'
import { draw_square } from '../server/utils/imagestep/steps/draw_square'
import { createCanvas, getPixelRGBA } from './helpers'

describe('draw_square', () => {
  it('draws a filled square at the expected location', async () => {
    const img = await createCanvas(100, 100, { r: 255, g: 255, b: 255, alpha: 1 })
    const out = await draw_square.apply(img, {
      action: 'draw_square',
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      fill: '#0000FF',
    })
    // Inside the square: expect blue
    const pInside = await getPixelRGBA(out, 15, 15)
    expect(pInside.r).toBe(0)
    expect(pInside.g).toBe(0)
    expect(pInside.b).toBe(255)
    // Outside the square: expect white
    const pOutside = await getPixelRGBA(out, 5, 5)
    expect(pOutside.r).toBe(255)
    expect(pOutside.g).toBe(255)
    expect(pOutside.b).toBe(255)
  })

  it('draws only a stroke (no fill) with the given color and width', async () => {
    const img = await createCanvas(100, 100, { r: 255, g: 255, b: 255, alpha: 1 })
    const out = await draw_square.apply(img, {
      action: 'draw_square',
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      stroke: '#FF0000',
      stroke_width: 8,
      // no fill specified -> none
    })
    // Border pixel near left edge (inside stroke thickness)
    const border = await getPixelRGBA(out, 13, 30)
    expect(border.r).toBeGreaterThan(200)
    expect(border.g).toBeLessThan(60)
    expect(border.b).toBeLessThan(60)
    // Center should remain white (no fill)
    const center = await getPixelRGBA(out, 30, 30)
    expect(center.r).toBe(255)
    expect(center.g).toBe(255)
    expect(center.b).toBe(255)
  })

  it('opacity 0 makes fill invisible (result equals base in filled area)', async () => {
    const base = await createCanvas(100, 100, { r: 255, g: 255, b: 255, alpha: 1 })
    const out = await draw_square.apply(base, {
      action: 'draw_square',
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      fill: '#FF0000',
      opacity: 0,
    })
    // Center should remain white because opacity 0 means no visible fill
    const center = await getPixelRGBA(out, 30, 30)
    expect(center.r).toBe(255)
    expect(center.g).toBe(255)
    expect(center.b).toBe(255)
  })

  it('respects corner radius (rounded corners remain background)', async () => {
    const base = await createCanvas(100, 100, { r: 255, g: 255, b: 255, alpha: 1 })
    const out = await draw_square.apply(base, {
      action: 'draw_square',
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      fill: '#0000FF',
      radius: 12,
    })
    // A pixel near the very top-left corner of the rect box should be white due to rounding
    const nearCorner = await getPixelRGBA(out, 10, 10)
    expect(nearCorner.r).toBe(255)
    expect(nearCorner.g).toBe(255)
    expect(nearCorner.b).toBe(255)
    // A pixel in the center is blue (inside fill)
    const center = await getPixelRGBA(out, 30, 30)
    expect(center.r).toBe(0)
    expect(center.g).toBe(0)
    expect(center.b).toBe(255)
  })
})


