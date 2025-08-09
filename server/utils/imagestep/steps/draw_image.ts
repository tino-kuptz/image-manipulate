import sharp, { Sharp } from 'sharp'
import { z } from 'zod'
import type { StepImplementation } from '../registry'
import { loadBufferFromUrl } from '../../common'

const DrawImageSchema = z.object({
  action: z.literal('draw_image'),
  source: z.string().url(),
  x: z.number().int().nonnegative().default(0),
  y: z.number().int().nonnegative().default(0),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  opacity: z.number().min(0).max(1).default(1),
})

// replaced by common util

export const draw_image: StepImplementation = {
  name: 'draw_image',
  isBaseImageProvider: false,
  async apply(currentImage: Sharp | undefined, stepRaw: Record<string, any>): Promise<Sharp> {
    // Draw a bitmap onto the working canvas at given position and size
    if (!currentImage) throw new Error('draw_image requires an existing canvas')
    const step = DrawImageSchema.parse(stepRaw)
    const baseBuffer = await loadBufferFromUrl(step.source)
    let overlay = sharp(baseBuffer)
    if (step.width || step.height) {
      overlay = overlay.resize(step.width, step.height, { fit: 'cover' })
    }

    let overlayBuffer = await overlay.png().toBuffer()
    // Apply overall opacity by scaling the alpha channel before compositing
    if (step.opacity < 1) {
      overlayBuffer = await sharp(overlayBuffer)
        .ensureAlpha()
        .linear([1, 1, 1, step.opacity], [0, 0, 0, 0])
        .png()
        .toBuffer()
    }
    // Avoid premultiplied alpha surprises
    return currentImage.ensureAlpha().composite([
      {
        input: overlayBuffer,
        left: step.x ?? 0,
        top: step.y ?? 0,
      },
    ])
  },
}


