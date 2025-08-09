import { Sharp } from 'sharp'
import { z } from 'zod'
import type { StepImplementation } from '../registry'

const DrawLineSchema = z.object({
  action: z.literal('draw_line'),
  points: z.array(z.tuple([z.number(), z.number()])).min(2),
  stroke: z.string().default('#000000'),
  stroke_width: z.number().positive().default(2),
  opacity: z.number().min(0).max(1).default(1),
})

/**
 * Calculate the view box for a set of points.
 */
function toViewBox(points: Array<[number, number]>): { minX: number; minY: number; width: number; height: number } {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  return { minX, minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) }
}

export const draw_line: StepImplementation = {
  name: 'draw_line',
  isBaseImageProvider: false,
  async apply(image: Sharp | undefined, stepRaw: Record<string, any>): Promise<Sharp> {
    if (!image) throw new Error('draw_line requires an existing image')
    const step = DrawLineSchema.parse(stepRaw)

    const { minX, minY, width, height } = toViewBox(step.points)
    const normalized = step.points.map(([x, y]) => `${x - minX},${y - minY}`).join(' ')
    const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <polyline points="${normalized}" fill="none" stroke="${step.stroke}" stroke-width="${step.stroke_width}" stroke-opacity="${step.opacity}" />
</svg>`)

    return image.ensureAlpha().composite([
      {
        input: svg,
        left: minX,
        top: minY,
      },
    ])
  },
}


