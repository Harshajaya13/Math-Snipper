// Prevent double initialization if script is injected multiple times
if (typeof window.zenIsActive === 'undefined') {
  window.zenIsActive = false;
  window.zenIsSelecting = false;
  window.zenCurrentHover = null;
  window.zenDeletedStack = [];
  window.zenRedoStack = []; // Redo stack
  window.zenIsCopying = false;
  window.zenTargetToIsolate = null; // Used for mobile selection

  function showToast(msg, duration = 3000) {
    let toast = document.getElementById('zen-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'zen-toast';
      document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.add('zen-show');
    setTimeout(() => {
      toast.classList.remove('zen-show');
    }, duration);
  }

  function getCssPath(el) {
    if (!(el instanceof Element)) return '';
    let path = [];
    while (el.nodeType === Node.ELEMENT_NODE && el.tagName.toLowerCase() !== 'html') {
      let selector = el.nodeName.toLowerCase();

      // Use the ID only if it doesn't contain numbers (stable IDs like "main", "content")
      // This prevents issues with dynamic IDs (like "post-123") while keeping the path stable
      if (el.id && el.id !== 'zen-snipper-reset' && !/\d/.test(el.id)) {
        selector += '#' + CSS.escape(el.id);
        path.unshift(selector);
        break;
      }

      let sib = el, nth = 1;
      while (sib = sib.previousElementSibling) {
        if (sib.nodeName.toLowerCase() == selector) nth++;
      }
      if (nth != 1) selector += ":nth-of-type(" + nth + ")";

      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(" > ");
  }

  // Timer variables
  let zenTimerInterval = null;
  let zenTimeLeft = 25 * 60; // 25 mins default

  function createTimerUI() {
    if (document.getElementById('zen-focus-timer')) return;

    const timerDiv = document.createElement('div');
    timerDiv.id = 'zen-focus-timer';

    const timeDisplay = document.createElement('span');
    timeDisplay.id = 'zen-timer-display';
    timeDisplay.innerText = '25:00';

    const playBtn = document.createElement('button');
    playBtn.innerText = '▶';
    playBtn.title = 'Start/Pause';
    playBtn.onclick = () => {
      if (zenTimerInterval) {
        clearInterval(zenTimerInterval);
        zenTimerInterval = null;
        playBtn.innerText = '▶';
      } else {
        playBtn.innerText = '⏸';
        zenTimerInterval = setInterval(() => {
          if (zenTimeLeft > 0) {
            zenTimeLeft--;
            let m = Math.floor(zenTimeLeft / 60).toString().padStart(2, '0');
            let s = (zenTimeLeft % 60).toString().padStart(2, '0');
            timeDisplay.innerText = `${m}:${s}`;
          }
        }, 1000);
      }
    };

    const resetBtn = document.createElement('button');
    resetBtn.innerText = '↻';
    resetBtn.title = 'Reset';
    resetBtn.onclick = () => {
      zenTimeLeft = 25 * 60;
      timeDisplay.innerText = '25:00';
      if (zenTimerInterval) clearInterval(zenTimerInterval);
      zenTimerInterval = null;
      playBtn.innerText = '▶';
    };

    const controls = document.createElement('div');
    controls.className = 'zen-timer-controls';
    controls.appendChild(playBtn);
    controls.appendChild(resetBtn);

    timerDiv.appendChild(timeDisplay);
    timerDiv.appendChild(controls);
    document.body.appendChild(timerDiv);
  }

  function toggleTimer() {
    let timerEl = document.getElementById('zen-focus-timer');
    if (!timerEl) {
      createTimerUI();
      localStorage.setItem('zen_timer_active', 'true');
    } else {
      timerEl.remove();
      if (zenTimerInterval) clearInterval(zenTimerInterval);
      zenTimerInterval = null;
      zenTimeLeft = 25 * 60;
      localStorage.setItem('zen_timer_active', 'false');
    }
  }

  // Scratchpad Logic
  function createScratchpadUI() {
    if (document.getElementById('zen-scratchpad')) return;

    const padDiv = document.createElement('div');
    padDiv.id = 'zen-scratchpad';

    const titleDiv = document.createElement('div');
    titleDiv.id = 'zen-scratchpad-title';
    titleDiv.innerHTML = '<span>📝 Scratch Pad</span>';

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '8px';

    const previewBtn = document.createElement('button');
    previewBtn.id = 'zen-scratchpad-preview-btn';
    previewBtn.innerText = '👁️ Preview';
    previewBtn.style.background = 'none';
    previewBtn.style.border = '1px solid currentColor';
    previewBtn.style.color = 'inherit';
    previewBtn.style.borderRadius = '4px';
    previewBtn.style.padding = '2px 8px';
    previewBtn.style.cursor = 'pointer';
    previewBtn.style.fontSize = '12px';

    const clearBtn = document.createElement('button');
    clearBtn.innerText = 'Clear';
    clearBtn.style.background = 'none';
    clearBtn.style.border = '1px solid currentColor';
    clearBtn.style.color = '#f87171';
    clearBtn.style.borderRadius = '4px';
    clearBtn.style.padding = '2px 8px';
    clearBtn.style.cursor = 'pointer';
    clearBtn.style.fontSize = '12px';

    btnContainer.appendChild(previewBtn);
    btnContainer.appendChild(clearBtn);
    titleDiv.appendChild(btnContainer);

    const textarea = document.createElement('div');
    textarea.id = 'zen-scratchpad-textarea';
    textarea.contentEditable = 'true';
    textarea.setAttribute('placeholder', 'Type calculations or paste LaTeX here...\n\n(Auto-saves automatically)');

    const previewDiv = document.createElement('div');
    previewDiv.id = 'zen-scratchpad-preview';
    previewDiv.style.display = 'none';

    // Restore saved notes
    const savedNotes = localStorage.getItem('zen_scratchpad_content');
    if (savedNotes) {
      textarea.innerHTML = savedNotes;
    }

    // Auto-save on type
    textarea.addEventListener('input', (e) => {
      localStorage.setItem('zen_scratchpad_content', e.target.innerHTML);
    });

    clearBtn.onclick = () => {
      if (confirm('Clear all notes?')) {
        textarea.innerHTML = '';
        localStorage.removeItem('zen_scratchpad_content');
        if (previewDiv.style.display === 'block') previewBtn.click(); // switch back to edit
      }
    };

    previewBtn.onclick = () => {
      if (textarea.style.display !== 'none') {
        // Switch to preview mode
        textarea.style.display = 'none';
        previewDiv.style.display = 'block';
        previewBtn.innerText = '✏️ Edit';

        let safeHTML = textarea.innerHTML;
        previewDiv.innerHTML = safeHTML;

        // Inject script to render math using the host page's MathJax/KaTeX
        const script = document.createElement('script');
        script.textContent = `
          try {
            let p = document.getElementById('zen-scratchpad-preview');
            if (typeof MathJax !== 'undefined') {
              if (MathJax.typesetPromise) {
                MathJax.typesetPromise([p]).catch(e => console.log(e));
              } else if (MathJax.Hub && MathJax.Hub.Queue) {
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, p]);
              }
            } else if (typeof renderMathInElement === 'function') {
              renderMathInElement(p, {
                delimiters: [
                  {left: "$$", right: "$$", display: true},
                  {left: "\\\\[", right: "\\\\]", display: true},
                  {left: "$", right: "$", display: false},
                  {left: "\\\\(", right: "\\\\)", display: false}
                ]
              });
            }
          } catch(e) {}
        `;
        document.body.appendChild(script);
        setTimeout(() => script.remove(), 100);

      } else {
        // Switch to edit mode
        textarea.style.display = 'block';
        previewDiv.style.display = 'none';
        previewBtn.innerText = '👁️ Preview';
      }
    };

    padDiv.appendChild(titleDiv);
    padDiv.appendChild(textarea);
    padDiv.appendChild(previewDiv);
    document.body.appendChild(padDiv);

    // Shift content so it doesn't overlap
    document.body.classList.add('zen-scratchpad-open');
  }

  function toggleScratchpad() {
    let padEl = document.getElementById('zen-scratchpad');
    if (!padEl) {
      createScratchpadUI();
      localStorage.setItem('zen_scratchpad_active', 'true');
    } else {
      padEl.remove();
      localStorage.setItem('zen_scratchpad_active', 'false');
      document.body.classList.remove('zen-scratchpad-open');
    }
  }

  // Theme persistence functions
  function applyTheme(themeName) {
    document.body.classList.remove('zen-theme-dark', 'zen-theme-midnight', 'zen-theme-paper', 'zen-theme-hacker');
    document.body.classList.add('zen-theme-' + themeName);
    localStorage.setItem('zen_saved_theme', themeName);
  }

  function getSavedTheme() {
    return localStorage.getItem('zen_saved_theme') || 'dark';
  }

  // Restore state on load (handles dynamic pages and extension injection timing)
  function tryRestoreZenMode() {
    console.log("[Zen Snipper] Extension script loaded on this page!");

    let savedUrl = localStorage.getItem('zen_mode_url');
    if (!savedUrl) {
      console.log("[Zen Snipper] No saved URL found. Normal load.");
      return;
    }

    try {
      let savedPath = new URL(savedUrl).pathname;
      let currentPath = window.location.pathname;

      console.log("[Zen Snipper] Checking restore. Saved path:", savedPath, "Current:", currentPath);

      if (savedPath === currentPath) {
        const selector = localStorage.getItem('zen_mode_selector');
        console.log("[Zen Snipper] URL matched. Hunting for selector:", selector);

        if (selector) {
          let attempts = 0;
          let restoreInterval = setInterval(() => {
            try {
              const target = document.querySelector(selector);
              if (target) {
                console.log("[Zen Snipper] Element found! Restoring Zen Mode.");
                clearInterval(restoreInterval);
                isolateElement(target, true);
              }
            } catch (e) {
              console.error("[Zen Snipper] Invalid selector:", e);
              clearInterval(restoreInterval);
            }

            attempts++;
            if (attempts > 15) {
              console.log("[Zen Snipper] Gave up trying to find the element.");
              clearInterval(restoreInterval); // Give up after ~7.5 seconds
            }
          }, 500);
        }
      }
    } catch (e) {
      console.error("[Zen Snipper] Error parsing URL:", e);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    tryRestoreZenMode();
  } else {
    window.addEventListener('load', tryRestoreZenMode);
  }

  // Keep visual feedback ONLY for tools inside Zen Mode (Eraser/Copy)
  document.addEventListener('mouseover', (e) => {
    window.zenCurrentHover = e.target;

    if (window.zenIsActive && !window.zenIsSelecting && e.target !== document.body && e.target !== document.documentElement) {
      document.querySelectorAll('.zen-eraser-hover').forEach(el => el.classList.remove('zen-eraser-hover'));
      document.querySelectorAll('.zen-copy-hover').forEach(el => el.classList.remove('zen-copy-hover'));

      if (e.target.closest('.zen-isolated-element')) {
        if (window.zenIsCopying) {
          e.target.classList.add('zen-copy-hover');
        } else {
          e.target.classList.add('zen-eraser-hover');
        }
      }
    }
  }, true);

  document.addEventListener('mouseout', (e) => {
    if (window.zenIsActive && !window.zenIsSelecting) {
      e.target.classList.remove('zen-eraser-hover');
      e.target.classList.remove('zen-copy-hover');
    }
  }, true);

  // Prevent link clicks during Zen Mode
  document.addEventListener('click', (e) => {
    if (window.zenIsActive) {
      let anchor = e.target.closest('a');
      if (anchor) {
        e.preventDefault(); // Stop the link from redirecting
      }
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable || e.isComposing) return;

    // Undo/Redo with Ctrl+Z / Ctrl+Y
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z' && window.zenIsActive) {
        performUndo();
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'y' && window.zenIsActive) {
        performRedo();
        e.preventDefault();
      }
      return; // Ignore other ctrl/cmd shortcuts
    }

    // Exit on Q or Escape
    if (e.key.toLowerCase() === 'q' || e.key === 'Escape') {
      const modal = document.getElementById('zen-shortcuts-modal');
      if (modal) {
        modal.remove();
        return; // Just close modal if it's open
      }
      if (window.zenIsCopying) {
        document.querySelector('.zen-theme-option-copy').click(); // Toggle it off
        return; // Don't exit Zen mode yet, just exit copy mode
      }
      if (window.zenIsActive || window.zenIsSelecting) {
        resetZenMode();
      }
      return;
    }

    // Quick Toggles in Zen Mode
    if (window.zenIsActive) {
      if (e.key === 'Tab') {
        e.preventDefault();
        document.body.classList.toggle('zen-ultra-focus');
        return;
      }

      if (e.key.toLowerCase() === 'm') {
        const themeBtn = document.getElementById('zen-theme-btn');
        if (themeBtn) themeBtn.click();
        return;
      }

      if (e.key.toLowerCase() === 't') {
        toggleTimer();
        return;
      }

      if (e.key.toLowerCase() === 's') {
        toggleScratchpad();
        return;
      }

      if (e.key.toLowerCase() === 'k') {
        toggleShortcutsModal();
        return;
      }

      if (e.key.toLowerCase() === 'p') {
        const pBtn = document.getElementById('zen-scratchpad-preview-btn');
        if (pBtn) pBtn.click();
        return;
      }
    }

    // Delete hovered element with D or X (Only if NOT copying)
    if (!window.zenIsCopying && (e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'x') && window.zenIsActive && window.zenCurrentHover) {
      if (window.zenCurrentHover !== document.body &&
        window.zenCurrentHover !== document.documentElement &&
        window.zenCurrentHover.id !== 'zen-snipper-reset') {
        window.zenCurrentHover.classList.add('zen-hidden');
        window.zenDeletedStack.push(window.zenCurrentHover);
        window.zenRedoStack = []; // Clear redo stack on new action
        if (typeof updateHistoryButtons === 'function') updateHistoryButtons();
      }
    }

    // Handle C for Copy Mode
    if (e.key.toLowerCase() === 'c' && window.zenIsActive) {
      if (window.zenIsCopying) {
        // In copy mode, if hovering over a valid block, copy it!
        if (window.zenCurrentHover && window.zenCurrentHover !== document.body &&
          window.zenCurrentHover !== document.documentElement &&
          window.zenCurrentHover.id !== 'zen-snipper-reset') {

          copySmartElement(window.zenCurrentHover);

          // Visual feedback flash
          const oldBg = window.zenCurrentHover.style.backgroundColor;
          window.zenCurrentHover.style.backgroundColor = 'rgba(74, 222, 128, 0.4)';
          showToast("✅ Copied block to clipboard!", 2000);
          setTimeout(() => {
            window.zenCurrentHover.style.backgroundColor = oldBg;
          }, 300);
        } else {
          // If they press C but aren't hovering over anything, toggle copy mode OFF
          document.querySelector('.zen-theme-option-copy').click();
        }
      } else {
        // Toggle copy mode ON
        document.querySelector('.zen-theme-option-copy').click();
      }
    }
  }, true);

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle_zen_mode") {
      if (!window.zenIsActive && !window.zenIsSelecting) {
        startSelection();
      } else if (window.zenIsSelecting) {
        // If clicking extension button while selecting, cancel selection
        stopSelectionEvents();
      } else {
        // If already isolated, reset it
        resetZenMode();
      }
    }
  });

  const isTouchDevice = () => window.matchMedia("(pointer: coarse)").matches;

  // --- UNDO / REDO API ---
  function updateHistoryButtons() {
    const undoBtn = document.getElementById('zen-btn-undo');
    const redoBtn = document.getElementById('zen-btn-redo');
    if (!undoBtn || !redoBtn) return;
    undoBtn.style.opacity = window.zenDeletedStack.length > 0 ? '1' : '0.3';
    redoBtn.style.opacity = window.zenRedoStack.length > 0 ? '1' : '0.3';
  }

  function performUndo() {
    if (window.zenDeletedStack.length > 0) {
      let lastDeleted = window.zenDeletedStack.pop();
      if (lastDeleted) {
        lastDeleted.classList.remove('zen-hidden');
        window.zenRedoStack.push(lastDeleted);
      }
      updateHistoryButtons();
    }
  }

  function performRedo() {
    if (window.zenRedoStack.length > 0) {
      let lastRedo = window.zenRedoStack.pop();
      if (lastRedo) {
        lastRedo.classList.add('zen-hidden');
        window.zenDeletedStack.push(lastRedo);
      }
      updateHistoryButtons();
    }
  }

  function createHistoryUI() {
    if (!isTouchDevice()) return; // Only for mobile
    let historyDiv = document.getElementById('zen-mobile-history');
    if (!historyDiv) {
      historyDiv = document.createElement('div');
      historyDiv.id = 'zen-mobile-history';

      const undoBtn = document.createElement('button');
      undoBtn.id = 'zen-btn-undo';
      undoBtn.innerHTML = '↶';
      undoBtn.onclick = performUndo;

      const redoBtn = document.createElement('button');
      redoBtn.id = 'zen-btn-redo';
      redoBtn.innerHTML = '↷';
      redoBtn.onclick = performRedo;

      historyDiv.appendChild(undoBtn);
      historyDiv.appendChild(redoBtn);
      document.body.appendChild(historyDiv);
    }
    updateHistoryButtons();
  }

  // --- MOBILE ERASER LOGIC ---
  let mobileEraseTarget = null;
  function handleMobileEraseClick(e) {
    if (!window.zenIsActive || !isTouchDevice() || window.zenIsSelecting) return;

    // Ignore UI elements
    if (e.target.closest('#zen-theme-btn') || e.target.closest('#zen-snipper-reset') || e.target.closest('#zen-theme-menu') || e.target.closest('#zen-scratchpad') || e.target.closest('#zen-mobile-history') || e.target.closest('#zen-focus-timer') || e.target.closest('#zen-toast')) return;

    const actionGroup = e.target.closest('#zen-mobile-action-group');
    if (actionGroup) {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.target.closest('#zen-mobile-settings-btn')) {
        const menu = document.getElementById('zen-mobile-actions-menu');
        if (menu) menu.classList.toggle('zen-hidden');
        return;
      }
      
      if (e.target.closest('#zen-mobile-action-copy')) {
        if (mobileEraseTarget) {
          copySmartElement(mobileEraseTarget);
          showToast("✅ Copied block to clipboard!", 2000);
        }
        clearMobileErase();
        return;
      }
      
      if (e.target.closest('#zen-mobile-action-delete')) {
        if (mobileEraseTarget) {
          mobileEraseTarget.classList.add('zen-hidden');
          window.zenDeletedStack.push(mobileEraseTarget);
          window.zenRedoStack = [];
          updateHistoryButtons();
        }
        clearMobileErase();
        return;
      }
      
      return;
    }
    
    // Tap a block to highlight it
    if (e.target.closest('.zen-isolated-element')) {
      clearMobileErase();

      let target = e.target;
      if (target.nodeType === 3) target = target.parentNode;

      mobileEraseTarget = target;
      target.classList.add('zen-mobile-action-box');

      const btnGroup = document.createElement('div');
      btnGroup.id = 'zen-mobile-action-group';

      const settingsBtn = document.createElement('button');
      settingsBtn.id = 'zen-mobile-settings-btn';
      settingsBtn.innerHTML = '⚙️';

      const actionsMenu = document.createElement('div');
      actionsMenu.id = 'zen-mobile-actions-menu';
      actionsMenu.classList.add('zen-hidden');

      const copyBtn = document.createElement('button');
      copyBtn.id = 'zen-mobile-action-copy';
      copyBtn.innerHTML = '📋 Copy';

      const deleteBtn = document.createElement('button');
      deleteBtn.id = 'zen-mobile-action-delete';
      deleteBtn.innerHTML = '🗑️ Delete';

      actionsMenu.appendChild(copyBtn);
      actionsMenu.appendChild(deleteBtn);

      btnGroup.appendChild(settingsBtn);
      btnGroup.appendChild(actionsMenu);
      document.body.appendChild(btnGroup);

      const rect = target.getBoundingClientRect();
      btnGroup.style.top = (rect.top - 15) + 'px';
      btnGroup.style.left = (rect.right - 25) + 'px';

      // Update position on scroll
      window.addEventListener('scroll', updateMobileEraseBtnPosition, true);
    } else {
      clearMobileErase();
    }
  }

  function updateMobileEraseBtnPosition() {
    const btn = document.getElementById('zen-mobile-action-group');
    if (!btn || !mobileEraseTarget) return;
    const rect = mobileEraseTarget.getBoundingClientRect();
    btn.style.top = (rect.top - 15) + 'px';
    btn.style.left = (rect.right - 25) + 'px';
  }

  function clearMobileErase() {
    window.removeEventListener('scroll', updateMobileEraseBtnPosition, true);
    document.querySelectorAll('.zen-mobile-action-box').forEach(el => el.classList.remove('zen-mobile-action-box'));
    const btn = document.getElementById('zen-mobile-action-group');
    if (btn) btn.remove();
    mobileEraseTarget = null;
  }

  document.addEventListener('click', handleMobileEraseClick, true);

  // --- DESKTOP HOVER & REGION CROP LOGIC ---
  let cropStartX = 0;
  let cropStartY = 0;
  let isDraggingCrop = false;
  let cropMarqueeEl = null;

  function handleMouseDownCrop(e) {
    if (!window.zenIsSelecting || e.button !== 0) return;
    cropStartX = e.clientX;
    cropStartY = e.clientY;
    isDraggingCrop = false;
  }

  function handleMouseMoveCrop(e) {
    if (!window.zenIsSelecting || !(e.buttons & 1)) return;
    const dx = Math.abs(e.clientX - cropStartX);
    const dy = Math.abs(e.clientY - cropStartY);

    if (!isDraggingCrop && (dx > 8 || dy > 8)) {
      isDraggingCrop = true;
      document.querySelectorAll('.zen-snipper-hover').forEach(el => el.classList.remove('zen-snipper-hover'));
      if (!cropMarqueeEl) {
        cropMarqueeEl = document.createElement('div');
        cropMarqueeEl.id = 'zen-crop-marquee';
        const badge = document.createElement('div');
        badge.id = 'zen-crop-marquee-badge';
        cropMarqueeEl.appendChild(badge);
        document.body.appendChild(cropMarqueeEl);
      }
    }

    if (isDraggingCrop && cropMarqueeEl) {
      const left = Math.min(cropStartX, e.clientX);
      const top = Math.min(cropStartY, e.clientY);
      cropMarqueeEl.style.left = left + 'px';
      cropMarqueeEl.style.top = top + 'px';
      cropMarqueeEl.style.width = dx + 'px';
      cropMarqueeEl.style.height = dy + 'px';
      const badgeEl = cropMarqueeEl.querySelector('#zen-crop-marquee-badge');
      if (badgeEl) badgeEl.textContent = `${Math.round(dx)} × ${Math.round(dy)} px`;
    }
  }

  function handleMouseUpCrop(e) {
    if (!window.zenIsSelecting || e.button !== 0) return;
    if (isDraggingCrop && cropMarqueeEl) {
      const left = Math.min(cropStartX, e.clientX);
      const top = Math.min(cropStartY, e.clientY);
      const width = Math.abs(e.clientX - cropStartX);
      const height = Math.abs(e.clientY - cropStartY);

      cropMarqueeEl.remove();
      cropMarqueeEl = null;

      if (width > 20 && height > 20) {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => { isDraggingCrop = false; }, 50);
        isolateCroppedRegion({ left, top, width, height });
        return;
      }
    }
    isDraggingCrop = false;
  }

  function isolateCroppedRegion(rect) {
    stopSelectionEvents();
    window.zenIsActive = true;

    const canvases = Array.from(document.querySelectorAll('canvas')).filter(c => {
      const r = c.getBoundingClientRect();
      return !(rect.left > r.right || rect.right < r.left || rect.top > r.bottom || rect.bottom < r.top);
    });

    if (canvases.length === 0) {
      const centerEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (centerEl && centerEl !== document.body && centerEl !== document.documentElement) {
        isolateElement(centerEl);
        return;
      }
    }

    const container = document.createElement('div');
    container.className = 'zen-cropped-view-container';

    const card = document.createElement('div');
    card.className = 'zen-cropped-card';

    const header = document.createElement('div');
    header.className = 'zen-cropped-header';
    header.innerHTML = `
      <span>🧘 Zen Snipper — Cropped Focus</span>
      <div class="zen-cropped-actions">
        <button class="zen-cropped-btn" id="zen-crop-invert-btn" title="Toggle OLED Invert Mode">🌓 Invert Colors</button>
        <button class="zen-cropped-btn" id="zen-crop-copy-btn" title="Copy Image to Clipboard">📋 Copy Snip</button>
        <button class="zen-cropped-btn" id="zen-crop-close-btn" title="Exit Zen Mode">✕ Exit</button>
      </div>
    `;
    card.appendChild(header);

    let finalCanvas = document.createElement('canvas');
    finalCanvas.width = Math.max(1, Math.round(rect.width));
    finalCanvas.height = Math.max(1, Math.round(rect.height));
    const ctx = finalCanvas.getContext('2d');

    canvases.forEach(canvas => {
      const cRect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / cRect.width;
      const scaleY = canvas.height / cRect.height;

      const sx = Math.max(0, (rect.left - cRect.left) * scaleX);
      const sy = Math.max(0, (rect.top - cRect.top) * scaleY);
      const sWidth = Math.min(canvas.width - sx, rect.width * scaleX);
      const sHeight = Math.min(canvas.height - sy, rect.height * scaleY);

      const dx = Math.max(0, cRect.left - rect.left);
      const dy = Math.max(0, cRect.top - rect.top);
      const dWidth = Math.min(rect.width - dx, sWidth / scaleX);
      const dHeight = Math.min(rect.height - dy, sHeight / scaleY);

      try {
        ctx.drawImage(canvas, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
      } catch(err) {
        console.warn("[Zen Snipper] Canvas draw error:", err);
      }
    });

    const img = document.createElement('img');
    img.className = 'zen-cropped-image';
    img.src = finalCanvas.toDataURL('image/png');
    card.appendChild(img);
    container.appendChild(card);
    document.body.appendChild(container);

    document.body.classList.add('zen-snipper-active');
    applyCurrentTheme();

    const invertBtn = header.querySelector('#zen-crop-invert-btn');
    if (invertBtn) {
      invertBtn.addEventListener('click', () => {
        img.classList.toggle('zen-invert-active');
      });
    }

    const copyBtn = header.querySelector('#zen-crop-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        finalCanvas.toBlob(blob => {
          if (blob && navigator.clipboard && navigator.clipboard.write) {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
              .then(() => showToast("Copied cropped snip to clipboard!", 3000))
              .catch(() => showToast("Failed to copy image.", 3000));
          } else {
            showToast("Copied!", 2000);
          }
        });
      });
    }

    const closeBtn = header.querySelector('#zen-crop-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        resetZenMode();
      });
    }

    showToast("Region isolated! Press 'M' for Theme or 'S' for Scratch Pad.", 4000);
  }

  function handleMouseOverDesktop(e) {
    if (!window.zenIsSelecting || isDraggingCrop) return;
    e.stopPropagation();
    e.target.classList.add('zen-snipper-hover');
  }

  function handleMouseOutDesktop(e) {
    if (!window.zenIsSelecting || isDraggingCrop) return;
    e.stopPropagation();
    e.target.classList.remove('zen-snipper-hover');
  }

  function handleClickDesktop(e) {
    if (!window.zenIsSelecting || isDraggingCrop) return;
    e.preventDefault();
    e.stopPropagation();
    e.target.classList.remove('zen-snipper-hover');
    isolateElement(e.target);
  }

  // --- MOBILE-FRIENDLY TWO-TAP SELECTION LOGIC ---
  function clearMobileSelection() {
    window.removeEventListener('scroll', updateConfirmBtnPosition, true);
    document.querySelectorAll('.zen-mobile-selection-box').forEach(el => {
      el.classList.remove('zen-mobile-selection-box');
    });
    const btn = document.getElementById('zen-mobile-confirm-btn');
    if (btn) btn.remove();
    window.zenTargetToIsolate = null;
  }

  function updateConfirmBtnPosition() {
    const btn = document.getElementById('zen-mobile-confirm-btn');
    const target = window.zenTargetToIsolate;
    if (!btn || !target) return;
    const rect = target.getBoundingClientRect();
    btn.style.top = (rect.top - 15) + 'px';
    btn.style.left = (rect.right - 15) + 'px';
  }

  function handleSelectionClickMobile(e) {
    if (!window.zenIsSelecting) return;

    if (e.target.id === 'zen-mobile-confirm-btn' || e.target.closest('#zen-mobile-confirm-btn')) {
      e.preventDefault();
      e.stopPropagation();
      let target = window.zenTargetToIsolate;
      clearMobileSelection();
      if (target) isolateElement(target);
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    clearMobileSelection();

    let target = e.target;
    if (target.nodeType === 3) target = target.parentNode;

    window.zenTargetToIsolate = target;
    target.classList.add('zen-mobile-selection-box');

    const btn = document.createElement('button');
    btn.id = 'zen-mobile-confirm-btn';
    btn.innerHTML = '+';

    document.body.appendChild(btn);
    updateConfirmBtnPosition();
    window.addEventListener('scroll', updateConfirmBtnPosition, true);
  }

  function startSelection() {
    window.zenIsSelecting = true;
    if (isTouchDevice()) {
      document.addEventListener('click', handleSelectionClickMobile, true);
      showToast("Tap a block to highlight it, then tap the '+' button!", 4000);
    } else {
      document.addEventListener('mousedown', handleMouseDownCrop, true);
      document.addEventListener('mousemove', handleMouseMoveCrop, true);
      document.addEventListener('mouseup', handleMouseUpCrop, true);
      document.addEventListener('mouseover', handleMouseOverDesktop, true);
      document.addEventListener('mouseout', handleMouseOutDesktop, true);
      document.addEventListener('click', handleClickDesktop, true);
      showToast("Hover to click a block, or click & drag to crop a PDF region!", 4500);
    }
  }

  function stopSelectionEvents() {
    window.zenIsSelecting = false;
    document.removeEventListener('click', handleSelectionClickMobile, true);
    document.removeEventListener('mousedown', handleMouseDownCrop, true);
    document.removeEventListener('mousemove', handleMouseMoveCrop, true);
    document.removeEventListener('mouseup', handleMouseUpCrop, true);
    document.removeEventListener('mouseover', handleMouseOverDesktop, true);
    document.removeEventListener('mouseout', handleMouseOutDesktop, true);
    document.removeEventListener('click', handleClickDesktop, true);

    if (cropMarqueeEl) {
      cropMarqueeEl.remove();
      cropMarqueeEl = null;
    }
    isDraggingCrop = false;

    clearMobileSelection();
    document.querySelectorAll('.zen-snipper-hover').forEach(el => {
      el.classList.remove('zen-snipper-hover');
    });
  }

  function isolateElement(target, isRestoring = false) {
    stopSelectionEvents();
    window.zenIsActive = true;

    if (!isRestoring) {
      localStorage.setItem('zen_mode_url', window.location.href);
      localStorage.setItem('zen_mode_selector', getCssPath(target));
      console.log("[Zen Snipper] Saved Zen Mode state to localStorage!");
    }

    let toHide = [];
    let current = target;

    // Walk up the DOM tree to the body
    while (current && current !== document.body && current !== document.documentElement) {
      let parent = current.parentElement;
      if (parent) {
        parent.classList.add('zen-no-bg'); // Nuke watermarks on ancestors
        let siblings = parent.children;
        // For each sibling of our current path element
        for (let i = 0; i < siblings.length; i++) {
          let sibling = siblings[i];
          // If it's not the path element, and it's not a script/style tag, and not our button
          if (sibling !== current &&
            sibling.tagName !== 'SCRIPT' &&
            sibling.tagName !== 'STYLE' &&
            sibling.id !== 'zen-snipper-reset') {
            toHide.push(sibling);
          }
        }
      }
      current = parent;
    }

    // Hide all the collected siblings
    toHide.forEach(el => {
      el.classList.add('zen-hidden');
    });

    // Style the body and the target
    document.body.classList.add('zen-snipper-active');
    applyTheme(getSavedTheme());
    target.classList.add('zen-isolated-element');

    createControls();
    createHistoryUI(); // Add Mobile History Buttons
  }

  function createControls() {
    if (document.getElementById('zen-snipper-reset')) return;

    // Reset Button
    const btn = document.createElement('button');
    btn.id = 'zen-snipper-reset';
    btn.innerText = 'Exit Zen Mode';
    btn.onclick = resetZenMode;
    document.body.appendChild(btn);

    // Theme Button (Palette Icon)
    const themeBtn = document.createElement('button');
    themeBtn.id = 'zen-theme-btn';
    themeBtn.title = 'Change Theme';
    themeBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`;
    document.body.appendChild(themeBtn);

    // Theme Selection Menu
    const menu = document.createElement('div');
    menu.id = 'zen-theme-menu';

    const themes = [
      { id: 'dark', label: 'OLED Dark' },
      { id: 'midnight', label: 'Midnight Blue' },
      { id: 'paper', label: 'Paper Light' },
      { id: 'hacker', label: 'Hacker Matrix' }
    ];

    themes.forEach(t => {
      let opt = document.createElement('button');
      opt.className = 'zen-theme-option zen-theme-option-' + t.id;
      opt.innerText = t.label;
      opt.onclick = (e) => {
        e.stopPropagation();
        applyTheme(t.id);
        menu.classList.remove('zen-show');
      };
      menu.appendChild(opt);
    });

    // Add Smart Copy Toggle
    let optCopy = document.createElement('button');
    optCopy.className = 'zen-theme-option zen-theme-option-copy';
    optCopy.style.marginTop = '4px';
    optCopy.style.borderTop = '1px solid #444';
    optCopy.style.background = 'transparent';
    optCopy.style.color = '#38bdf8';
    optCopy.innerText = '📋 Copy Smart Text (LaTeX)';
    optCopy.onclick = (e) => {
      e.stopPropagation();
      window.zenIsCopying = !window.zenIsCopying;
      if (window.zenIsCopying) {
        optCopy.innerText = '🛑 Exit Copy Mode';
        optCopy.style.color = '#f87171';
        showToast("Hover over any block and press 'C' to copy!");
      } else {
        optCopy.innerText = '📋 Copy Smart Text (LaTeX)';
        optCopy.style.color = '#38bdf8';
        showToast("Exited Copy Mode");
        document.querySelectorAll('.zen-copy-hover').forEach(el => el.classList.remove('zen-copy-hover'));
      }
      menu.classList.remove('zen-show');
    };
    menu.appendChild(optCopy);

    // Add Timer Toggle
    let optTimer = document.createElement('button');
    optTimer.className = 'zen-theme-option';
    optTimer.style.marginTop = '4px';
    optTimer.style.borderTop = '1px solid #444';
    optTimer.style.background = 'transparent';
    optTimer.style.color = 'white';
    optTimer.innerText = '⏱️ Toggle Study Timer';
    optTimer.onclick = (e) => {
      e.stopPropagation();
      toggleTimer();
      menu.classList.remove('zen-show');
    };
    menu.appendChild(optTimer);

    // Add Scratchpad Toggle
    let optPad = document.createElement('button');
    optPad.className = 'zen-theme-option';
    optPad.style.background = 'transparent';
    optPad.style.color = 'white';
    optPad.innerText = '📝 Toggle Scratch Pad';
    optPad.onclick = (e) => {
      e.stopPropagation();
      toggleScratchpad();
      menu.classList.remove('zen-show');
    };
    menu.appendChild(optPad);

    // Add Shortcuts Toggle (Hidden on mobile via CSS)
    let optShortcuts = document.createElement('button');
    optShortcuts.className = 'zen-theme-option zen-shortcuts-btn-option';
    optShortcuts.style.marginTop = '4px';
    optShortcuts.style.borderTop = '1px solid #444';
    optShortcuts.style.background = 'transparent';
    optShortcuts.style.color = '#a78bfa';
    optShortcuts.innerText = '⌨️ Keyboard Shortcuts';
    optShortcuts.onclick = (e) => {
      e.stopPropagation();
      menu.classList.remove('zen-show');
      toggleShortcutsModal();
    };
    menu.appendChild(optShortcuts);

    document.body.appendChild(menu);

    // Restore timer if it was active
    if (localStorage.getItem('zen_timer_active') === 'true') {
      createTimerUI();
    }

    // Restore scratchpad if it was active
    if (localStorage.getItem('zen_scratchpad_active') === 'true') {
      createScratchpadUI();
    }

    // Toggle menu
    themeBtn.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle('zen-show');
    };

    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
      if (window.zenIsActive && menu.classList.contains('zen-show') && !menu.contains(e.target) && e.target !== themeBtn) {
        menu.classList.remove('zen-show');
      }
    });
  }

  function resetZenMode() {
    window.zenIsActive = false;
    window.zenIsSelecting = false;
    stopSelectionEvents();

    const croppedContainer = document.querySelector('.zen-cropped-view-container');
    if (croppedContainer) croppedContainer.remove();
    const marqueeEl = document.getElementById('zen-crop-marquee');
    if (marqueeEl) marqueeEl.remove();

    localStorage.removeItem('zen_mode_url');
    localStorage.removeItem('zen_mode_selector');
    console.log("[Zen Snipper] Zen Mode exited. Cleared localStorage.");

    document.body.classList.remove('zen-snipper-active', 'zen-theme-dark', 'zen-theme-midnight', 'zen-theme-paper', 'zen-theme-hacker');

    const hiddenElements = document.querySelectorAll('.zen-hidden');
    hiddenElements.forEach(el => el.classList.remove('zen-hidden'));

    const isolated = document.querySelectorAll('.zen-isolated-element');
    isolated.forEach(el => el.classList.remove('zen-isolated-element'));

    document.querySelectorAll('.zen-eraser-hover').forEach(el => el.classList.remove('zen-eraser-hover'));

    const noBg = document.querySelectorAll('.zen-no-bg');
    noBg.forEach(el => el.classList.remove('zen-no-bg'));

    const btn = document.getElementById('zen-snipper-reset');
    if (btn) btn.remove();
    const themeBtn = document.getElementById('zen-theme-btn');
    if (themeBtn) themeBtn.remove();
    const menu = document.getElementById('zen-theme-menu');
    if (menu) menu.remove();
    const timer = document.getElementById('zen-focus-timer');
    if (timer) timer.remove();
    const pad = document.getElementById('zen-scratchpad');
    if (pad) pad.remove();
    const modal = document.getElementById('zen-shortcuts-modal');
    if (modal) modal.remove();
    const historyDiv = document.getElementById('zen-mobile-history');
    if (historyDiv) historyDiv.remove();
    clearMobileErase();

    document.body.classList.remove('zen-scratchpad-open', 'zen-shortcuts-open');

    if (zenTimerInterval) clearInterval(zenTimerInterval);
    zenTimerInterval = null;

    window.zenDeletedStack = [];
    window.zenRedoStack = [];
  }

  // --- SHORTCUTS MODAL ---
  function toggleShortcutsModal() {
    let modal = document.getElementById('zen-shortcuts-modal');
    if (modal) {
      modal.remove();
      return;
    }

    modal = document.createElement('div');
    modal.id = 'zen-shortcuts-modal';

    modal.innerHTML = `
      <div id="zen-shortcuts-header">
        ⌨️ Keyboard Shortcuts
        <button id="zen-shortcuts-close">×</button>
      </div>
      <div id="zen-shortcuts-list">
        <div><span>Tab</span><span>Ultra-Focus Mode</span></div>
        <div><span>Alt + M</span><span>Start Snipper</span></div>
        <div><span>Click</span><span>Isolate Block</span></div>
        <div><span>M</span><span>Toggle Menu</span></div>
        <div><span>T</span><span>Toggle Timer</span></div>
        <div><span>S</span><span>Toggle Scratch Pad</span></div>
        <div><span>P</span><span>Toggle Math Preview</span></div>
        <div><span>K</span><span>Toggle Shortcuts</span></div>
        <div><span>C</span><span>Toggle Copy Mode</span></div>
        <div><span>Hover + C</span><span>Copy Block</span></div>
        <div><span>Hover + D</span><span>Delete Block</span></div>
        <div><span>Ctrl + Z</span><span>Undo Delete</span></div>
        <div><span>Esc / Q</span><span>Exit Zen Mode</span></div>
      </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('zen-shortcuts-close').onclick = () => modal.remove();
  }

  // --- SMART COPY LOGIC ---
  function copySmartElement(target) {
    if (!target) return;

    let clone = target.cloneNode(true);

    // Clean out deleted elements from Eraser Tool
    clone.querySelectorAll('.zen-hidden').forEach(el => el.remove());

    // MathJax v2: <script type="math/tex">
    let scripts = clone.querySelectorAll('script[type^="math/tex"]');
    scripts.forEach(script => {
      let tex = script.textContent;
      let isDisplay = script.type.includes('mode=display');
      let textNode = document.createTextNode(isDisplay ? `\n$$${tex}$$\n` : ` $${tex}$ `);

      // Attempt to remove the rendered MathJax span (usually previous sibling)
      let prev = script.previousElementSibling;
      while (prev && prev.className && typeof prev.className === 'string' && prev.className.includes('MathJax')) {
        let toRemove = prev;
        prev = prev.previousElementSibling;
        toRemove.remove();
      }
      script.parentNode.replaceChild(textNode, script);
    });

    // MathJax v3 / KaTeX: <annotation encoding="application/x-tex">
    let annotations = clone.querySelectorAll('annotation[encoding="application/x-tex"]');
    annotations.forEach(ann => {
      let tex = ann.textContent;
      let wrapper = ann.closest('.katex') || ann.closest('mjx-container') || ann.closest('.MathJax');
      if (wrapper) {
        let isDisplay = false;
        if (wrapper.tagName.toLowerCase() === 'mjx-container' && wrapper.getAttribute('display') === 'true') isDisplay = true;
        if (wrapper.classList && wrapper.classList.contains('katex-display')) isDisplay = true;

        let textNode = document.createTextNode(isDisplay ? `\n$$${tex}$$\n` : ` $${tex}$ `);
        wrapper.parentNode.replaceChild(textNode, wrapper);
      }
    });

    // Strip remaining scripts and styles
    clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());

    // Fix squashed newlines by temporarily appending to DOM
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.width = target.offsetWidth + 'px'; // Match width for block rendering
    document.body.appendChild(clone);
    let finalContent = clone.innerText.trim();
    document.body.removeChild(clone);

    // Copy to clipboard
    navigator.clipboard.writeText(finalContent).then(() => {
      console.log("Zen Snipper: Successfully copied smart text.");
    }).catch(err => {
      console.error("Zen Snipper: Could not copy text", err);
      showToast("❌ Failed to copy to clipboard.");
    });
  }
}
