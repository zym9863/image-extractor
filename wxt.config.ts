import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: '图片提取器',
    description: '从网页中提取图片，支持 WebP 转 PNG、一键复制和下载',
    permissions: ['activeTab', 'downloads'],
  },
});
