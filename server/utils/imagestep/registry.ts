import type { Sharp } from 'sharp'
import { draw_image } from './steps/draw_image'
import { write_text } from './steps/write_text'
import { blur_region } from './steps/blur_region'
import { draw_square } from './steps/draw_square'
import { draw_line } from './steps/draw_line'

/** Contract that all imagestep implementations must adhere to */
export interface StepImplementation {
  name: string
  isBaseImageProvider: boolean
  apply: (image: Sharp | undefined, step: Record<string, any>) => Promise<Sharp>
}

const registry: Record<string, StepImplementation> = {
  draw_image,
  write_text,
  blur_region,
  draw_square,
  draw_line,
}

export function resolveStep(action: string): StepImplementation | undefined {
  return registry[action]
}


