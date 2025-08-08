import type { Sharp } from 'sharp'
import { draw_image } from './steps/draw_image'
import { write_text } from './steps/write_text'

/** Contract that all imagestep implementations must adhere to */
export interface StepImplementation {
  name: string
  isBaseImageProvider: boolean
  apply: (image: Sharp | undefined, step: Record<string, any>) => Promise<Sharp>
}

const registry: Record<string, StepImplementation> = {
  draw_image,
  write_text,
}

export function resolveStep(action: string): StepImplementation | undefined {
  return registry[action]
}


