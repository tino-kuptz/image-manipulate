import { z } from 'zod'
import sharp from 'sharp'
import { createError, getRequestHeaders, setResponseHeader, readBody, defineEventHandler } from 'h3'
import { processImageSteps } from '~/server/utils/processImageSteps'
import stripJsonComments from 'strip-json-comments'
import { promises as fs } from 'fs'

// Canvas describes the output image size
const CanvasSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

// Base for step validation; each concrete step validates its own fields
const StepBaseSchema = z.object({
  action: z.string(),
})

// We allow arbitrary step data; concrete validators live per step implementation
// Incoming payload schema for image processing
const RequestSchema = z.object({
  format: z.enum(['png', 'jpg', 'jpeg']).default('png'),
  quality: z.number().int().min(1).max(100).default(90),
  canvas: CanvasSchema.optional(),
  steps: z.array(StepBaseSchema.and(z.record(z.any()))).min(1),
})

export default defineEventHandler(async (event) => {
  // Read from example-convert.jsonc instead of request body
  const fileContent = await fs.readFile('example-convert.jsonc', 'utf-8')
  const jsonContent = JSON.parse(stripJsonComments(fileContent))
  const parseResult = RequestSchema.safeParse(jsonContent)
  if (!parseResult.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parseResult.error.flatten() })
  }

  const payload = parseResult.data

  try {
    const image = await processImageSteps(payload)

    const format = payload.format === 'jpeg' ? 'jpg' : payload.format
    const quality = payload.quality ?? 90

    let out = image
    if (format === 'png') {
      // ensure alpha is preserved and opaque where needed
      out = image.png({ quality })
      setResponseHeader(event, 'Content-Type', 'image/png')
    } else {
      out = image.jpeg({ quality })
      setResponseHeader(event, 'Content-Type', 'image/jpeg')
    }

    const buffer = await out.toBuffer()
    return buffer
  } catch (err: any) {
    // If the client expects an image but we fail, respond with JSON error
    const accept = getRequestHeaders(event)['accept'] || ''
    if (typeof accept === 'string' && accept.includes('image/')) {
      throw createError({ statusCode: 500, statusMessage: 'Image processing failed' })
    }
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Image processing failed' })
  }
})


