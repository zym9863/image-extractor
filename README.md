[中文](README.md) | [English](README-EN.md)

# image-extractor

浏览器扩展，用于从当前网页提取图片，并支持 WebP 转 PNG（复制或下载时自动处理）。

**功能**
- 扫描页面中的 `img`、`picture/source`、CSS `background-image`、`video poster`、以及指向图片的链接
- 识别 WebP 图片并提供筛选
- 单张图片下载、批量下载
- 复制图片到剪贴板（WebP 自动转 PNG）

**目录结构**
- `entrypoints/content.ts`: 内容脚本，提取页面图片
- `entrypoints/background.ts`: 后台脚本，处理下载
- `entrypoints/popup/App.vue`: 弹窗 UI
- `utils/extractImages.ts`: 图片提取与去重逻辑
- `utils/convertImage.ts`: WebP 转 PNG、获取文件名

**使用方式**
1. 打开要提取图片的网页
2. 点击扩展图标，弹窗自动抓取图片
3. 可筛选 WebP、单张下载、批量下载或复制

**开发**
```bash
pnpm install
pnpm dev
```

**Firefox 调试**
```bash
pnpm dev:firefox
```

**构建与打包**
```bash
pnpm build
pnpm zip
```

**Firefox 构建/打包**
```bash
pnpm build:firefox
pnpm zip:firefox
```

**权限**
- `activeTab`: 读取当前标签页内容以提取图片
- `downloads`: 下载图片到本地
