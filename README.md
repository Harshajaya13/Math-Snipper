<div align="center">
  <h1>🧘 Zen Math Snipper v3.0</h1>
  <p><b>An ultra-lightweight, zero-bloat GATE & STEM exam productivity suite for Firefox / Zen Browser & Chromium.</b></p>
  
  ![Version](https://img.shields.io/badge/version-3.0-blue.svg)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)
  ![Manifest V3](https://img.shields.io/badge/Manifest-V3-purple.svg)
</div>

<br/>

## 🎯 The Vision

Originally built to preserve complex math formatting (MathJax, KaTeX) while isolating GATE questions on crowded websites, **Zen Math Snipper v3.0** has evolved into an all-in-one GATE & STEM exam studio. Whether you are snipping questions from online test series or solving past GATE PDF papers, v3.0 transforms your screen into a distraction-free, beautifully themed study environment.

No bloat. No tracking. Pure focus.

<br/>

## ✨ What's New in v3.0 (Gold Master)

* 📄 **Dedicated Zen GATE PDF Studio (`Alt + P`):** Press `Alt + P` anywhere to launch a standalone PDF exam workspace. Open any local PDF or exam booklet with full cropping, watermark removal, and OLED theme inversion!
* 👁️ **Live Math & Notes Preview (`👁️ Preview`):** One-click toggle that renders your rough notes into formatted HTML/LaTeX math cards. Automatically highlights question titles (`Q. 14`), option badges (`(A)`, `(B)`), superscripts (`x^2`), subscripts (`x_2`), and fractions (`A/B`).
* 🔣 **Clean Intuitive Math Symbols Toolbar:** Quick-insert helper buttons (`A/B Fraction`, `√ Root`, `≤`, `≥`, `α`, `β`, `∫`, `θ`, `π`, `±`, `∞`) right above your scratchpad.
* 💾 **Save & Reload (`💾 Save` + `📂 Open .txt`):** Save your GATE rough sheets as `.txt` files and reload them anytime across sessions in both PDF Studio and HTML Zen Snipper!
* 🧲 **Floating Side-by-Side Draggable Scratchpad:** Opens as a clean side panel on the right (`z-index: 25000`) so your question focus card remains 100% unobstructed on the left while you calculate!
* 💧 **Luminance Watermark Annihilator:** Reversible watermark remover that eliminates background logos and grey text while keeping black math equations crisp.
* 📋 **LaTeX & Text Copy (`🔣 Copy LaTeX`):** Extracts multi-line row-grouped question text and converts symbols to clean LaTeX syntax (`\le`, `\ge`, `\alpha`, `\beta`, `\int`).

<br/>

## ⌨️ Shortcuts & Controls

### 🌐 1. HTML Webpage Snipper (`Alt + M` on any Website)
All shortcuts are active while isolating questions on normal web pages:

| Action | Shortcut / Input | Description |
|--------|------------------|-------------|
| **Activate Snipper** | `Alt + M` | Activates hover isolation mode. Move mouse over any element to snipe. |
| **Isolate Question** | `Left-Click` | Transforms the highlighted block into an isolated Zen Focus Card. |
| **Ultra-Focus Mode** | `Tab` | Hides the HUD so nothing is visible except the isolated question. |
| **Theme Palette** | `M` | Toggles between OLED Dark, Midnight Blue, Paper Light, and Hacker Matrix. |
| **Focus Timer** | `T` | Toggles the 25-minute Pomodoro Timer. |
| **Scratchpad Notepad** | `S` | Opens the auto-saving Floating Scratchpad (`💾 Save` & `📂 Open .txt`). |
| **Math Preview** | `P` | Toggles the Scratchpad between Edit Mode and live MathJax Preview. |
| **Smart Copy Mode** | `C` | Toggles Copy Mode ON/OFF to extract raw LaTeX from MathJax blocks. |
| **Eraser Tool** | `Hover + D` | Hover over any sub-element (ads/buttons) and press `D` to delete it. |
| **Exit Zen Mode** | `Q` or `Esc` | Returns the webpage to normal view. |

<br/>

### 📄 2. Zen GATE PDF Studio (`Alt + P` Studio Tab)
Press **`Alt + P`** anywhere in your browser to launch the dedicated PDF Exam Workspace:

| Action | Shortcut / Input | Description |
|--------|------------------|-------------|
| **Launch PDF Studio** | `Alt + P` | Opens **Zen GATE PDF Studio (`zen-pdf.html`)** in a new tab. |
| **Crop Question** | `Click + Drag` | Draw a bounding box around any PDF exam question to crop into a Focus Card. |
| **Toggle Scratchpad** | `S` | Opens the floating side-by-side GATE Scratchpad & LaTeX symbol toolbar. |
| **Remove Watermark** | `W` | Eliminates background watermarks and grey text while keeping math equations crisp. |
| **Invert OLED Theme** | `I` | Converts white exam papers into OLED Dark or Midnight Blue cards. |
| **Copy Image** | `C` | Copies the cropped question PNG directly to your clipboard. |
| **Copy Text** | `T` | Copies multi-line row-grouped question text. |
| **Copy LaTeX Math** | `L` | Copies question text transformed into LaTeX math syntax (`\le`, `\ge`, `\int`). |
| **Shortcuts Guide** | `?` or `Shift + /` | Opens the Studio shortcuts cheat sheet HUD. |
| **Close Focus Card** | `Q` or `Esc` | Closes the active focus card or open modal. |

<br/>

## 🚀 Installation Guide

### 1️⃣ Zen Browser & Firefox (Recommended)
Our extension is packaged as a ready-to-install `.xpi` file compatible with Firefox & Zen Browser:
1. Open Zen Browser or Firefox and drag-and-drop `zen_math_snipper-v3.0.xpi` into any tab, OR
2. Type `about:addons` in your address bar, click the **gear icon ⚙️**, and choose **Install Add-on From File...**
3. Select `zen_math_snipper-v3.0.xpi`.

### 2️⃣ Developer Mode / Unpacked Loading
1. Type `about:debugging#/runtime/this-firefox` into your URL bar.
2. Click **"Load Temporary Add-on..."**
3. Select the `manifest.json` file from this directory.

<br/>

---
<div align="center">
  <i>Coded for absolute focus & peak GATE preparation.</i> 🥷👑
</div>
