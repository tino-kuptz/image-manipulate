import sharp, { Sharp } from 'sharp'
import { z } from 'zod'
import type { StepImplementation } from '../registry'
import { measureTextWidthPx, wrapTextByMeasuredWidth, escapeXml } from '../../common'

// Validation schema for parameters accepted by the write_text step
const WriteTextSchema = z.object({
  action: z.literal('write_text'),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  text: z.string(),
  font: z.string().default('Arial'),
  font_size: z.number().int().positive().default(16),
  color: z.string().default('#000000'),
  align: z.enum(['left', 'center', 'right']).default('left'),
  valign: z.enum(['top', 'center', 'bottom']).default('top'),
  line_break: z.boolean().default(true),
  opacity: z.number().min(0).max(1).default(1),
  draw_border: z
    .union([
      z.boolean(),
      z.object({
        color: z.string().default('#000000'),
        stroke_width: z.number().positive().default(2),
        radius: z.number().nonnegative().default(0),
      }),
    ])
    .optional()
    .default(false),
})

// wrapping now provided via common util

/**
 * Build an SVG for the text box, including optional border and wrapped lines.
 */
async function svgForTextBox(params: z.infer<typeof WriteTextSchema>): Promise<string> {
  const { width, height, text, font, font_size, color, align, valign, line_break, draw_border } = params

  let textAnchor = 'start'
  if (align === 'center') textAnchor = 'middle'
  if (align === 'right') textAnchor = 'end'

  // Compute absolute x
  const xPos = align === 'left' ? 0 : align === 'center' ? width / 2 : width

  // Compute absolute y using font metrics approximation
  const ascent = font_size * 0.8
  const lineHeight = Math.round(font_size * 1.2)

  const lines = line_break ? await wrapTextByMeasuredWidth(text, width, font, font_size) : [text]
  const blockHeight = Math.max(lineHeight, lines.length * lineHeight)

  const middle = (height - blockHeight) / 2 + ascent
  // compute first-baseline depending on vertical alignment
  const yStart = valign === 'top' ? ascent : valign === 'center' ? middle : height - blockHeight + ascent - font_size * 0.2

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xml:space="preserve">
  <style>
    text { font-family: '${font ?? 'Arial'}', sans-serif; font-size: ${font_size ?? 18}px; fill: ${color}; fill-opacity: 1; }
  </style>
  ${renderBorder(draw_border, width, height)}
  <text x="${xPos}" y="${yStart}" text-anchor="${textAnchor}">
    ${lines
      .map((ln, idx) => {
        const dy = idx === 0 ? 0 : lineHeight
        return `<tspan x="${xPos}" dy="${dy}">${escapeXml(ln)}</tspan>`
      })
      .join('')}
  </text>
</svg>`
}

/**
 * Render an optional rectangular border around the text box.
 */
function renderBorder(
  draw: boolean | { color?: string; stroke_width?: number; radius?: number } | undefined,
  width: number,
  height: number,
): string {
  if (!draw) return ''
  const cfg = typeof draw === 'object' ? draw : {}
  const stroke = cfg.color ?? '#000000'
  const strokeWidth = cfg.stroke_width ?? 2
  const radius = cfg.radius ?? 0
  return `<rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" rx="${radius}" ry="${radius}" />`
}

// escapeXml is exported from common, but kept here for local type inference of template building

export const write_text: StepImplementation = {
  name: 'write_text',
  isBaseImageProvider: false,
  async apply(image: Sharp | undefined, stepRaw: Record<string, any>): Promise<Sharp> {
    if (!image) throw new Error('write_text requires an existing image')
    const step = WriteTextSchema.parse(stepRaw)

    const svg = Buffer.from(await svgForTextBox(step))
    // Apply opacity by adjusting alpha in the SVG layer before compositing
    let svgBuffer = svg
    if (step.opacity < 1) {
      svgBuffer = await sharp(svgBuffer)
        .ensureAlpha()
        .linear([1, 1, 1, step.opacity], [0, 0, 0, 0])
        .png()
        .toBuffer()
    }
    return image.ensureAlpha().composite([
      {
        input: svgBuffer,
        left: step.x,
        top: step.y,
      },
    ])
  },
}


