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
      <!-- 棋盘格背景（透明图片时可见） -->
      <div class="checkerboard"></div>
      <img
        v-if="!imgError"
        :src="image.url"
        :alt="image.url"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="image-error">
        <svg class="error-img-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
        </svg>
        <span>加载失败</span>
      </div>

      <!-- WebP 徽章 -->
      <span v-if="image.isWebP" class="badge-webp">WebP</span>

      <!-- Hover 操作叠加层 -->
      <div class="image-overlay">
        <button
          class="overlay-btn"
          :disabled="copyLoading"
          title="复制到剪贴板"
          @click="copyToClipboard"
        >
          <svg v-if="!copyLoading" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="5" width="9" height="9" rx="1.5"/>
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/>
          </svg>
          <svg v-else class="spin-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 2a6 6 0 0 1 6 6"/>
          </svg>
        </button>
        <button
          class="overlay-btn"
          :disabled="loading"
          title="下载图片"
          @click="downloadImage"
        >
          <svg v-if="!loading" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 2v9"/>
            <path d="M4 7l4 4 4-4"/>
            <path d="M2 13h12"/>
          </svg>
          <svg v-else class="spin-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 2a6 6 0 0 1 6 6"/>
          </svg>
        </button>
        <button
          class="overlay-btn"
          title="新标签页打开"
          @click="openInNewTab"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 2h4v4"/>
            <path d="M14 2L7 9"/>
            <path d="M12 9v4.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5H7"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 图片元信息 -->
    <div class="image-meta">
      <span class="image-type">{{ image.type.toUpperCase() }}</span>
      <span v-if="image.width && image.height" class="image-size">
        {{ image.width }}<span class="dim-x">x</span>{{ image.height }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.image-card {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-card);
  transition: all var(--duration-normal) var(--ease-out);
}

.image-card:hover {
  border-color: var(--border-medium);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 0 0 1px var(--border-subtle);
}

/* — Preview area — */
.image-preview {
  position: relative;
  width: 100%;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.checkerboard {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(45deg, #1a1a1a 25%, transparent 25%),
    linear-gradient(-45deg, #1a1a1a 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #1a1a1a 75%),
    linear-gradient(-45deg, transparent 75%, #1a1a1a 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0px;
  opacity: 0.5;
}

.image-preview img {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  z-index: 1;
  transition: transform var(--duration-normal) var(--ease-out);
}

.image-card:hover .image-preview img {
  transform: scale(1.04);
}

.image-error {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 10px;
}

.error-img-icon {
  width: 20px;
  height: 20px;
}

/* — WebP Badge — */
.badge-webp {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 3;
  background: var(--accent);
  color: var(--text-inverse);
  font-family: var(--font-display);
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 0 2px 8px var(--accent-glow);
}

/* — Overlay actions — */
.image-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.overlay-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: #fff;
  transition: all var(--duration-fast) var(--ease-out);
  transform: translateY(4px);
}

.image-card:hover .overlay-btn {
  transform: translateY(0);
}

.overlay-btn svg {
  width: 15px;
  height: 15px;
}

.overlay-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
  box-shadow: 0 0 12px var(--accent-glow);
}

.overlay-btn:active {
  transform: scale(0.9);
}

.overlay-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.spin-icon {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* — Meta info — */
.image-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px 7px;
  border-top: 1px solid var(--border-subtle);
}

.image-type {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.image-size {
  font-size: 10px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.dim-x {
  opacity: 0.4;
  margin: 0 1px;
  font-size: 9px;
}
</style>
