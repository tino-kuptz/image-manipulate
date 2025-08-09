/**
 * Tests for the draw_image step
 *
 * Goals:
 * - Verify an external image is fetched and composited at the correct position
 * - Verify global overlay opacity is respected when compositing
 *
 * Notes on mocking fetch:
 * - draw_image loads the overlay via fetch(). To avoid network I/O and
 *   nondeterminism, we replace global.fetch with a stub that returns a
 *   pre-rendered PNG buffer. This keeps the test fast and deterministic.
 */
import sharp from 'sharp'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { draw_image } from '../server/utils/imagestep/steps/draw_image'
import { createCanvas, getPixelRGBA } from './helpers'

async function makePng(width: number, height: number, color: { r: number; g: number; b: number; alpha: number }) {
  return await sharp({
    create: { width, height, channels: 4, background: color },
  })
    .png()
    .toBuffer()
}

describe('draw_image', () => {
  const url = 'https://example.com/overlay.png'
  let originalFetch: any

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('composites an external image at the given position', async () => {
    const overlay = await makePng(10, 10, { r: 0, g: 0, b: 0, alpha: 1 })
    global.fetch = vi.fn(async () => ({ ok: true, arrayBuffer: async () => overlay.buffer })) as any

    const base = await createCanvas(50, 50, { r: 255, g: 255, b: 255, alpha: 1 })
    const out = await draw_image.apply(base, { action: 'draw_image', source: url, x: 5, y: 7, width: 10, height: 10 })

    const inside = await getPixelRGBA(out, 5, 7)
    expect(inside.r).toBe(0)
    expect(inside.g).toBe(0)
    expect(inside.b).toBe(0)
    const outside = await getPixelRGBA(out, 0, 0)
    expect(outside.r).toBe(255)
    expect(outside.g).toBe(255)
    expect(outside.b).toBe(255)
  })

  it('respects opacity when compositing', async () => {
    const overlay = await makePng(10, 10, { r: 0, g: 0, b: 0, alpha: 1 })
    global.fetch = vi.fn(async () => ({ ok: true, arrayBuffer: async () => overlay.buffer })) as any

    const base = await createCanvas(50, 50, { r: 255, g: 255, b: 255, alpha: 1 })
    const out = await draw_image.apply(base, { action: 'draw_image', source: url, x: 20, y: 10, width: 10, height: 10, opacity: 0.5 })
    const p = await getPixelRGBA(out, 20, 10)
    expect(p.r).toBeGreaterThan(0)
    expect(p.r).toBeLessThan(255)
    expect(p.r).toBe(p.g)
    expect(p.g).toBe(p.b)
  })

  it('resizes overlay to requested width/height (cover fit)', async () => {
    // Create a 20x10 black overlay; request drawing into 10x20 area
    const overlay = await makePng(20, 10, { r: 0, g: 0, b: 0, alpha: 1 })
    global.fetch = vi.fn(async () => ({ ok: true, arrayBuffer: async () => overlay.buffer })) as any
    const base = await createCanvas(40, 40, { r: 255, g: 255, b: 255, alpha: 1 })
    const out = await draw_image.apply(base, { action: 'draw_image', source: url, x: 5, y: 5, width: 10, height: 20 })
    // Check that the destination top-left pixel is black (overlay present)
    const p = await getPixelRGBA(out, 5, 5)
    expect(p.r).toBe(0)
    expect(p.g).toBe(0)
    expect(p.b).toBe(0)
  })
})


