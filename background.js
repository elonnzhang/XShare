const DEFAULTS = {
  theme: "auto",
  watermark: true,
  showMetrics: true,
  // Font names in fallback order; X's own stack always comes last.
  fontFamily: []
};

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  await chrome.storage.sync.set(stored);
});

// Extension pages, or XShare's content script on X. `sender.origin` has no
// trailing slash (e.g. "https://x.com"), so match the parsed hostname.
function isTrustedSender(sender) {
  if (sender.id !== chrome.runtime.id) return false;
  if (sender.url?.startsWith(chrome.runtime.getURL(""))) return true;
  try {
    const { protocol, hostname } = new URL(sender.url || sender.origin || "");
    return protocol === "https:" && /^(?:www\.)?(?:x|twitter)\.com$/.test(hostname);
  } catch {
    return false;
  }
}

// The callback form works on every Chrome that ships fontSettings.
function getFontList() {
  return new Promise((resolve, reject) => {
    chrome.fontSettings.getFontList((fonts) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(fonts || []);
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Installed font family names for the card font picker. Only names leave the
  // OS call — no font files, no page data. Reachable from extension pages and
  // XShare's own content scripts only.
  if (message?.type === "XSHARE_FONTS") {
    if (!isTrustedSender(sender)) {
      sendResponse({ ok: false, error: "Untrusted sender" });
      return false;
    }
    getFontList()
      .then((fonts) => {
        const names = new Set();
        for (const font of fonts) {
          if (font.fontId) names.add(font.fontId.trim());
        }
        const localFonts = [...names].filter(Boolean).sort((a, b) => a.localeCompare(b));
        return chrome.storage.local
          .set({ localFonts })
          .then(() => sendResponse({ ok: true, localFonts }));
      })
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

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
