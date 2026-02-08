<script lang="ts" setup>
import { ref } from 'vue'
import type { ImageInfo } from '@/utils/types'
import { convertWebPToPNG, fetchImageAsBlob, getFilenameFromUrl } from '@/utils/convertImage'

const props = defineProps<{
  image: ImageInfo
}>()

const emit = defineEmits<{
  toast: [message: string]
}>()

const loading = ref(false)
const imgError = ref(false)
const copyLoading = ref(false)

async function copyToClipboard() {
  copyLoading.value = true
  try {
    let blob: Blob
    if (props.image.isWebP) {
      blob = await convertWebPToPNG(props.image.url)
    } else {
      blob = await fetchImageAsBlob(props.image.url)
    }
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob }),
    ])
    emit('toast', '已复制到剪贴板')
  } catch {
    emit('toast', '复制失败，可能是跨域限制')
  } finally {
    copyLoading.value = false
  }
}

async function downloadImage() {
  loading.value = true
  try {
    const filename = getFilenameFromUrl(props.image.url, props.image.isWebP)
    await browser.runtime.sendMessage({
      action: 'download-image',
      url: props.image.url,
      filename,
    })
    emit('toast', '已开始下载')
  } catch {
    emit('toast', '下载失败')
  } finally {
    loading.value = false
  }
}

function openInNewTab() {
  window.open(props.image.url, '_blank')
}
</script>

<template>
  <div class="image-card">
    <div class="image-preview">
      <img
        v-if="!imgError"
        :src="image.url"
        :alt="image.url"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="image-error">
        <span>加载失败</span>
      </div>
      <span v-if="image.isWebP" class="badge-webp">WebP</span>
    </div>
    <div class="image-actions">
      <button
        class="btn btn-copy"
        :disabled="copyLoading"
        title="复制到剪贴板"
        @click="copyToClipboard"
      >
        <span v-if="copyLoading">...</span>
        <span v-else>&#x1F4CB;</span>
      </button>
      <button
        class="btn btn-download"
        :disabled="loading"
        title="下载图片"
        @click="downloadImage"
      >
        <span v-if="loading">...</span>
        <span v-else>&#x2B07;</span>
      </button>
      <button
        class="btn btn-open"
        title="新标签页打开"
        @click="openInNewTab"
      >
        &#x1F517;
      </button>
    </div>
    <div class="image-info">
      <span class="image-type">{{ image.type.toUpperCase() }}</span>
      <span v-if="image.width && image.height" class="image-size">
        {{ image.width }}x{{ image.height }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.image-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.2s;
}

.image-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

.image-preview {
  position: relative;
  width: 100%;
  height: 120px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-error {
  color: #999;
  font-size: 12px;
}

.badge-webp {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ff6b35;
  color: #fff;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
}

.image-actions {
  display: flex;
  gap: 4px;
  padding: 6px;
  justify-content: center;
}

.btn {
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  background: #f0f0f0;
}

.btn:hover {
  background: #e0e0e0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-info {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px 6px;
  font-size: 10px;
  color: #888;
}

.image-type {
  font-weight: 600;
  color: #666;
}
</style>
