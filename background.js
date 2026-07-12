chrome.action.onClicked.addListener((tab) => {
  // Check if current tab is a PDF URL or file:// URL
  const isPdf = tab.url && (tab.url.endsWith(".pdf") || tab.url.includes(".pdf?") || tab.url.startsWith("file://") || tab.url.startsWith("resource://"));

  if (isPdf) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("zen-pdf.html")
    });
    return;
  }

  // Otherwise try injecting into standard webpage
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["content.css"]
  }).then(() => {
    return chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  }).then(() => {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_zen_mode" });
  }).catch((err) => {
    console.warn("Injection failed (opening Zen PDF Studio instead):", err);
    chrome.tabs.create({
      url: chrome.runtime.getURL("zen-pdf.html")
    });
  });
});
