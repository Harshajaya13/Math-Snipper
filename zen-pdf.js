// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let scale = 1.5;
let pageRendering = false;
let pageNumPending = null;
let isInverted = false;

const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
const dropZone = document.getElementById('drop-zone');
const canvasContainer = document.getElementById('canvas-container');
const navControls = document.getElementById('nav-controls');
const zoomControls = document.getElementById('zoom-controls');
const pageNumInput = document.getElementById('page-num-input');
const pageCountEl = document.getElementById('page-count');
const zoomLevelEl = document.getElementById('zoom-level');
const toastEl = document.getElementById('toast');

function showToast(msg, duration = 3000) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), duration);
}

// Render PDF Page
function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then(function(page) {
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    const renderTask = page.render(renderContext);

    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });

  pageNumInput.value = num;
}

function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

function onPrevPage() {
  if (pageNum <= 1) return;
  pageNum--;
  queueRenderPage(pageNum);
}

function onNextPage() {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  queueRenderPage(pageNum);
}

// Load PDF Document
function loadPdfData(typedArray) {
  pdfjsLib.getDocument({ data: typedArray }).promise.then(function(pdfDoc_) {
    pdfDoc = pdfDoc_;
    pageCountEl.textContent = pdfDoc.numPages;
    pageNumInput.max = pdfDoc.numPages;
    dropZone.style.display = 'none';
    canvasContainer.style.display = 'block';
    navControls.style.display = 'flex';
    zoomControls.style.display = 'flex';
    pageNum = 1;
    renderPage(pageNum);
    showToast("PDF Loaded! Drag across any question to crop & isolate it.", 4000);
  }).catch(function(err) {
    showToast("Error loading PDF: " + err.message, 4000);
  });
}

// File Input
document.getElementById('pdf-file-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function() {
      loadPdfData(new Uint8Array(this.result));
    };
    reader.readAsArrayBuffer(file);
  }
});

// Drag & Drop
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') {
    const reader = new FileReader();
    reader.onload = function() {
      loadPdfData(new Uint8Array(this.result));
    };
    reader.readAsArrayBuffer(file);
  }
});

// Navigation controls
document.getElementById('prev-page').addEventListener('click', onPrevPage);
document.getElementById('next-page').addEventListener('click', onNextPage);
pageNumInput.addEventListener('change', function() {
  let val = parseInt(this.value, 10);
  if (val >= 1 && val <= pdfDoc.numPages) {
    pageNum = val;
    queueRenderPage(pageNum);
  } else {
    this.value = pageNum;
  }
});

// Zoom Controls
const zoomInput = document.getElementById('zoom-input');

function updateZoomDisplay() {
  if (zoomInput) zoomInput.value = Math.round(scale * 100);
}

document.getElementById('zoom-in').addEventListener('click', () => {
  scale += 0.25;
  updateZoomDisplay();
  queueRenderPage(pageNum);
});
document.getElementById('zoom-out').addEventListener('click', () => {
  if (scale > 0.3) {
    scale -= 0.25;
    updateZoomDisplay();
    queueRenderPage(pageNum);
  }
});
document.getElementById('zoom-fit').addEventListener('click', () => {
  scale = (window.innerWidth - 80) / canvas.width * scale;
  updateZoomDisplay();
  queueRenderPage(pageNum);
});
if (zoomInput) {
  zoomInput.addEventListener('change', function() {
    let val = parseInt(this.value, 10);
    if (val >= 30 && val <= 500) {
      scale = val / 100;
      queueRenderPage(pageNum);
    } else {
      this.value = Math.round(scale * 100);
    }
  });
}

// OLED Invert Toggle
document.getElementById('toggle-invert-btn').addEventListener('click', function() {
  isInverted = !isInverted;
  canvas.classList.toggle('invert-active', isInverted);
  this.style.borderColor = isInverted ? '#a78bfa' : '';
  showToast(isInverted ? "OLED Dark Mode Enabled" : "Normal PDF Colors Restored");
});

// --- DRAG & CROP REGION SNIPPER ---
let cropStartX = 0;
let cropStartY = 0;
let isDraggingCrop = false;
let lastCropRect = null;
let currentCropCanvas = null;

const cropMarquee = document.getElementById('crop-marquee');
const cropBadge = document.getElementById('crop-badge');
const cropModal = document.getElementById('crop-modal');
const croppedImg = document.getElementById('cropped-img');

canvasContainer.addEventListener('mousedown', function(e) {
  if (e.button !== 0) return;
  const rect = canvasContainer.getBoundingClientRect();
  cropStartX = e.clientX - rect.left;
  cropStartY = e.clientY - rect.top;
  isDraggingCrop = true;
  cropMarquee.style.display = 'block';
  cropMarquee.style.left = cropStartX + 'px';
  cropMarquee.style.top = cropStartY + 'px';
  cropMarquee.style.width = '0px';
  cropMarquee.style.height = '0px';
});

canvasContainer.addEventListener('mousemove', function(e) {
  if (!isDraggingCrop) return;
  const rect = canvasContainer.getBoundingClientRect();
  const curX = e.clientX - rect.left;
  const curY = e.clientY - rect.top;

  const left = Math.min(cropStartX, curX);
  const top = Math.min(cropStartY, curY);
  const width = Math.abs(curX - cropStartX);
  const height = Math.abs(curY - cropStartY);

  cropMarquee.style.left = left + 'px';
  cropMarquee.style.top = top + 'px';
  cropMarquee.style.width = width + 'px';
  cropMarquee.style.height = height + 'px';
  cropBadge.textContent = `${Math.round(width)} × ${Math.round(height)} px`;
});

canvasContainer.addEventListener('mouseup', function(e) {
  if (!isDraggingCrop) return;
  isDraggingCrop = false;
  cropMarquee.style.display = 'none';

  const rect = canvasContainer.getBoundingClientRect();
  const curX = e.clientX - rect.left;
  const curY = e.clientY - rect.top;

  const left = Math.min(cropStartX, curX);
  const top = Math.min(cropStartY, curY);
  const width = Math.abs(curX - cropStartX);
  const height = Math.abs(curY - cropStartY);

  if (width < 20 || height < 20) return; // Ignore accidental tiny clicks

  isolateCrop(left, top, width, height);
});

// Mobile Touchscreen Support for Android / Tablets
canvasContainer.addEventListener('touchstart', function(e) {
  if (e.touches.length !== 1) return;
  const touch = e.touches[0];
  const rect = canvasContainer.getBoundingClientRect();
  cropStartX = touch.clientX - rect.left;
  cropStartY = touch.clientY - rect.top;
  isDraggingCrop = true;
  cropMarquee.style.display = 'block';
  cropMarquee.style.left = cropStartX + 'px';
  cropMarquee.style.top = cropStartY + 'px';
  cropMarquee.style.width = '0px';
  cropMarquee.style.height = '0px';
}, { passive: true });

canvasContainer.addEventListener('touchmove', function(e) {
  if (!isDraggingCrop || e.touches.length !== 1) return;
  const touch = e.touches[0];
  const rect = canvasContainer.getBoundingClientRect();
  const curX = touch.clientX - rect.left;
  const curY = touch.clientY - rect.top;

  const left = Math.min(cropStartX, curX);
  const top = Math.min(cropStartY, curY);
  const width = Math.abs(curX - cropStartX);
  const height = Math.abs(curY - cropStartY);

  cropMarquee.style.left = left + 'px';
  cropMarquee.style.top = top + 'px';
  cropMarquee.style.width = width + 'px';
  cropMarquee.style.height = height + 'px';
  cropBadge.textContent = `${Math.round(width)} × ${Math.round(height)} px`;
}, { passive: true });

canvasContainer.addEventListener('touchend', function(e) {
  if (!isDraggingCrop) return;
  isDraggingCrop = false;
  cropMarquee.style.display = 'none';

  const touch = e.changedTouches[0];
  const rect = canvasContainer.getBoundingClientRect();
  const curX = touch.clientX - rect.left;
  const curY = touch.clientY - rect.top;

  const left = Math.min(cropStartX, curX);
  const top = Math.min(cropStartY, curY);
  const width = Math.abs(curX - cropStartX);
  const height = Math.abs(curY - cropStartY);

  if (width < 20 || height < 20) return;
  isolateCrop(left, top, width, height);
});

function isolateCrop(x, y, w, h) {
  lastCropRect = { x, y, w, h };
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tCtx = tempCanvas.getContext('2d');

  tCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
  currentCropCanvas = tempCanvas;

  croppedImg.src = tempCanvas.toDataURL('image/png');
  croppedImg.classList.toggle('invert-active', isInverted);
  isWatermarkCleaned = false;
  const cleanBtn = document.getElementById('modal-clean-btn');
  if (cleanBtn) cleanBtn.textContent = '💧 Remove Watermark';
  cropModal.style.display = 'flex';
  showToast("Isolated GATE Question! Focus mode active. Press 'Esc' or 'Q' to close.");
}

// Modal actions
document.getElementById('modal-close-btn').addEventListener('click', () => {
  cropModal.style.display = 'none';
});

document.getElementById('modal-invert-btn').addEventListener('click', () => {
  croppedImg.classList.toggle('invert-active');
});

// Reversible & Safer Watermark Annihilator
let isWatermarkCleaned = false;
document.getElementById('modal-clean-btn').addEventListener('click', function() {
  if (!currentCropCanvas) return;
  if (isWatermarkCleaned) {
    // Restore original uncleaned image
    croppedImg.src = currentCropCanvas.toDataURL('image/png');
    this.textContent = '💧 Remove Watermark';
    isWatermarkCleaned = false;
    showToast("Restored original question image.");
    return;
  }

  const w = currentCropCanvas.width;
  const h = currentCropCanvas.height;
  const cleanCanvas = document.createElement('canvas');
  cleanCanvas.width = w;
  cleanCanvas.height = h;
  const ctx = cleanCanvas.getContext('2d');
  ctx.drawImage(currentCropCanvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    // Target only light background watermark gray tones (e.g. GATE watermark > 175)
    // Preserves all dark text, fractions, symbols (< 175)
    if (maxVal > 175 && minVal > 165 && (maxVal - minVal) < 35) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  croppedImg.src = cleanCanvas.toDataURL('image/png');
  this.textContent = '↩️ Restore Original';
  isWatermarkCleaned = true;
  showToast("Annihilated GATE watermark! (Click button again or press 'W' to restore)");
});

// Line-Break Preserving Text Copying
document.getElementById('modal-copy-text-btn').addEventListener('click', function() {
  if (!pdfDoc || !lastCropRect) return;
  pdfDoc.getPage(pageNum).then(page => {
    const viewport = page.getViewport({ scale: scale });
    return page.getTextContent().then(textContent => {
      const items = [];
      textContent.items.forEach(item => {
        const pt = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
        if (pt[0] >= lastCropRect.x - 15 && pt[0] <= lastCropRect.x + lastCropRect.w + 15 &&
            pt[1] >= lastCropRect.y - 25 && pt[1] <= lastCropRect.y + lastCropRect.h + 25) {
          items.push({ str: item.str, x: pt[0], y: pt[1] });
        }
      });

      // Sort top to bottom
      items.sort((a, b) => a.y - b.y);

      // Group items into rows by vertical proximity (< 6px difference)
      const rows = [];
      items.forEach(item => {
        let added = false;
        for (let row of rows) {
          if (Math.abs(row[0].y - item.y) < 6) {
            row.push(item);
            added = true;
            break;
          }
        }
        if (!added) rows.push([item]);
      });

      // Sort each row left to right and join with space, then join rows with newlines
      const formattedLines = rows.map(row => {
        row.sort((a, b) => a.x - b.x);
        return row.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
      });

      let text = formattedLines.filter(l => l.length > 0).join('\n');
      text = text.replace(/[^\x20-\x7E\n\r\t\u00A0-\u024F\u0370-\u03FF\u2200-\u22FF]/g, '');
      if (!text) {
        showToast("No selectable text found in crop region.");
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => showToast("Copied formatted multi-line question text!"))
          .catch(() => showToast("Failed to copy text."));
      } else {
        showToast("Copied text!");
      }
    });
  });
});

document.getElementById('modal-copy-btn').addEventListener('click', () => {
  fetch(croppedImg.src)
    .then(res => res.blob())
    .then(blob => {
      if (navigator.clipboard && navigator.clipboard.write) {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          .then(() => showToast("Copied question image to clipboard!"))
          .catch(() => showToast("Could not copy image."));
      } else {
        showToast("Copied!");
      }
    });
});

document.getElementById('modal-width-select').addEventListener('change', function() {
  const cardEl = document.getElementById('modal-card');
  if (cardEl) {
    cardEl.style.width = this.value;
    cardEl.style.maxWidth = this.value;
  }
});

// --- SCRATCHPAD & SHORTCUTS MODALS ---
const scratchpadModal = document.getElementById('scratchpad-modal');
const shortcutsModal = document.getElementById('shortcuts-modal');
const scratchTextarea = document.getElementById('scratchpad-textarea');
const scratchPreviewBox = document.getElementById('scratchpad-preview');

function toggleScratchpad() {
  const isVisible = scratchpadModal.style.display === 'flex';
  scratchpadModal.style.display = isVisible ? 'none' : 'flex';
  if (!isVisible && scratchTextarea) scratchTextarea.focus();
}

document.getElementById('toggle-scratchpad-btn').addEventListener('click', toggleScratchpad);
document.getElementById('modal-scratch-btn').addEventListener('click', toggleScratchpad);
document.getElementById('scratch-close-btn').addEventListener('click', () => {
  scratchpadModal.style.display = 'none';
});

// Live Math Preview Toggle
document.getElementById('scratch-preview-btn').addEventListener('click', function() {
  if (!scratchTextarea || !scratchPreviewBox) return;
  const isPreviewing = scratchPreviewBox.style.display === 'block';

  if (!isPreviewing) {
    let raw = scratchTextarea.value || '';
    if (!raw.trim()) {
      scratchPreviewBox.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:40px;"><i>No notes to preview yet. Type notes or copy question text!</i></div>';
    } else {
      // Escape HTML entities
      let lines = raw.split('\n');
      let htmlLines = lines.map(line => {
        let l = line.trim();
        if (!l) return '<div style="height:8px;"></div>';

        // Highlight Q. titles
        if (/^Q\.\s*\d+/i.test(l) || /^Question\s*\d+/i.test(l)) {
          return `<div class="preview-q-header">${l}</div>`;
        }
        // Highlight options (A) (B) (C) (D)
        if (/^\([A-D]\)/.test(l)) {
          return `<div class="preview-option">${l}</div>`;
        }

        // Convert LaTeX fractions \frac{a}{b}
        l = l.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="math-frac"><span class="math-frac-top">$1</span><span class="math-frac-bot">$2</span></span>');
        // Convert powers x^2 or e^{-x}
        l = l.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
        l = l.replace(/\^([0-9a-zA-Z]+)/g, '<sup>$1</sup>');
        // Convert subscripts x_2 or F_X
        l = l.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
        l = l.replace(/_([0-9a-zA-Z]+)/g, '<sub>$1</sub>');

        // Convert common symbols
        l = l
          .replace(/\\le/g, '≤')
          .replace(/\\ge/g, '≥')
          .replace(/\\alpha/g, 'α')
          .replace(/\\beta/g, 'β')
          .replace(/\\int/g, '∫')
          .replace(/\\times/g, '×');

        return `<div class="preview-line">${l}</div>`;
      });

      scratchPreviewBox.innerHTML = htmlLines.join('');
    }

    scratchTextarea.style.display = 'none';
    scratchPreviewBox.style.display = 'block';
    this.textContent = '✏️ Edit Notes';
    showToast("Live Math Preview mode active!");
  } else {
    scratchPreviewBox.style.display = 'none';
    scratchTextarea.style.display = 'block';
    scratchTextarea.focus();
    this.textContent = '👁️ Preview';
    showToast("Edit mode active.");
  }
});

document.getElementById('scratch-clear-btn').addEventListener('click', () => {
  if (scratchTextarea) {
    scratchTextarea.value = '';
    if (scratchPreviewBox) scratchPreviewBox.innerHTML = '';
    showToast("Scratchpad cleared!");
  }
});

document.getElementById('scratch-copy-btn').addEventListener('click', () => {
  if (scratchTextarea && navigator.clipboard) {
    navigator.clipboard.writeText(scratchTextarea.value)
      .then(() => showToast("Copied scratchpad notes to clipboard!"))
      .catch(() => showToast("Failed to copy notes."));
  }
});

document.getElementById('scratch-download-btn').addEventListener('click', () => {
  if (!scratchTextarea) return;
  const blob = new Blob([scratchTextarea.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GATE_Rough_Notes.txt';
  a.click();
  URL.revokeObjectURL(url);
  showToast("Downloaded GATE rough notes!");
});

const uploadInput = document.getElementById('scratch-upload-input');
document.getElementById('scratch-upload-btn').addEventListener('click', () => {
  if (uploadInput) uploadInput.click();
});

if (uploadInput) {
  uploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      if (scratchTextarea) {
        scratchTextarea.value = evt.target.result;
        showToast("Loaded saved GATE rough notes!");
      }
    };
    reader.readAsText(file);
  });
}

// Copy LaTeX Math formatted question text
document.getElementById('modal-copy-latex-btn').addEventListener('click', function() {
  if (!pdfDoc || !lastCropRect) return;
  pdfDoc.getPage(pageNum).then(page => {
    const viewport = page.getViewport({ scale: scale });
    return page.getTextContent().then(textContent => {
      const items = [];
      textContent.items.forEach(item => {
        const pt = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
        if (pt[0] >= lastCropRect.x - 15 && pt[0] <= lastCropRect.x + lastCropRect.w + 15 &&
            pt[1] >= lastCropRect.y - 25 && pt[1] <= lastCropRect.y + lastCropRect.h + 25) {
          items.push({ str: item.str, x: pt[0], y: pt[1] });
        }
      });

      items.sort((a, b) => a.y - b.y);
      const rows = [];
      items.forEach(item => {
        let added = false;
        for (let row of rows) {
          if (Math.abs(row[0].y - item.y) < 6) {
            row.push(item);
            added = true;
            break;
          }
        }
        if (!added) rows.push([item]);
      });

      const formattedLines = rows.map(row => {
        row.sort((a, b) => a.x - b.x);
        return row.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
      });

      let text = formattedLines.filter(l => l.length > 0).join('\n');
      text = text.replace(/[^\x20-\x7E\n\r\t\u00A0-\u024F\u0370-\u03FF\u2200-\u22FF]/g, '');
      if (!text) {
        showToast("No selectable text found.");
        return;
      }

      // Convert common math notations to LaTeX formatting
      text = text
        .replace(/≤/g, '\\le ')
        .replace(/≥/g, '\\ge ')
        .replace(/α/g, '\\alpha ')
        .replace(/β/g, '\\beta ')
        .replace(/∫/g, '\\int ')
        .replace(/×/g, '\\times ');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => showToast("Copied formatted LaTeX math equation text!"))
          .catch(() => showToast("Failed to copy LaTeX."));
      } else {
        showToast("Copied LaTeX!");
      }
    });
  });
});

// Shortcuts Modal
document.getElementById('open-shortcuts-btn').addEventListener('click', () => {
  shortcutsModal.style.display = 'flex';
});
document.getElementById('shortcuts-close-btn').addEventListener('click', () => {
  shortcutsModal.style.display = 'none';
});

// LaTeX quick insert buttons
document.querySelectorAll('.latex-insert-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    if (!scratchTextarea) return;
    const insert = this.getAttribute('data-latex') || '';
    const start = scratchTextarea.selectionStart || scratchTextarea.value.length;
    const end = scratchTextarea.selectionEnd || scratchTextarea.value.length;
    scratchTextarea.value = scratchTextarea.value.substring(0, start) + insert + scratchTextarea.value.substring(end);
    scratchTextarea.focus();
  });
});

// Draggable Scratchpad Panel
let isDraggingScratchpad = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
const scratchHeader = document.getElementById('scratchpad-header-handle');

if (scratchHeader) {
  scratchHeader.style.cursor = 'move';
  scratchHeader.addEventListener('mousedown', function(e) {
    if (['BUTTON', 'TEXTAREA'].includes(e.target.tagName)) return;
    isDraggingScratchpad = true;
    const rect = scratchpadModal.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
  });
  window.addEventListener('mousemove', function(e) {
    if (!isDraggingScratchpad) return;
    scratchpadModal.style.left = (e.clientX - dragOffsetX) + 'px';
    scratchpadModal.style.top = (e.clientY - dragOffsetY) + 'px';
    scratchpadModal.style.right = 'auto';
  });
  window.addEventListener('mouseup', function() {
    isDraggingScratchpad = false;
  });
}

// Full Peak Keyboard Shortcuts
window.addEventListener('keydown', function(e) {
  // If user is typing in an input field or textarea, do not trigger shortcuts except Escape
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
    if (e.key === 'Escape') {
      scratchpadModal.style.display = 'none';
      shortcutsModal.style.display = 'none';
    }
    return;
  }

  const modalOpen = cropModal.style.display === 'flex';

  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    shortcutsModal.style.display = 'flex';
    return;
  }
  if (e.key.toLowerCase() === 's') {
    toggleScratchpad();
    return;
  }

  if (modalOpen) {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'q') {
      cropModal.style.display = 'none';
      showToast("Closed focus card.");
    } else if (e.key.toLowerCase() === 'i') {
      document.getElementById('modal-invert-btn').click();
    } else if (e.key.toLowerCase() === 'w') {
      document.getElementById('modal-clean-btn').click();
    } else if (e.key.toLowerCase() === 'c') {
      document.getElementById('modal-copy-btn').click();
    } else if (e.key.toLowerCase() === 't') {
      document.getElementById('modal-copy-text-btn').click();
    } else if (e.key.toLowerCase() === 'l') {
      document.getElementById('modal-copy-latex-btn').click();
    }
  } else {
    if (e.key === 'ArrowLeft') {
      onPrevPage();
    } else if (e.key === 'ArrowRight') {
      onNextPage();
    } else if (e.key === '+' || e.key === '=') {
      document.getElementById('zoom-in').click();
    } else if (e.key === '-') {
      document.getElementById('zoom-out').click();
    } else if (e.key.toLowerCase() === 'i') {
      document.getElementById('toggle-invert-btn').click();
    }
  }
});



