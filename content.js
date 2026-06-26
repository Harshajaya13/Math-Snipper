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

  // Restore state on load
  window.addEventListener('load', () => {
    if (sessionStorage.getItem('zen_mode_url') === window.location.href) {
      const selector = sessionStorage.getItem('zen_mode_selector');
      if (selector) {
        const target = document.querySelector(selector);
        if (target) {
          isolateElement(target, true);
        }
      }
    }
  });

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
    target.classList.add('zen-isolated-element');

    createResetButton();
  }

  function createResetButton() {
    if (document.getElementById('zen-snipper-reset')) return;
    const btn = document.createElement('button');
    btn.id = 'zen-snipper-reset';
    btn.innerText = 'Exit Zen Mode';
    btn.onclick = resetZenMode;
    document.body.appendChild(btn);
  }

  function resetZenMode() {
    window.zenIsActive = false;
    window.zenIsSelecting = false;
    stopSelectionEvents();

    sessionStorage.removeItem('zen_mode_url');
    sessionStorage.removeItem('zen_mode_selector');

    document.body.classList.remove('zen-snipper-active');
    
    const hiddenElements = document.querySelectorAll('.zen-hidden');
    hiddenElements.forEach(el => el.classList.remove('zen-hidden'));
    
    const isolated = document.querySelectorAll('.zen-isolated-element');
    isolated.forEach(el => el.classList.remove('zen-isolated-element'));
    
    const noBg = document.querySelectorAll('.zen-no-bg');
    noBg.forEach(el => el.classList.remove('zen-no-bg'));

    const btn = document.getElementById('zen-snipper-reset');
    if (btn) btn.remove();
  }
}
