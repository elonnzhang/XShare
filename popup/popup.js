const DEFAULTS = {
  theme: "auto",
  watermark: true,
  showMetrics: true
};
const I18N = globalThis.XShareI18n;

const themeButtons = [...document.querySelectorAll("[data-theme]")];
const watermark = document.querySelector("#watermark");
const showMetrics = document.querySelector("#show-metrics");
const openX = document.querySelector("#open-x");

function paintTheme(theme) {
  for (const button of themeButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.theme === theme));
  }
}

async function save(patch) {
  await chrome.storage.sync.set(patch);
}

// Prefer the language of the X tab in front, then the last X page seen,
// then the browser language.
async function detectLocale() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && /^https:\/\/(?:x|twitter)\.com\//.test(tab.url || "")) {
      const response = await chrome.tabs.sendMessage(tab.id, { type: "XSHARE_LOCALE" });
      if (response?.locale) return I18N.resolveLocale(response.locale);
    }
  } catch {
    // Content script not injected yet (e.g. tab opened before install).
  }
  try {
    const { pageLocale } = await chrome.storage.local.get("pageLocale");
    if (pageLocale) return I18N.resolveLocale(pageLocale);
  } catch {
    // Fall through to the browser language.
  }
  return I18N.resolveLocale(navigator.language);
}

function localize(locale) {
  document.documentElement.lang = locale;
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = I18N.translate(locale, node.dataset.i18n);
  }
  for (const node of document.querySelectorAll("[data-i18n-aria-label]")) {
    node.setAttribute("aria-label", I18N.translate(locale, node.dataset.i18nAriaLabel));
  }
}

async function init() {
  localize(await detectLocale());
  const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
  paintTheme(settings.theme);
  watermark.checked = Boolean(settings.watermark);
  showMetrics.checked = Boolean(settings.showMetrics);
}

for (const button of themeButtons) {
  button.addEventListener("click", async () => {
    paintTheme(button.dataset.theme);
    await save({ theme: button.dataset.theme });
  });
}

watermark.addEventListener("change", () => save({ watermark: watermark.checked }));
showMetrics.addEventListener("change", () => save({ showMetrics: showMetrics.checked }));

openX.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://x.com/home" });
});

init();
