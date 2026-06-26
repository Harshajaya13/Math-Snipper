# 🧘 Zen Math Snipper

A blazing fast, ultra-lightweight browser extension designed to isolate and "snipe" GATE questions (or any math blocks) while perfectly preserving complex math formatting (MathJax, KaTeX). It removes distractions by stripping away the rest of the website layout, giving you a premium, dark-mode flashcard reading experience.

## ✨ Features
- **God-Mode Isolation**: Click any block to instantly hide everything else on the page.
- **Math Formatting Preserved**: Unlike text-copiers, this manipulates the DOM to hide siblings, meaning SVG/MathML math rendering is left 100% perfectly intact.
- **Granular Eraser Tool**: Manually carve out annoying internal ads, buttons, or images by hovering and hitting a key.
- **Link Disabler**: All anchor `<a>` tags become unclickable while in Zen Mode, letting you easily highlight text without accidental redirects.
- **Zero Bloat**: Pure vanilla JS. Zero memory footprint. Actually speeds up your browser by un-rendering heavy ads and sidebars.

## ⌨️ Shortcuts & Controls

| Action | Shortcut / Input | Description |
|--------|----------|-------------|
| **Start Snipper** | `Alt + M` | Activates hover mode. Move your mouse to highlight blocks. |
| **Isolate Block** | `Left-Click` | Snipes the highlighted block, transforming it into a premium card and hiding the rest of the site. |
| **Eraser Tool** | `Hover + D` (or `X`) | While in Zen Mode, hover over any annoying sub-element and press `D` to instantly delete it. |
| **Undo Deletion** | `Ctrl + Z` | Reverts your last Eraser Tool deletion. |
| **Exit Zen Mode** | `Q` (or `Esc`) | Instantly returns the page to normal. |

## 🚀 Installation Guide

### 1️⃣ Zen Browser (Primary)
Zen Browser is highly optimized and perfectly supports our strict, privacy-focused extension architecture.
1. Open Zen Browser and type `about:debugging#/runtime/this-firefox` into the URL bar (or navigate to your Add-ons manager and find the Debug section).
2. Click on the **"Load Temporary Add-on..."** button.
3. Navigate to the `zen-extension` folder on your machine and select the `manifest.json` file.
4. You're ready to go!

### 2️⃣ Firefox
1. Type `about:debugging#/runtime/this-firefox` into your URL bar.
2. Click **"Load Temporary Add-on..."**
3. Select the `manifest.json` file from this folder.

### 3️⃣ Google Chrome
1. Navigate to `chrome://extensions/`.
2. Toggle **"Developer mode"** ON in the top right corner.
3. Click the **"Load unpacked"** button.
4. Select the entire `zen-extension` folder.
*(Note: Since Chrome uses Service Workers, you will need to open `manifest.json` and change `"scripts": ["background.js"]` to `"service_worker": "background.js"`)*.

### 4️⃣ Brave
1. Navigate to `brave://extensions/`.
2. Toggle **"Developer mode"** ON.
3. Click **"Load unpacked"** and select the `zen-extension` folder.
*(Note: Requires the same `service_worker` modification in `manifest.json` as Chrome).*

### 5️⃣ Microsoft Edge
1. Navigate to `edge://extensions/`.
2. Toggle **"Developer mode"** ON (bottom-left sidebar toggle).
3. Click **"Load unpacked"** and select the `zen-extension` folder.
*(Note: Requires the same `service_worker` modification in `manifest.json` as Chrome).*

### 6️⃣ Apple Safari
Because Safari uses native macOS app packaging for extensions:
1. In your terminal, convert it using Apple's command-line tool:
   `xcrun safari-web-extension-converter /path/to/zen-extension`
2. Open the newly generated project in Xcode.
3. Build and run the project to register the extension.
4. Go to **Safari Preferences > Extensions** and enable it.

---
*Vibe coded for absolute focus.* 🥷
