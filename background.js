const DEFAULTS = {
  theme: "auto",
  watermark: true,
  showMetrics: true
};

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  await chrome.storage.sync.set(stored);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "XSHARE_DOWNLOAD" || !message.dataUrl) {
    return false;
  }

  chrome.downloads.download(
    {
      url: message.dataUrl,
      filename: message.filename || "xshare-post.png",
      saveAs: false,
      conflictAction: "uniquify"
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ ok: true, downloadId });
    }
  );

  return true;
});
