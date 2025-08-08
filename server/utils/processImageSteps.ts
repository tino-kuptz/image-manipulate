import sharp, { Sharp } from 'sharp'
import { z } from 'zod'
import { resolveStep } from '~/server/utils/imagestep/registry'

export type AnyJson = Record<string, unknown>

export interface ImageJobPayload {
  format: 'png' | 'jpg' | 'jpeg'
  quality?: number
  canvas?: { width: number; height: number }
  steps: Array<{ action: string } & AnyJson>
}

/**
 * Process the list of image steps starting from a white canvas of size canvas.width × canvas.height.
 * After each step, the intermediate image is "baked" to ensure following steps
 * operate on rasterized pixels rather than deferred pipelines.
 */
export async function processImageSteps(payload: ImageJobPayload): Promise<Sharp> {
  if (!payload.canvas) {
    throw new Error('canvas.width and canvas.height are required')
  }

  const { width, height } = payload.canvas
  // Start with a white canvas as the base image
  let image = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })

  // Apply all steps in order onto the canvas
  for (const step of payload.steps) {
    const impl = resolveStep(step.action)
    if (!impl) throw new Error(`Unknown step action: ${step.action}`)
    image = await impl.apply(image, step)
    // Materialize the pipeline after each step so subsequent steps
    // build upon the current rasterized image rather than replacing overlays
    const baked = await image.png().toBuffer()
    image = sharp(baked)
  }

  return image
}


