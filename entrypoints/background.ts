export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'download-image') {
      browser.downloads
        .download({
          url: message.url,
          filename: message.filename,
          saveAs: false,
        })
        .then(() => sendResponse({ success: true }))
        .catch((err: Error) => sendResponse({ success: false, error: err.message }))
      return true
    }
  })
})
