import { Sharp } from 'sharp'
import { z } from 'zod'
import type { StepImplementation } from '../registry'

const BlurRegionSchema = z.object({
  action: z.literal('blur_region'),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sigma: z.number().positive().default(10),
})

export const blur_region: StepImplementation = {
  name: 'blur_region',
  isBaseImageProvider: false,
  async apply(image: Sharp | undefined, stepRaw: Record<string, any>): Promise<Sharp> {
    if (!image) throw new Error('blur_region requires an existing image')
    const step = BlurRegionSchema.parse(stepRaw)

    // Extract the region, blur it, and composite it back at the same position
    const blurredRegionBuffer = await image
      .clone()
      .extract({ left: step.x, top: step.y, width: step.width, height: step.height })
      .blur(step.sigma)
      .png()
      .toBuffer()

    return image.ensureAlpha().composite([
      {
        input: blurredRegionBuffer,
        left: step.x,
        top: step.y,
      },
    ])
  },
}


