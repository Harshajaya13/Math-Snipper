// Prevent double initialization if script is injected multiple times
if (typeof window.zenIsActive === 'undefined') {
  window.zenIsActive = false;
  window.zenIsSelecting = false;
  window.zenCurrentHover = null;
  window.zenDeletedStack = []; // Stack for undo functionality

  function getCssPath(el) {
    if (!(el instanceof Element)) return '';
    let path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.id && el.id !== 'zen-snipper-reset') {
        selector += '#' + el.id;
        path.unshift(selector);
        break;
      } else {
        let sib = el, nth = 1;
        while (sib = sib.previousElementSibling) {
          if (sib.nodeName.toLowerCase() == selector) nth++;
        }
        if (nth != 1) selector += ":nth-of-type("+nth+")";
      }
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
    if (sessionStorage.getItem('zen_mode_url') === window.location.href) {
      const selector = sessionStorage.getItem('zen_mode_selector');
      if (selector) {
        let attempts = 0;
        let restoreInterval = setInterval(() => {
          try {
            const target = document.querySelector(selector);
            if (target) {
              clearInterval(restoreInterval);
              isolateElement(target, true);
            }
          } catch (e) {} // In case of weird selectors
          
          attempts++;
          if (attempts > 15) clearInterval(restoreInterval); // Give up after ~7.5 seconds
        }, 500);
      }
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    tryRestoreZenMode();
  } else {
    window.addEventListener('load', tryRestoreZenMode);
  }

  document.addEventListener('mouseover', (e) => {
    window.zenCurrentHover = e.target;
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
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.isComposing) return;

    // Exit on Q or Escape
    if (e.key.toLowerCase() === 'q' || e.key === 'Escape') {
      if (window.zenIsActive || window.zenIsSelecting) {
        resetZenMode();
      }
    }

    // Undo the last deletion with Ctrl+Z or Cmd+Z
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && window.zenIsActive) {
      if (window.zenDeletedStack.length > 0) {
        let lastDeleted = window.zenDeletedStack.pop();
        if (lastDeleted) lastDeleted.classList.remove('zen-hidden');
      }
      return; // prevent default browser undo behavior if any
    }

    // Delete hovered element with D or X
    if ((e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'x') && window.zenIsActive && window.zenCurrentHover) {
      if (window.zenCurrentHover !== document.body && 
          window.zenCurrentHover !== document.documentElement &&
          window.zenCurrentHover.id !== 'zen-snipper-reset') {
        window.zenCurrentHover.classList.add('zen-hidden');
        window.zenDeletedStack.push(window.zenCurrentHover); // Save it to the stack
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

  function handleMouseOver(e) {
    if (!window.zenIsSelecting) return;
    e.stopPropagation();
    e.target.classList.add('zen-snipper-hover');
  }

  function handleMouseOut(e) {
    if (!window.zenIsSelecting) return;
    e.stopPropagation();
    e.target.classList.remove('zen-snipper-hover');
  }

  function handleClick(e) {
    if (!window.zenIsSelecting) return;
    e.preventDefault();
    e.stopPropagation();
    
    e.target.classList.remove('zen-snipper-hover');
    isolateElement(e.target);
  }

  function startSelection() {
    window.zenIsSelecting = true;
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    
    console.log("Zen Snipper: Hover and click a block to isolate.");
  }

  function stopSelectionEvents() {
    window.zenIsSelecting = false;
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);
    
    // Clean up any stray hovers
    document.querySelectorAll('.zen-snipper-hover').forEach(el => {
      el.classList.remove('zen-snipper-hover');
    });
  }

  function isolateElement(target, isRestoring = false) {
    stopSelectionEvents();
    window.zenIsActive = true;

    if (!isRestoring) {
      sessionStorage.setItem('zen_mode_url', window.location.href);
      sessionStorage.setItem('zen_mode_selector', getCssPath(target));
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

    document.body.appendChild(menu);

    // Restore timer if it was active
    if (localStorage.getItem('zen_timer_active') === 'true') {
      createTimerUI();
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

    sessionStorage.removeItem('zen_mode_url');
    sessionStorage.removeItem('zen_mode_selector');

    document.body.classList.remove('zen-snipper-active', 'zen-theme-dark', 'zen-theme-midnight', 'zen-theme-paper', 'zen-theme-hacker');
    
    const hiddenElements = document.querySelectorAll('.zen-hidden');
    hiddenElements.forEach(el => el.classList.remove('zen-hidden'));
    
    const isolated = document.querySelectorAll('.zen-isolated-element');
    isolated.forEach(el => el.classList.remove('zen-isolated-element'));
    
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
    if (zenTimerInterval) clearInterval(zenTimerInterval);
    zenTimerInterval = null;
  }
}
