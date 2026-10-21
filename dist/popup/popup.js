const DEFAULTS = {
  theme: "auto",
  watermark: true,
  showMetrics: true,
  // Font names in fallback order; X's own stack always comes last.
  fontFamily: [],
  cardWidth: 598
};
const I18N = globalThis.XShareI18n;

const themeButtons = [...document.querySelectorAll("[data-theme]")];
const watermark = document.querySelector("#watermark");
const showMetrics = document.querySelector("#show-metrics");
const fontCombo = globalThis.XShareFontCombobox.mount(document.querySelector("#font-field"), {
  defaultLabel: "Default",
  onChange(names) {
    currentFonts = names;
    save({ fontFamily: names });
  }
});
const openX = document.querySelector("#open-x");

let locale = I18N.FALLBACK;
let currentFonts = [];
// Installed font family names from the service worker.
let localFonts = null;

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

function localize(current) {
  locale = current;
  document.documentElement.lang = locale;
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = I18N.translate(locale, node.dataset.i18n);
  }
  for (const node of document.querySelectorAll("[data-i18n-aria-label]")) {
    node.setAttribute("aria-label", I18N.translate(locale, node.dataset.i18nAriaLabel));
  }
  for (const node of document.querySelectorAll("[data-i18n-placeholder]")) {
    node.placeholder = I18N.translate(locale, node.dataset.i18nPlaceholder);
  }
  fontCombo.setLabels({
    defaultLabel: I18N.translate(locale, "fontDefault"),
    ariaLabel: I18N.translate(locale, "font"),
    placeholder: I18N.translate(locale, "fontSearch")
  });
}

// Installed font family names only — chrome.fontSettings exposes the OS font
// list, not any page or browsing data.
async function readLocalFonts() {
  try {
    const response = await chrome.runtime.sendMessage({ type: "XSHARE_FONTS" });
    if (!response?.ok || !Array.isArray(response.localFonts)) {
      console.warn("[XShare] font list:", response?.error || "no response");
      return null;
    }
    return response.localFonts;
  } catch (error) {
    console.warn("[XShare]", error);
    return null;
  }
}

async function init() {
  localize(await detectLocale());
  const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
  paintTheme(settings.theme);
  // Set the toggles before awaiting the font list, which can take a moment.
  watermark.checked = Boolean(settings.watermark);
  showMetrics.checked = Boolean(settings.showMetrics);
  currentFonts = globalThis.XShareFontCombobox.normalizeFonts(settings.fontFamily);
  fontCombo.setValue(currentFonts);
  localFonts = (await readLocalFonts()) || [];
  fontCombo.setFonts(localFonts);
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
