import { extractImages } from '@/utils/extractImages'

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'extract-images') {
        const images = extractImages()
        sendResponse(images)
      }
      return true
    })
  },
})
