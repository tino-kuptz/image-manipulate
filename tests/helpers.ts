import sharp from 'sharp'

export async function getPixelRGBA(img: sharp.Sharp, x: number, y: number): Promise<{ r: number; g: number; b: number; a: number }> {
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const idx = (y * info.width + x) * info.channels
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] }
}

export async function createCanvas(width: number, height: number, color: { r: number; g: number; b: number; alpha: number }): Promise<sharp.Sharp> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: color,
    },
  })
}

export async function readRaw(img: sharp.Sharp): Promise<{ data: Uint8Array; info: { width: number; height: number; channels: number } }> {
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, info: { width: info.width, height: info.height, channels: info.channels } }
}

export function getPixelFromRaw(raw: { data: Uint8Array; info: { width: number; height: number; channels: number } }, x: number, y: number) {
  const { data, info } = raw
  const idx = (y * info.width + x) * info.channels
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] }
}


