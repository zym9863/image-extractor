export interface ImageInfo {
  url: string
  type: string
  width?: number
  height?: number
  isWebP: boolean
}

export interface ExtractImagesMessage {
  action: 'extract-images'
}

export interface DownloadImageMessage {
  action: 'download-image'
  url: string
  filename: string
}

export type Message = ExtractImagesMessage | DownloadImageMessage
