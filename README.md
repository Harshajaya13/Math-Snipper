# 🧘 Zen Math Snipper (Focus Mode)

A blazing fast, ultra-lightweight browser extension designed to isolate and "snipe" GATE questions, study materials, or video players (Anime, YouTube) while removing all surrounding distractions. 

Originally built to preserve complex math formatting (MathJax, KaTeX), it has evolved into a fully-fledged productivity and theater-mode tool featuring custom themes, study timers, and smart state persistence.

## ✨ Features
- **God-Mode Isolation**: Click any block to instantly hide everything else on the page.
- **Math Formatting Preserved**: Unlike text-copiers, this manipulates the DOM to hide siblings, meaning SVG/MathML math rendering is left 100% perfectly intact.
- **🎨 Custom Material Themes**: Choose between 4 gorgeous hand-crafted UI themes: *OLED Dark, Midnight Blue, Paper Light,* and *Hacker Matrix*. Your choice is saved automatically!
- **⏱️ Focus Timer**: A sleek, glassmorphism Pomodoro-style timer built right into the extension for focused studying.
- **🧠 Smart State Restore**: If you accidentally press F5 to reload the page, Zen Mode will automatically lock back onto your isolated element! (It even dynamically bypasses randomized Video Player IDs to find your content).
- **💧 Watermark Annihilator**: Automatically strips background watermarks (including pseudo-elements) from your isolated reading blocks.
- **Granular Eraser Tool**: Manually carve out annoying internal ads, buttons, or images by hovering and hitting a key.
- **Link Disabler**: All anchor `<a>` tags become unclickable while in Zen Mode, letting you easily highlight text without accidental redirects.

## ⌨️ Shortcuts & Controls

| Action | Shortcut / Input | Description |
|--------|----------|-------------|
| **Start Snipper** | `Alt + M` | Activates hover mode. Move your mouse to highlight blocks. |
| **Isolate Block** | `Left-Click` | Snipes the highlighted block, transforming it into a premium card and hiding the rest of the site. |
| **Eraser Tool** | `Hover + D` (or `X`) | While in Zen Mode, hover over any annoying sub-element and press `D` to instantly delete it. |
| **Undo Deletion** | `Ctrl + Z` | Reverts your last Eraser Tool deletion. |
| **Exit Zen Mode** | `Q` (or `Esc`) | Instantly returns the page to normal. |

## 🚀 Installation Guide

### 1️⃣ Zen Browser & Firefox (Primary)
Our extension uses strict, modern **Manifest V3** security rules. 

1. Type `about:debugging#/runtime/this-firefox` into your URL bar.
2. Click **"Load Temporary Add-on..."**
3. Select the `manifest.json` file from this folder.
4. **CRITICAL STEP FOR LOCAL TESTING:** Because Firefox defaults to denying background permissions for temporary extensions, you must manually grant it permission to allow the **Smart State Restore** (F5 persistence) to work:
   - Open a new tab and go to `about:addons`
   - Click **Extensions** on the left menu.
   - Click on **Zen Math Snipper** in your list.
   - Go to the **Permissions** tab.
   - Toggle **"Access your data for all websites"** to **ON**.

### 2️⃣ Google Chrome / Brave / Edge
1. Navigate to your browser's extension dashboard (e.g. `chrome://extensions/`).
2. Toggle **"Developer mode"** ON.
3. Click the **"Load unpacked"** button.
4. Select the entire `zen-extension` folder.
*(Note: Since Chromium browsers use Service Workers instead of background scripts, you may need to open `manifest.json` and change `"scripts": ["background.js"]` to `"service_worker": "background.js"`).*

---
*Coded for absolute focus.* 🥷
