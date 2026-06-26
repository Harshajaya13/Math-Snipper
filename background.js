chrome.action.onClicked.addListener((tab) => {
  // First, we inject the CSS
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["content.css"]
  }).then(() => {
    // Then we inject the JS
    return chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  }).then(() => {
    // Finally, send the message to toggle the mode
    chrome.tabs.sendMessage(tab.id, { action: "toggle_zen_mode" });
  }).catch((err) => console.error("Injection failed: ", err));
});
