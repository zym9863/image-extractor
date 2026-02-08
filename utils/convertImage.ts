export async function convertWebPToPNG(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = objectUrl

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result)
          else reject(new Error('Failed to convert to PNG'))
        },
        'image/png',
      )
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function fetchImageAsBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl)
  return response.blob()
}

export function getFilenameFromUrl(url: string, convertWebP = false): string {
  try {
    const pathname = new URL(url).pathname
    let filename = pathname.split('/').pop() || 'image'
    // 移除查询参数残留
    filename = filename.split('?')[0]
    if (convertWebP && filename.endsWith('.webp')) {
      filename = filename.replace('.webp', '.png')
    }
    if (!filename.includes('.')) {
      filename += '.png'
    }
    return filename
  } catch {
    return 'image.png'
  }
}
