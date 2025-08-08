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

    const overlayBuffer = await overlay.png().toBuffer()
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


