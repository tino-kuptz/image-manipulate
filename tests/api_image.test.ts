/**
 * API tests for POST /api/v1/image
 *
 * We spin up a minimal h3 app, mount the real route handler, and send HTTP
 * requests against it. This validates the end-to-end behavior including
 * payload parsing (with JSONC), step processing, and response headers/body.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createApp, toNodeListener } from 'h3'
import http from 'node:http'
import imageHandler from '../server/api/v1/image.post'

async function startTestServer() {
  const app = createApp()
  // Mount the actual route handler under the expected path
  app.use('/api/v1/image', imageHandler)
  const server = http.createServer(toNodeListener(app))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server')
  const baseURL = `http://127.0.0.1:${address.port}`
  return { server, baseURL }
}

describe('POST /api/v1/image', () => {
  let server: http.Server
  let baseURL: string

  beforeAll(async () => {
    const s = await startTestServer()
    server = s.server
    baseURL = s.baseURL
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('returns a PNG image for a valid JSONC payload', async () => {
    const body = `{
      // we use JSONC here on purpose
      "format": "png",
      "quality": 90,
      "canvas": { "width": 256, "height": 128 },
      "steps": [
        { "action": "write_text", "x": 10, "y": 10, "width": 200, "height": 60, "text": "Test" }
      ]
    }`
    const res = await fetch(`${baseURL}/api/v1/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/jsonc', Accept: 'image/png' },
      body,
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/image\/png/)
    const buf = new Uint8Array(await res.arrayBuffer())
    expect(buf.byteLength).toBeGreaterThan(0)
  })

  it('returns 400 for invalid payload (no steps)', async () => {
    const body = `{
      "format": "png",
      "quality": 90,
      "canvas": { "width": 64, "height": 64 },
      "steps": []
    }`
    const res = await fetch(`${baseURL}/api/v1/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/jsonc', Accept: 'application/json' },
      body,
    })
    expect(res.status).toBe(400)
    const text = await res.text()
    expect(text).toMatch(/Invalid payload/)
  })
})


