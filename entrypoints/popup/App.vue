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
    <!-- 噪点纹理叠加层 -->
    <div class="noise-overlay"></div>

    <!-- 顶部工具栏 -->
    <header class="toolbar">
      <div class="toolbar-brand">
        <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
        <h1 class="title">图片提取器</h1>
      </div>
      <button class="btn-icon" title="刷新" @click="fetchImages">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
    </header>

    <!-- 统计和筛选 -->
    <div v-if="!loading && !error && images.length > 0" class="stats-bar">
      <div class="filter-tabs">
        <button
          :class="['tab', filter === 'all' && 'active']"
          @click="filter = 'all'"
        >
          <svg class="tab-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="1" width="6" height="6" rx="1"/>
            <rect x="9" y="1" width="6" height="6" rx="1"/>
            <rect x="1" y="9" width="6" height="6" rx="1"/>
            <rect x="9" y="9" width="6" height="6" rx="1"/>
          </svg>
          全部
          <span class="tab-count">{{ images.length }}</span>
        </button>
        <button
          v-if="webpCount > 0"
          :class="['tab', filter === 'webp' && 'active']"
          @click="filter = 'webp'"
        >
          <svg class="tab-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 4l3 8 3-6 3 6 3-8"/>
          </svg>
          WebP
          <span class="tab-count">{{ webpCount }}</span>
        </button>
      </div>
      <button class="btn-download-all" @click="downloadAll">
        <svg class="btn-icon-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 2v9"/>
          <path d="M4 7l4 4 4-4"/>
          <path d="M2 13h12"/>
        </svg>
        全部下载
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="status">
      <div class="spinner-wrap">
        <div class="spinner"></div>
        <div class="spinner-glow"></div>
      </div>
      <p class="status-text">正在提取图片<span class="dot-anim">...</span></p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="status error-status">
      <div class="error-icon-wrap">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <p class="status-text">{{ error }}</p>
      <button class="retry-btn" @click="fetchImages">
        <svg class="btn-icon-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="14 3 14 7 10 7"/>
          <path d="M13 10a6 6 0 1 1-1.4-6.2L14 7"/>
        </svg>
        重试
      </button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredImages.length === 0" class="status">
      <div class="empty-icon-wrap">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
      </div>
      <p class="status-text">{{ filter === 'webp' ? '未发现 WebP 图片' : '未发现图片' }}</p>
    </div>

    <!-- 图片网格 -->
    <div v-else class="image-grid">
      <ImageCard
        v-for="(image, index) in filteredImages"
        :key="index"
        :image="image"
        :style="{ animationDelay: `${Math.min(index * 40, 400)}ms` }"
        class="card-enter"
        @toast="showToast"
      />
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMessage" class="toast">
        <svg class="toast-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3.5 8.5 6.5 11.5 12.5 4.5"/>
        </svg>
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app {
  width: 420px;
  max-height: 520px;
  overflow-y: auto;
  background: var(--bg-base);
  position: relative;
}

/* — Noise overlay — */
.noise-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
}

/* — Toolbar — */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 10;
}

.toolbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 22px;
  height: 22px;
  color: var(--accent);
  filter: drop-shadow(0 0 8px var(--accent-glow));
}

.title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-icon svg {
  width: 15px;
  height: 15px;
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-medium);
}

.btn-icon:active {
  transform: scale(0.92);
}

/* — Stats bar — */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
}

.filter-tabs {
  display: flex;
  gap: 6px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  border-radius: var(--radius-full);
  padding: 5px 12px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--duration-fast) var(--ease-out);
}

.tab-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.tab-count {
  background: var(--bg-hover);
  padding: 0 6px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 600;
  line-height: 18px;
  transition: all var(--duration-fast) var(--ease-out);
}

.tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-medium);
}

.tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.tab.active .tab-count {
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-inverse);
}

.btn-download-all {
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--accent);
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: var(--radius-sm);
  padding: 5px 14px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-download-all:hover {
  background: var(--accent);
  color: var(--text-inverse);
  box-shadow: 0 0 20px var(--accent-glow);
}

.btn-download-all:active {
  transform: scale(0.96);
}

.btn-icon-sm {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

/* — Status states — */
.status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  gap: 14px;
}

.status-text {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

/* — Spinner — */
.spinner-wrap {
  position: relative;
  width: 36px;
  height: 36px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 2px solid var(--border-subtle);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-glow), transparent 70%);
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

.dot-anim {
  animation: dot-pulse 1.5s steps(4) infinite;
}

@keyframes dot-pulse {
  0% { content: ''; opacity: 0.3; }
  25% { opacity: 0.5; }
  50% { opacity: 0.7; }
  75% { opacity: 1; }
}

/* — Error state — */
.error-status .status-text {
  color: var(--error);
}

.error-icon-wrap {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--error-dim);
  border-radius: 50%;
}

.error-icon {
  width: 22px;
  height: 22px;
  color: var(--error);
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--error);
  background: transparent;
  color: var(--error);
  border-radius: var(--radius-sm);
  padding: 6px 18px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.retry-btn:hover {
  background: var(--error);
  color: #fff;
  box-shadow: 0 0 20px var(--error-dim);
}

.retry-btn:active {
  transform: scale(0.96);
}

/* — Empty state — */
.empty-icon-wrap {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.empty-icon {
  width: 24px;
  height: 24px;
  color: var(--text-muted);
}

/* — Image grid — */
.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 12px;
}

/* — Card entrance animation — */
.card-enter {
  animation: card-fade-in var(--duration-slow) var(--ease-out) both;
}

@keyframes card-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* — Toast — */
.toast {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  color: var(--text-primary);
  padding: 8px 18px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
  z-index: 100;
  white-space: nowrap;
  backdrop-filter: blur(12px);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--border-subtle);
}

.toast-icon {
  width: 14px;
  height: 14px;
  color: var(--success);
  flex-shrink: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--duration-normal) var(--ease-spring);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px) scale(0.95);
}
</style>
