/**
 * Tests for the blur_region step
 *
 * Goals:
 * - Verify that a Gaussian blur applied to a region blends contrasting colors
 *   within the region while leaving far-outside pixels unchanged.
 *
 * Notes on setup:
 * - We avoid depending on other steps; we build a white canvas and manually
 *   draw a black square (via raw buffer composition) so the blur boundary is
 *   well-defined. Then we blur a region overlapping the square edge and
 *   assert the pixel just left of the edge is darkened.
 */
import { describe, it, expect } from 'vitest'
import { blur_region } from '../server/utils/imagestep/steps/blur_region'
import { createCanvas, getPixelRGBA } from './helpers'

describe('blur_region', () => {
  it('manually drawn square: blur influences the pixel just left of its edge', async () => {
    const width = 50
    const height = 30
    const channels = 4
    const buf = Buffer.alloc(width * height * channels, 255) // white with alpha 255 by default
    // Draw a solid black 10x10 square at (20,10)
    for (let y = 10; y < 20; y++) {
      for (let x = 20; x < 30; x++) {
        const idx = (y * width + x) * channels
        buf[idx + 0] = 0 // R
        buf[idx + 1] = 0 // G
        buf[idx + 2] = 0 // B
        buf[idx + 3] = 255 // A
      }
    }
    const composed = (await import('sharp')).default(buf, { raw: { width, height, channels } })

    // Before blur: pixel just left of square (19,15) is pure white
    const beforeLeft = await getPixelRGBA(composed, 19, 15)
    expect(beforeLeft.r).toBe(255)
    expect(beforeLeft.g).toBe(255)
    expect(beforeLeft.b).toBe(255)

    // Apply blur covering left edge of the square
    const out = await blur_region.apply(composed, { action: 'blur_region', x: 15, y: 5, width: 20, height: 20, sigma: 8 })

    const afterLeft = await getPixelRGBA(out, 19, 15)
    expect(afterLeft.r).toBeLessThan(255)
    expect(afterLeft.g).toBeLessThan(255)
    expect(afterLeft.b).toBeLessThan(255)

    // Far outside unchanged
    const far = await getPixelRGBA(out, 0, 0)
    expect(far.r).toBe(255)
    expect(far.g).toBe(255)
    expect(far.b).toBe(255)
  })

  it('does not affect pixels when sigma is very small', async () => {
    const width = 40
    const height = 20
    const channels = 4
    const buf = Buffer.alloc(width * height * channels, 255) // white
    // Draw a vertical black line at x=20
    for (let y = 0; y < height; y++) {
      const idx = (y * width + 20) * channels
      buf[idx + 0] = 0
      buf[idx + 1] = 0
      buf[idx + 2] = 0
      buf[idx + 3] = 255
    }
    const img = (await import('sharp')).default(buf, { raw: { width, height, channels } })
    const out = await blur_region.apply(img, { action: 'blur_region', x: 0, y: 0, width, height, sigma: 0.3 })
    // pick far pixel
    const p = await getPixelRGBA(out, 0, 0)
    expect(p.r).toBe(255)
    expect(p.g).toBe(255)
    expect(p.b).toBe(255)
  })
})


