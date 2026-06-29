<div align="center">
  <h1>🧘 Zen Focus Engine</h1>
  <p><b>An ultra-lightweight, zero-bloat study environment for GATE & STEM students.</b></p>
  
  ![Version](https://img.shields.io/badge/version-2.0-blue.svg)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)
  ![Manifest V3](https://img.shields.io/badge/Manifest-V3-purple.svg)
</div>

<br/>

## 🎯 The Vision

Originally built to preserve complex math formatting (MathJax, KaTeX) while isolating GATE questions on crowded websites, **Zen Focus Engine** has evolved into a fully-fledged productivity tool. It transforms any chaotic webpage into a pristine, beautifully themed study environment in a single click.

No bloat. No tracking. Pure focus.

<br/>

## ✨ Key Features

* 🥷 **God-Mode Isolation:** Click any block to instantly hide everything else on the page. SVG/MathML math rendering is left 100% perfectly intact.
* 📝 **Rich-Text Scratch Pad:** A resizable, auto-saving `contenteditable` notepad. Paste rendered MathJax directly into it!
* 👁️ **Native MathJax Bridge:** Press **P** to secretly hijack the website's native Math engine, turning your raw LaTeX notes into beautifully rendered equations right inside the Scratch Pad.
* 🎨 **Material Glassmorphism Themes:** Choose between 4 gorgeous hand-crafted UI themes (*OLED Dark, Midnight Blue, Paper Light, Hacker Matrix*).
* 🧲 **Magnetic HUD Windows:** The Scratch Pad and Shortcuts modal are fully draggable windows. Just grab their headers and throw them anywhere!
* 🧠 **Smart State Restore:** If you accidentally press F5 to reload the page, Zen Mode will automatically lock back onto your isolated element (bypassing randomized React IDs).
* 💧 **Watermark Annihilator:** Automatically strips background watermarks from isolated reading blocks.
* 📋 **Smart Copy Mode:** Extracts and cleans the raw LaTeX source code out of MathJax elements and copies it flawlessly to your clipboard.

<br/>

## ⌨️ The HUD Controls

All shortcuts are strictly sandboxed. They are **only** available while Zen Mode is active, ensuring they never interfere with your regular browsing.

| Action | Shortcut / Input | Description |
|--------|------------------|-------------|
| **Start Snipper** | `Alt + M` | Activates hover mode. Move your mouse to highlight blocks to isolate. |
| **Isolate Block** | `Left-Click` | Snipes the highlighted block, transforming it into a premium card. |
| **Ultra-Focus Mode** | `Tab` | Instantly hides the entire HUD (Timer, Menus, Modals) so nothing is visible except the question. |
| **Theme Menu** | `M` | Toggles the Theme & Settings Palette open or closed. |
| **Focus Timer** | `T` | Toggles the 25-minute Pomodoro Timer. |
| **Scratch Pad** | `S` | Toggles the auto-saving Floating Scratch Pad. |
| **Math Preview** | `P` | Toggles the Scratch Pad between Edit Mode and MathJax Preview Mode. |
| **Shortcuts HUD**| `K` | Toggles this Keyboard Shortcuts cheat sheet open or closed. |
| **Copy Mode** | `C` | Toggles **Smart Copy Mode** ON/OFF. While ON, hover over any block and press `C` to copy its LaTeX. |
| **Eraser Tool** | `Hover + D` | Hover over any annoying sub-element (ads/buttons) and press `D` to instantly delete it. |
| **Undo Deletion** | `Ctrl + Z` | Reverts your last Eraser Tool deletion. |
| **Exit Zen Mode**| `Q` (or `Esc`) | Returns the page to normal (or exits Copy Mode if it is currently active). |

<br/>

## 🚀 Installation Guide

### 1️⃣ Zen Browser & Firefox (Recommended)
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

*(Note: Since Chromium browsers use Service Workers instead of background scripts, you may need to open `manifest.json` and change `"scripts": ["background.js"]` to `"service_worker": "background.js"` if you experience background script errors).*

### 3️⃣ Iceraven (Android/Mobile)
Because standard Firefox for Android blocks custom extensions, we recommend **Iceraven**, a developer-friendly fork that supports `.xpi` extensions directly:
1. Transfer the `zen_math_snipper-1.0.xpi` file to your Android phone.
2. Open **Iceraven** and type `about:config` in the URL bar.
3. Search for `xpinstall.signatures.required` and toggle it to **`false`**.
4. Now, type `file:///` in the URL bar and navigate to where you saved the `.xpi` file (e.g. `file:///storage/emulated/0/Download/`).
5. Tap the `.xpi` file to instantly install Zen Math Snipper!

### 4️⃣ Apple Safari
Because Safari uses native macOS app packaging for extensions:
1. Open your terminal and run Apple's command-line converter:
   `xcrun safari-web-extension-converter /path/to/zen-extension`
2. Open the newly generated project in Xcode.
3. Build and run the project to register the extension.
4. Go to **Safari Preferences > Extensions** and enable it!

<br/>

---
<div align="center">
  <i>Coded for absolute focus.</i> 🥷
</div>
