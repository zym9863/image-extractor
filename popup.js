document.addEventListener('DOMContentLoaded', function() {
  const htmlInput = document.getElementById('htmlInput');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const preview = document.getElementById('preview');
  const previewContainer = document.getElementById('preview-container');
  const status = document.getElementById('status');
  const statusText = status.querySelector('span');

  let currentImageData = null;

  // 提取图片URL
  function extractImageUrl(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const img = doc.querySelector('img');
    return img ? img.src : null;
  }

  // 转换webp为PNG
  async function convertWebpToPng(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            resolve({
              url: canvas.toDataURL('image/png'),
              blob: blob
            });
          }, 'image/png');
        };
        
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = URL.createObjectURL(blob);
      });
    } catch (error) {
      throw new Error('图片转换失败: ' + error.message);
    }
  }

  // 自动提取图片
  async function autoExtractImage() {
    try {
      const html = htmlInput.value.trim();
      if (!html) {
        previewContainer.style.display = 'none';
        currentImageData = null;
        updateStatus('info', '请粘贴HTML代码开始提取图片');
        return;
      }

      const imageUrl = extractImageUrl(html);
      if (!imageUrl) {
        previewContainer.style.display = 'none';
        currentImageData = null;
        updateStatus('error', '未找到图片URL');
        return;
      }

      updateStatus('info', '正在转换图片...', true);
      const result = await convertWebpToPng(imageUrl);
      
      currentImageData = result;
      preview.src = result.url;
      previewContainer.style.display = 'block';
      updateStatus('success', '图片提取成功！');
    } catch (error) {
      updateStatus('error', error.message);
    }
  }

  // 监听输入框变化
  let debounceTimer;
  htmlInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(autoExtractImage, 500);
  });

  // 复制图片按钮点击事件
  copyBtn.addEventListener('click', async () => {
    if (!currentImageData) {
      updateStatus('error', '请先提取图片');
      return;
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': currentImageData.blob
        })
      ]);
      updateStatus('success', '图片已复制到剪贴板！');
    } catch (error) {
      updateStatus('error', '复制失败: ' + error.message);
    }
  });

  // 下载图片按钮点击事件
  downloadBtn.addEventListener('click', () => {
    if (!currentImageData) {
      updateStatus('error', '请先提取图片');
      return;
    }

    const link = document.createElement('a');
    link.download = '图片.png';
    link.href = currentImageData.url;
    link.click();
    updateStatus('success', '图片下载中...');
  });

  // 更新状态信息的辅助函数
  function updateStatus(type, message, isLoading = false) {
    status.className = 'status ' + type;
    statusText.textContent = message;
    
    // 更新图标
    const iconElement = status.querySelector('i');
    iconElement.className = isLoading ? 'fas fa-spinner loading' : 
                           type === 'success' ? 'fas fa-check-circle' :
                           type === 'error' ? 'fas fa-exclamation-circle' :
                           'fas fa-info-circle';
  }

  // 初始化状态
  updateStatus('info', '粘贴HTML代码开始提取图片');
});