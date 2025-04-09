// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getImageInfo') {
    // 获取页面上的图片信息
    const images = document.querySelectorAll('img');
    const imageInfo = Array.from(images).map(img => ({
      src: img.src,
      width: img.naturalWidth,
      height: img.naturalHeight
    }));
    sendResponse({ images: imageInfo });
  }
  return true;
});