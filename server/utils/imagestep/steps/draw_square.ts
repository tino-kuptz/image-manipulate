import { Sharp } from 'sharp'
import { z } from 'zod'
import type { StepImplementation } from '../registry'

const DrawSquareSchema = z.object({
  action: z.literal('draw_square'),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fill: z.string().optional(),
  stroke: z.string().default('#000000'),
  stroke_width: z.number().nonnegative().default(0),
  radius: z.number().nonnegative().default(0),
  opacity: z.number().min(0).max(1).default(1),
})

export const draw_square: StepImplementation = {
  name: 'draw_square',
  isBaseImageProvider: false,
  async apply(image: Sharp | undefined, stepRaw: Record<string, any>): Promise<Sharp> {
    if (!image) throw new Error('draw_square requires an existing image')
    const step = DrawSquareSchema.parse(stepRaw)

    const rectFill = step.fill ?? 'none'
    const rectStroke = step.stroke
    const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${step.width}" height="${step.height}" viewBox="0 0 ${step.width} ${step.height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${step.width}" height="${step.height}" rx="${step.radius}" ry="${step.radius}" fill="${rectFill}" stroke="${rectStroke}" stroke-width="${step.stroke_width}" fill-opacity="${step.opacity}" />
</svg>`) 

    return image.ensureAlpha().composite([
      {
        input: svg,
        left: step.x,
        top: step.y,
      },
    ])
  },
}


