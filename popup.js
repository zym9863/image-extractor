document.addEventListener('DOMContentLoaded', function() {
  const htmlInput = document.getElementById('htmlInput');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const preview = document.getElementById('preview');
  const previewContainer = document.getElementById('preview-container');
  const status = document.getElementById('status');
  const statusText = status.querySelector('span');

  let currentImageData = null;
  let isProcessing = false;

  // 添加入场动画
  function initializeAnimations() {
    const container = document.querySelector('.container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      container.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 100);
  }

  // 按钮加载状态
  function setButtonLoading(button, isLoading) {
    const icon = button.querySelector('i');
    const span = button.querySelector('span');
    
    if (isLoading) {
      button.disabled = true;
      icon.className = 'fas fa-spinner';
      icon.style.animation = 'spin 1s linear infinite';
      span.textContent = '处理中...';
    } else {
      button.disabled = false;
      icon.style.animation = '';
      if (button === copyBtn) {
        icon.className = 'fas fa-copy';
        span.textContent = '复制图片';
      } else {
        icon.className = 'fas fa-download';
        span.textContent = '下载图片';
      }
    }
  }

  // 添加旋转动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .shake {
      animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    .success-pulse {
      animation: successPulse 0.6s ease-out;
    }
    
    @keyframes successPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);

  // 提取图片URL
  function extractImageUrl(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const img = doc.querySelector('img');
    return img ? img.src : null;
  }

  /**
   * 验证URL是否安全有效
   * @param {string} url - 要验证的URL
   * @returns {boolean} 是否为有效的图片URL
   */
  function isValidImageUrl(url) {
    try {
      const urlObj = new URL(url);
      // 只允许HTTP和HTTPS协议
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      // 防止访问内网IP
      const hostname = urlObj.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') || hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // 转换webp为PNG
  async function convertWebpToPng(imageUrl) {
    try {
      // 验证URL安全性
      if (!isValidImageUrl(imageUrl)) {
        throw new Error('无效或不安全的图片URL');
      }
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          // 图片加载成功后立即释放内存
          URL.revokeObjectURL(img.src);
          
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
        
        img.onerror = () => {
          // 图片加载失败时也要释放内存
          URL.revokeObjectURL(img.src);
          reject(new Error('图片加载失败'));
        };
        
        const objectURL = URL.createObjectURL(blob);
        img.src = objectURL;
      });
    } catch (error) {
      throw new Error('图片转换失败: ' + error.message);
    }
  }

  // 自动提取图片
  async function autoExtractImage() {
    if (isProcessing) return;
    
    try {
      const html = htmlInput.value.trim();
      if (!html) {
        hidePreview();
        currentImageData = null;
        updateStatus('info', '准备就绪，粘贴 HTML 代码开始提取图片', 'fas fa-sparkles');
        return;
      }

      isProcessing = true;
      const imageUrl = extractImageUrl(html);
      if (!imageUrl) {
        hidePreview();
        currentImageData = null;
        updateStatus('error', '未找到图片URL，请检查HTML代码', 'fas fa-exclamation-triangle');
        htmlInput.classList.add('shake');
        setTimeout(() => htmlInput.classList.remove('shake'), 500);
        isProcessing = false;
        return;
      }

      updateStatus('info', '正在转换图片，请稍候...', 'fas fa-spinner loading');
      const result = await convertWebpToPng(imageUrl);
      
      currentImageData = result;
      showPreview(result.url);
      updateStatus('success', '✨ 图片提取成功！可以复制或下载了', 'fas fa-check-circle');
      
      // 成功动画
      previewContainer.classList.add('success-pulse');
      setTimeout(() => previewContainer.classList.remove('success-pulse'), 600);
      
    } catch (error) {
      updateStatus('error', '提取失败: ' + error.message, 'fas fa-exclamation-circle');
      htmlInput.classList.add('shake');
      setTimeout(() => htmlInput.classList.remove('shake'), 500);
    } finally {
      isProcessing = false;
    }
  }

  // 显示预览
  function showPreview(imageUrl) {
    preview.src = imageUrl;
    previewContainer.style.display = 'block';
    setTimeout(() => {
      previewContainer.style.opacity = '1';
      previewContainer.style.transform = 'scale(1)';
    }, 10);
  }

  // 隐藏预览
  function hidePreview() {
    previewContainer.style.opacity = '0';
    previewContainer.style.transform = 'scale(0.95)';
    setTimeout(() => {
      previewContainer.style.display = 'none';
    }, 300);
  }

  // 监听输入框变化
  let debounceTimer;
  htmlInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(autoExtractImage, 800);
  });

  // 输入框获得焦点时的效果
  htmlInput.addEventListener('focus', () => {
    htmlInput.parentElement.style.transform = 'translateY(-2px)';
  });

  htmlInput.addEventListener('blur', () => {
    htmlInput.parentElement.style.transform = 'translateY(0)';
  });

  // 复制图片按钮点击事件
  copyBtn.addEventListener('click', async () => {
    if (!currentImageData) {
      updateStatus('error', '请先提取图片', 'fas fa-exclamation-triangle');
      copyBtn.classList.add('shake');
      setTimeout(() => copyBtn.classList.remove('shake'), 500);
      return;
    }

    setButtonLoading(copyBtn, true);
    
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': currentImageData.blob
        })
      ]);
      updateStatus('success', '🎉 图片已复制到剪贴板！', 'fas fa-clipboard-check');
      copyBtn.classList.add('success-pulse');
      setTimeout(() => copyBtn.classList.remove('success-pulse'), 600);
    } catch (error) {
      updateStatus('error', '复制失败: ' + error.message, 'fas fa-exclamation-circle');
      copyBtn.classList.add('shake');
      setTimeout(() => copyBtn.classList.remove('shake'), 500);
    } finally {
      setTimeout(() => setButtonLoading(copyBtn, false), 800);
    }
  });

  // 下载图片按钮点击事件
  downloadBtn.addEventListener('click', () => {
    if (!currentImageData) {
      updateStatus('error', '请先提取图片', 'fas fa-exclamation-triangle');
      downloadBtn.classList.add('shake');
      setTimeout(() => downloadBtn.classList.remove('shake'), 500);
      return;
    }

    setButtonLoading(downloadBtn, true);
    
    setTimeout(() => {
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `即刻绘梦_${timestamp}.png`;
      link.href = currentImageData.url;
      link.click();
      updateStatus('success', '📥 图片下载完成！', 'fas fa-download');
      downloadBtn.classList.add('success-pulse');
      setTimeout(() => downloadBtn.classList.remove('success-pulse'), 600);
      setTimeout(() => setButtonLoading(downloadBtn, false), 800);
    }, 500);
  });

  // 更新状态信息的辅助函数
  function updateStatus(type, message, iconClass) {
    status.className = 'status ' + type;
    statusText.textContent = message;
    
    // 更新图标
    const iconElement = status.querySelector('i');
    iconElement.className = iconClass || (
      type === 'success' ? 'fas fa-check-circle' :
      type === 'error' ? 'fas fa-exclamation-circle' :
      'fas fa-info-circle'
    );
  }

  // 初始化
  initializeAnimations();
  updateStatus('info', '准备就绪，粘贴 HTML 代码开始提取图片', 'fas fa-sparkles');
  
  // 预览容器初始样式
  previewContainer.style.opacity = '0';
  previewContainer.style.transform = 'scale(0.95)';
  previewContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
});