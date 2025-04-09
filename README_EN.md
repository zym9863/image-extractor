# Image Extractor Chrome Extension

A simple and practical Chrome browser extension that quickly extracts images from HTML code and supports format conversion.

## Main Features

- Automatically extracts image URLs from HTML code
- Automatically converts WebP format images to PNG
- Real-time preview of extracted images
- One-click copy images to clipboard
- Supports downloading extracted images
- Friendly status prompts and error handling

## Installation

1. Download the project code
2. Open Chrome browser and go to extensions page (chrome://extensions/)
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" button
5. Select the project folder

## Usage Instructions

1. Click the extension icon in Chrome toolbar to open the interface
2. Paste HTML code containing images into the text box
3. The extension will automatically extract and display images
4. You can choose to:
   - Click "Copy Image" to copy to clipboard
   - Click "Download Image" to save locally

## Technical Features

- Developed with native JavaScript, no additional dependencies
- Supports asynchronous image processing and format conversion
- Elegant error handling and user feedback mechanism
- Responsive interface design, simple and intuitive operation

## Notes

- Ensure HTML code contains valid image tags (`<img>`)
- Image URLs must be accessible
- Cross-domain images require target server to allow cross-domain access