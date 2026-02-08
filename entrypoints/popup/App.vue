<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import type { ImageInfo } from '@/utils/types'
import ImageCard from '@/components/ImageCard.vue'

const images = ref<ImageInfo[]>([])
const loading = ref(true)
const error = ref('')
const filter = ref<'all' | 'webp'>('all')
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

const filteredImages = computed(() => {
  if (filter.value === 'webp') {
    return images.value.filter((img) => img.isWebP)
  }
  return images.value
})

const webpCount = computed(() => images.value.filter((img) => img.isWebP).length)

async function fetchImages() {
  loading.value = true
  error.value = ''
  images.value = []

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      error.value = '无法访问当前标签页'
      return
    }
    const result = await browser.tabs.sendMessage(tab.id, { action: 'extract-images' })
    if (Array.isArray(result)) {
      images.value = result
    } else {
      error.value = '提取失败，请刷新页面后重试'
    }
  } catch {
    error.value = '无法连接到页面，请刷新页面后重试'
  } finally {
    loading.value = false
  }
}

function showToast(message: string) {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}

async function downloadAll() {
  for (const image of filteredImages.value) {
    try {
      const filename = image.url.split('/').pop()?.split('?')[0] || 'image.png'
      await browser.runtime.sendMessage({
        action: 'download-image',
        url: image.url,
        filename,
      })
    } catch {
      // continue
    }
  }
  showToast(`已开始下载 ${filteredImages.value.length} 张图片`)
}

onMounted(fetchImages)
</script>

<template>
  <div class="app">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <h1 class="title">图片提取器</h1>
      <div class="toolbar-actions">
        <button class="toolbar-btn" title="刷新" @click="fetchImages">
          &#x1F504;
        </button>
      </div>
    </div>

    <!-- 统计和筛选 -->
    <div v-if="!loading && !error && images.length > 0" class="stats-bar">
      <div class="filter-tabs">
        <button
          :class="['tab', filter === 'all' && 'active']"
          @click="filter = 'all'"
        >
          全部 ({{ images.length }})
        </button>
        <button
          v-if="webpCount > 0"
          :class="['tab', filter === 'webp' && 'active']"
          @click="filter = 'webp'"
        >
          WebP ({{ webpCount }})
        </button>
      </div>
      <button class="btn-download-all" @click="downloadAll">
        全部下载
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="status">
      <div class="spinner"></div>
      <p>正在提取图片...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="status error-status">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchImages">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredImages.length === 0" class="status">
      <p>{{ filter === 'webp' ? '未发现 WebP 图片' : '未发现图片' }}</p>
    </div>

    <!-- 图片网格 -->
    <div v-else class="image-grid">
      <ImageCard
        v-for="(image, index) in filteredImages"
        :key="index"
        :image="image"
        @toast="showToast"
      />
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMessage" class="toast">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app {
  width: 400px;
  max-height: 500px;
  overflow-y: auto;
  background: #fafafa;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}

.title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: #333;
}

.toolbar-actions {
  display: flex;
  gap: 6px;
}

.toolbar-btn {
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.toolbar-btn:hover {
  background: #e0e0e0;
}

.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.filter-tabs {
  display: flex;
  gap: 4px;
}

.tab {
  border: none;
  background: #f0f0f0;
  border-radius: 12px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.tab.active {
  background: #333;
  color: #fff;
}

.btn-download-all {
  border: none;
  background: #4a90d9;
  color: #fff;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-download-all:hover {
  background: #357abd;
}

.status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  font-size: 13px;
}

.error-status {
  color: #e74c3c;
}

.retry-btn {
  margin-top: 10px;
  border: 1px solid #e74c3c;
  background: transparent;
  color: #e74c3c;
  border-radius: 6px;
  padding: 4px 16px;
  font-size: 12px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #e74c3c;
  color: #fff;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #eee;
  border-top-color: #4a90d9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 8px;
}

.toast {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  z-index: 100;
  white-space: nowrap;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
