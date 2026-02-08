import type { ImageInfo } from './types'

function isWebP(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return pathname.endsWith('.webp') || url.includes('format=webp') || url.includes('fmt=webp')
  } catch {
    return url.toLowerCase().includes('.webp')
  }
}

function getImageType(url: string): string {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    if (pathname.endsWith('.webp')) return 'webp'
    if (pathname.endsWith('.png')) return 'png'
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'jpeg'
    if (pathname.endsWith('.gif')) return 'gif'
    if (pathname.endsWith('.svg')) return 'svg'
    if (pathname.endsWith('.bmp')) return 'bmp'
    if (pathname.endsWith('.ico')) return 'ico'
    if (pathname.endsWith('.avif')) return 'avif'
  } catch {
    // ignore
  }
  return 'unknown'
}

function isValidImageUrl(url: string): boolean {
  if (!url || url === 'undefined' || url === 'null') return false
  if (url.startsWith('data:image/')) {
    // 过滤过小的 base64 图片（如 1x1 透明像素等）
    return url.length > 200
  }
  if (url.startsWith('blob:')) return false
  if (url.startsWith('chrome-extension://')) return false
  if (url.startsWith('moz-extension://')) return false
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function parseSrcset(srcset: string, baseUrl: string): string[] {
  const urls: string[] = []
  const parts = srcset.split(',')
  for (const part of parts) {
    const trimmed = part.trim()
    const spaceIndex = trimmed.indexOf(' ')
    const url = spaceIndex > 0 ? trimmed.substring(0, spaceIndex) : trimmed
    if (url) {
      try {
        urls.push(new URL(url, baseUrl).href)
      } catch {
        // ignore invalid URLs
      }
    }
  }
  return urls
}

function extractBackgroundImageUrl(value: string): string | null {
  const match = value.match(/url\(["']?([^"')]+)["']?\)/)
  return match ? match[1] : null
}

export function extractImages(): ImageInfo[] {
  const seen = new Set<string>()
  const images: ImageInfo[] = []
  const baseUrl = document.baseURI

  function addImage(url: string, width?: number, height?: number) {
    if (!isValidImageUrl(url)) return
    // 规范化 URL
    let normalized = url
    if (!url.startsWith('data:')) {
      try {
        normalized = new URL(url, baseUrl).href
      } catch {
        return
      }
    }
    if (seen.has(normalized)) return
    seen.add(normalized)
    images.push({
      url: normalized,
      type: getImageType(normalized),
      width,
      height,
      isWebP: isWebP(normalized),
    })
  }

  // 1. <img> 标签
  const imgElements = document.querySelectorAll('img')
  for (const img of imgElements) {
    if (img.src) {
      addImage(img.src, img.naturalWidth || img.width, img.naturalHeight || img.height)
    }
    if (img.srcset) {
      for (const url of parseSrcset(img.srcset, baseUrl)) {
        addImage(url)
      }
    }
  }

  // 2. <picture> / <source> 标签
  const sourceElements = document.querySelectorAll('picture source')
  for (const source of sourceElements) {
    const srcset = source.getAttribute('srcset')
    if (srcset) {
      for (const url of parseSrcset(srcset, baseUrl)) {
        addImage(url)
      }
    }
    const src = source.getAttribute('src')
    if (src) {
      addImage(src)
    }
  }

  // 3. CSS background-image
  const allElements = document.querySelectorAll('*')
  for (const el of allElements) {
    const style = window.getComputedStyle(el)
    const bgImage = style.backgroundImage
    if (bgImage && bgImage !== 'none') {
      const url = extractBackgroundImageUrl(bgImage)
      if (url) {
        addImage(url)
      }
    }
  }

  // 4. <video> poster
  const videoElements = document.querySelectorAll('video')
  for (const video of videoElements) {
    if (video.poster) {
      addImage(video.poster)
    }
  }

  // 5. <a> 直接链接到图片
  const anchorElements = document.querySelectorAll('a[href]')
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif']
  for (const a of anchorElements) {
    const href = (a as HTMLAnchorElement).href
    if (href) {
      try {
        const pathname = new URL(href).pathname.toLowerCase()
        if (imageExtensions.some((ext) => pathname.endsWith(ext))) {
          addImage(href)
        }
      } catch {
        // ignore
      }
    }
  }

  return images
}
