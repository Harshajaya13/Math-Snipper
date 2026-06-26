# 🧘 Zen Math Snipper (Focus Mode)

A blazing fast, ultra-lightweight browser extension designed to isolate and "snipe" GATE questions, study materials, or video players (Anime, YouTube) while removing all surrounding distractions. 

Originally built to preserve complex math formatting (MathJax, KaTeX), it has evolved into a fully-fledged productivity and theater-mode tool featuring custom themes, study timers, and smart state persistence.

## ✨ Features
- **God-Mode Isolation**: Click any block to instantly hide everything else on the page.
- **Math Formatting Preserved**: SVG/MathML rendering is left 100% perfectly intact by hiding siblings rather than copying text.
- **🎨 Custom Material Themes**: Choose between 4 gorgeous hand-crafted UI themes (*OLED Dark, Midnight Blue, Paper Light, Hacker Matrix*). Your choice is saved automatically!
- **⏱️ Focus Timer**: A sleek, glassmorphism Pomodoro-style timer built right into the extension for focused studying.
- **📝 Floating Scratch Pad**: A slide-out notepad that auto-saves your calculations and notes without leaving the page.
- **📋 Smart Copy Mode**: Extracts and cleans the raw LaTeX source code out of MathJax/KaTeX elements and copies it flawlessly to your clipboard (bypassing garbled HTML text).
- **🧠 Smart State Restore**: If you accidentally press F5 to reload the page, Zen Mode will automatically lock back onto your isolated element! 
- **💧 Watermark Annihilator**: Automatically strips background watermarks from your isolated reading blocks.
- **Granular Eraser Tool**: Manually carve out annoying internal ads or buttons by hovering and hitting 'D'.

## ⌨️ Shortcuts & Controls

All shortcuts are available **only while Zen Mode is active**, ensuring they never interfere with regular browsing.

| Action | Shortcut / Input | Description |
|--------|----------|-------------|
| **Start Snipper** | `Alt + M` | Activates hover mode. Move your mouse to highlight blocks to isolate. |
| **Isolate Block** | `Left-Click` | Snipes the highlighted block, transforming it into a premium card and hiding the rest of the site. |
| **Theme Menu** | `M` | Toggles the Theme & Settings Palette open or closed. |
| **Focus Timer** | `T` | Toggles the 25-minute Pomodoro Timer. |
| **Scratch Pad** | `S` | Toggles the auto-saving Floating Scratch Pad. |
| **Copy Mode** | `C` | Toggles **Smart Copy Mode** ON/OFF. While ON, hover over any block and press `C` again to instantly extract its raw text & LaTeX to your clipboard. |
| **Eraser Tool** | `Hover + D` (or `X`) | Hover over any annoying sub-element and press `D` to instantly delete it. |
| **Undo Deletion** | `Ctrl + Z` | Reverts your last Eraser Tool deletion. |
| **Exit Zen Mode** | `Q` (or `Esc`) | Instantly returns the page to normal (or exits Copy Mode if it is currently active). |

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
