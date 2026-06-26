// Prevent double initialization if script is injected multiple times
if (typeof window.zenIsActive === 'undefined') {
  window.zenIsActive = false;
  window.zenIsSelecting = false;
  window.zenCurrentHover = null;

  document.addEventListener('mouseover', (e) => {
    window.zenCurrentHover = e.target;
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.isComposing) return;

    if (e.key.toLowerCase() === 'q' || e.key === 'Escape') {
      if (window.zenIsActive || window.zenIsSelecting) {
        resetZenMode();
      }
    }

    if ((e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'x') && window.zenIsActive && window.zenCurrentHover) {
      if (window.zenCurrentHover !== document.body && 
          window.zenCurrentHover !== document.documentElement &&
          window.zenCurrentHover.id !== 'zen-snipper-reset') {
        window.zenCurrentHover.classList.add('zen-hidden');
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

  function isolateElement(target) {
    stopSelectionEvents();
    window.zenIsActive = true;

    let toHide = [];
    let current = target;
    
    // Walk up the DOM tree to the body
    while (current && current !== document.body && current !== document.documentElement) {
      let parent = current.parentElement;
      if (parent) {
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

    document.body.classList.remove('zen-snipper-active');
    
    const hiddenElements = document.querySelectorAll('.zen-hidden');
    hiddenElements.forEach(el => el.classList.remove('zen-hidden'));
    
    const isolated = document.querySelectorAll('.zen-isolated-element');
    isolated.forEach(el => el.classList.remove('zen-isolated-element'));

    const btn = document.getElementById('zen-snipper-reset');
    if (btn) btn.remove();
  }
}
