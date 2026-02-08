[中文](README.md) | [English](README-EN.md)

# image-extractor

Browser extension for extracting images from the current page, with optional WebP-to-PNG conversion (auto-applied when copying or downloading).

**Features**
- Scan the page for `img`, `picture/source`, CSS `background-image`, `video poster`, and direct image links
- Detect WebP images and provide filtering
- Single-image download and batch download
- Copy images to clipboard (WebP auto-converts to PNG)

**Project Structure**
- `entrypoints/content.ts`: Content script that extracts images from the page
- `entrypoints/background.ts`: Background script that handles downloads
- `entrypoints/popup/App.vue`: Popup UI
- `utils/extractImages.ts`: Image extraction and de-duplication logic
- `utils/convertImage.ts`: WebP-to-PNG conversion and filename handling

**Usage**
1. Open a page that contains the images you want
2. Click the extension icon; the popup will automatically collect images
3. Filter WebP images, download single/batch, or copy

**Development**
```bash
pnpm install
pnpm dev
```

**Firefox Debug**
```bash
pnpm dev:firefox
```

**Build & Package**
```bash
pnpm build
pnpm zip
```

**Firefox Build/Package**
```bash
pnpm build:firefox
pnpm zip:firefox
```

**Permissions**
- `activeTab`: read the current tab content to extract images
- `downloads`: download images to local disk
