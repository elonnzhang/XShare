(() => {
  "use strict";

  const CONTENT_VERSION = "1.3.0";
  if (window.__xshareLoaded === CONTENT_VERSION) return;
  window.__xshareLoaded = CONTENT_VERSION;

  const DEFAULT_SETTINGS = {
    theme: "auto",
    watermark: true,
    showMetrics: true
  };
  const ROOT_ID = "xshare-overlay-root";
  const I18N = globalThis.XShareI18n;
  // X UI strings we match against, across the locales XShare supports.
  const REPLYING_TO_PREFIX_RE =
    /^(?:Replying to|回复|回覆|返信先|답글 대상|En respuesta a|En réponse à|Antwort an|Em resposta a|В ответ)/i;
  const REPLYING_TO_RE = new RegExp(`${REPLYING_TO_PREFIX_RE.source}\\s*:?\\s*@`, "i");
  const SHOW_MORE_RE =
    /^(?:Show more|显示更多|顯示更多|さらに表示|더 보기|Mostrar más|Afficher plus|Mehr anzeigen|Mostrar mais|Показать ещё|Показать еще)$/i;
  const VERIFIED_SELECTOR = [
    '[data-testid="icon-verified"]',
    '[aria-label*="Verified"]',
    '[aria-label*="认证"]',
    '[aria-label*="認證"]',
    '[aria-label*="認証"]',
    '[aria-label*="인증"]',
    '[aria-label*="erificad"]',
    '[aria-label*="érifié"]',
    '[aria-label*="erifiziert"]',
    '[aria-label*="одтвержд"]'
  ].join(", ");
  const SHARE_MENU_RE =
    /send via chat|copy link|share post via|通过聊天发送|复制链接|分享帖子|透過聊天傳送|複製連結|リンクをコピー|링크 복사|Copiar enlace|Copier le lien|Link kopieren|Copiar link|Копировать ссылку/i;
  const VIEWS_RE = /浏览量|觀看次數|views?|表示|조회수|visualizaciones|vues|Aufrufe|visualizações|просмотр/i;
  const CARD_WIDTH = 598;
  const CARD_PADDING = 16;
  const AVATAR_SIZE = 40;
  const AVATAR_GAP = 4;
  const CONTENT_LEFT = CARD_PADDING + AVATAR_SIZE + AVATAR_GAP;
  const FONT_FAMILY =
    'TwitterChirp, -apple-system, "system-ui", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const ACCENT = "#1d9bf0";
  const COLORS = {
    light: {
      surface: "#ffffff",
      text: "#0f1419",
      muted: "#536471",
      line: "#eff3f4",
      media: "#f7f9f9",
      quoteBorder: "#cfd9de"
    },
    dark: {
      surface: "#000000",
      text: "#e7e9ea",
      muted: "#8b98a5",
      line: "#2f3336",
      media: "#16181c",
      quoteBorder: "#3a424b"
    }
  };
  // Paths captured from X's own rendered SVGs. Keep these in sync with X
  // instead of approximating the interaction icons with hand-drawn shapes.
  const X_ICON_PATHS = {
    comment:
      "M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z",
    repost:
      "M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z",
    like:
      "M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z",
    bookmark:
      "M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z",
    views:
      "M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z",
    share:
      "M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z",
    verified:
      "M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
  };

  let activeArticle = null;
  let activeShareButton = null;
  let overlay = null;
  let rendered = null;
  let settings = { ...DEFAULT_SETTINGS };
  let menuObserver = null;
  let scanFrame = 0;
  let toastTimer = 0;
  let lastFocusedElement = null;
  let shareClickedAt = 0;

  const pause = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

  // Locale follows the X page language (<html lang>), re-read on each use so
  // switching X's display language takes effect without reinstalling.
  function currentLocale() {
    return I18N.resolveLocale(I18N.pageLanguageTag(document));
  }

  function t(key, params) {
    return I18N.translate(currentLocale(), key, params);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeUrl(url) {
    if (!url) return "";
    try {
      return new URL(url, location.href).href;
    } catch {
      return url;
    }
  }

  function initials(name) {
    const clean = String(name || "X").trim();
    return [...clean].slice(0, 1).join("").toUpperCase() || "X";
  }

  function getStatusUrl(article) {
    const links = [...article.querySelectorAll('a[href*="/status/"]')];
    const statusLink = links.find((link) => /\/status\/\d+(?:[?#]|$)/.test(link.href));
    return statusLink?.href || location.href;
  }

  function readMetrics(article) {
    const group = article.querySelector('[role="group"][aria-label*="replies"]');
    const rawLabel = group?.getAttribute("aria-label") || "";

    // X began rolling out its 2026 React UI to a subset of accounts. It keeps
    // the same article element but drops the long-standing data-testid hooks.
    if (!group) {
      const metricText = (action) =>
        article
          .querySelector(`[data-engagement-action="${action}"]`)
          ?.querySelector(".tabular-nums")
          ?.textContent?.trim() || "";
      const viewsLink = [...article.querySelectorAll('a[href*="/status/"]')].find((link) =>
        VIEWS_RE.test(link.textContent)
      );
      const views = viewsLink?.textContent
        ?.match(new RegExp(`([\\d.,]+\\s?[万萬亿億KMB]?)\\s*(?:${VIEWS_RE.source})`, "i"))?.[1]
        ?.trim();
      return {
        replies: metricText("reply"),
        reposts: metricText("retweet"),
        likes: metricText("like"),
        bookmarks: metricText("bookmark"),
        views: views || ""
      };
    }

    const read = (key) => {
      const match = rawLabel.match(
        new RegExp(`([\\d,.]+)\\s+${key}`, "i")
      );
      return match?.[1] || "";
    };
    const buttonMetric = (testId) =>
      article
        .querySelector(`[data-testid="${testId}"] [data-testid="app-text-transition-container"]`)
        ?.textContent?.trim() || "";
    const views =
      article
        .querySelector('a[href$="/analytics"] [data-testid="app-text-transition-container"]')
        ?.textContent?.trim() || "";
    const firstViewMatch = rawLabel.match(/([\d,.]+)\s+views?/i);

    return {
      replies: read("repl(?:y|ies)") || buttonMetric("reply"),
      reposts: read("reposts?") || buttonMetric("retweet"),
      likes: read("likes?") || buttonMetric("like"),
      bookmarks: buttonMetric("bookmark"),
      views: views || firstViewMatch?.[1] || ""
    };
  }

  function isVisible(element) {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0;
  }

  function readAuthor(article) {
    const userName = article.querySelector('[data-testid="User-Name"]');
    if (!userName) {
      const header = article.querySelector(".text-body.font-bold, a[href^='/'] .text-body");
      const name = header?.textContent?.trim() || "X";
      const text = article.innerText;
      const handle = text.match(/@[A-Za-z0-9_]+/)?.[0] || "";
      const verified = Boolean(article.querySelector(VERIFIED_SELECTOR));
      return { name, handle, verified };
    }

    const profileLinks = [...userName.querySelectorAll('a[href^="/"]')];
    const nameLink = profileLinks.find((link) => !link.textContent.trim().startsWith("@"));
    const handleLink = profileLinks.find((link) => link.textContent.trim().startsWith("@"));
    const name =
      nameLink?.textContent?.trim() ||
      userName.querySelector("span")?.textContent?.trim() ||
      "X";
    const handle = handleLink?.textContent?.trim() || "";
    const verified = Boolean(userName.querySelector('[data-testid="icon-verified"]'));
    return { name, handle, verified };
  }

  function extractRichText(root) {
    if (!root) return "";
    const clone = root.cloneNode(true);
    clone.querySelectorAll("br").forEach((node) => node.replaceWith("\n"));
    clone.querySelectorAll("img[alt]").forEach((node) => {
      const alt = node.getAttribute("alt")?.trim();
      if (alt && !/^(image|square profile picture|profile picture)$/i.test(alt)) {
        node.replaceWith(document.createTextNode(alt));
      }
    });
    return clone.textContent
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function readAvatar(article) {
    const image = article.querySelector(
      '[data-testid="Tweet-User-Avatar"] img[src], [data-testid="UserAvatar-Container"] img[src]'
    ) || article.querySelector('a[href^="/"] img.x-avatar, a[href^="/"] img[alt^="@"]');
    if (image?.src) return normalizeUrl(image.src);
    const bg = article.querySelector('[data-testid="Tweet-User-Avatar"] [style*="background-image"]');
    const match = bg?.style?.backgroundImage?.match(/url\(["']?([^"')]+)["']?\)/);
    return normalizeUrl(match?.[1] || "");
  }

  function readMedia(article) {
    const tweetText =
      article.querySelector('[data-testid="tweetText"]') ||
      [...article.querySelectorAll("div[dir='auto']")].find(
        (node) => node.textContent.trim() && !node.querySelector("time")
      );
    const cards = [];
    const seen = new Set();
    const isInsideText = (node) => Boolean(tweetText?.contains(node));
    const isInsideCard = (node) => Boolean(node.closest('[data-testid="card.wrapper"]'));
    const isInsideQuote = (node) => {
      const wrapper = node.closest('div[role="link"]');
      return Boolean(wrapper && wrapper !== article && wrapper.querySelector('[data-testid="tweetText"]'));
    };

    const photos = article.querySelectorAll(
      '[data-testid="tweetPhoto"] img[src], a[href*="/photo/"] img[src]'
    );
    for (const image of photos) {
      if (
        isInsideText(image) ||
        isInsideCard(image) ||
        isInsideQuote(image) ||
        !isVisible(image)
      ) {
        continue;
      }
      const src = normalizeUrl(image.currentSrc || image.src);
      if (!src || seen.has(src)) continue;
      seen.add(src);
      cards.push({
        type: "photo",
        src,
        alt: image.alt || "Post image",
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1
      });
    }

    const videos = article.querySelectorAll('[data-testid="videoPlayer"], [data-testid="videoComponent"]');
    for (const player of videos) {
      if (isInsideQuote(player)) continue;
      const poster = player.querySelector('video[poster], img[src*="amplify_video_thumb"]');
      const src = poster?.currentSrc || poster?.src || poster?.poster;
      if (!src || seen.has(src)) continue;
      seen.add(src);
      cards.push({
        type: "video",
        src: normalizeUrl(src),
        alt: "Video thumbnail",
        width: poster?.naturalWidth || 16,
        height: poster?.naturalHeight || 9
      });
    }

    if (!cards.length) {
      const gif = article.querySelector(
        '[data-testid="tweetPhoto"] img[src*="tweet_video_thumb"], img[src*="tweet_video_thumb"]'
      );
      if (gif?.src) {
        cards.push({
          type: "gif",
          src: normalizeUrl(gif.src),
          alt: "GIF",
          width: gif.naturalWidth || 16,
          height: gif.naturalHeight || 9
        });
      }
    }

    if (!cards.length) {
      const linkPreview = article.querySelector('[data-testid="card.wrapper"]');
      const image = linkPreview?.querySelector('img[src]');
      if (image?.src && isVisible(image)) {
        const text = linkPreview.innerText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        cards.push({
          type: "link",
          src: normalizeUrl(image.src),
          alt: image.alt || "Link preview",
          width: image.naturalWidth || 16,
          height: image.naturalHeight || 9,
          title: text[0] || "",
          description: text.slice(1, 3).join(" "),
          domain: linkPreview.querySelector("span")?.textContent?.trim() || new URL(getStatusUrl(article)).hostname
        });
      }
    }

    return cards.slice(0, 4);
  }

  function readQuoted(article) {
    const textNodes = [...article.querySelectorAll('[data-testid="tweetText"]')];
    let quoted =
      textNodes.length > 1
        ? textNodes
            .find((node) => node !== textNodes[0])
            ?.closest('div[role="link"]') || null
        : null;
    let quotedTextNode = quoted?.querySelector('[data-testid="tweetText"]');

    if (!quotedTextNode) {
      const nested = article.querySelector("article");
      if (nested) {
        quoted = nested;
        quotedTextNode =
          nested.querySelector('[data-testid="tweetText"]') ||
          nested.querySelector('div[dir="auto"]');
      }
    }

    if (!quotedTextNode) {
      // 2026 React UI: reply context is a sibling of the quote body. The
      // article would otherwise be exposed as an inner <article> without
      // data-testid="tweet".
      const replyNode = [...article.querySelectorAll("div")].find(
        (node) =>
          node.children.length === 1 &&
          REPLYING_TO_RE.test(node.textContent.trim())
      );
      const container = replyNode?.parentElement;
      quotedTextNode =
        container?.querySelector("div[dir='auto']") ||
        [...(container?.children || [])].find(
          (node) =>
            node.children.length === 0 && node.textContent.trim().length > 0
        );
      quoted = container;
    }
    if (!quoted || !quotedTextNode) return null;
    const quoteText = extractRichText(quotedTextNode);
    if (!quoteText) return null;
    const quoteHeader =
      quoted.querySelector('[data-testid="User-Name"]') ||
      quoted.querySelector("div.flex.min-w-0.items-center") ||
      quoted.querySelector("div.x-middot-group") ||
      quoted;
    const userNameEl = quoted.querySelector('[data-testid="User-Name"]');
    const headerText = (userNameEl || quoteHeader).innerText.trim();
    const explicitName =
      headerText
        .split("\n")
        .map((part) => part.trim())
        .find(
          (part) =>
            part &&
            !part.startsWith("@") &&
            !part.includes("@") &&
            !/^(?:·|\d+(?:h|m|s|d|小时|分钟|天)|Oct \d+|\d{1,2}:\d{2})/i.test(part)
        ) || "";
    const nameCandidates = [...quoteHeader.querySelectorAll("div, span")]
      .filter((node) => {
        const text = node.textContent.trim();
        if (!text || text.startsWith("@")) return false;
        if (/^\d+(?:h|m|s|d|小时|分钟|天)$/.test(text)) return false;
        if (REPLYING_TO_PREFIX_RE.test(text)) return false;
        // The display name's deepest element is a wrapper around a single
        // span. No nested text nodes means this is a leaf candidate.
        return ![...node.children].some((child) => child.textContent.trim());
      })
      .map((node) => node.textContent.trim())
      .filter((text, index, values) => values.indexOf(text) === index)
      .sort((a, b) => a.length - b.length);
    const name = explicitName || nameCandidates[0] || t("quotedPost");
    const image = quoted.querySelector('[data-testid="tweetPhoto"] img[src]');
    const handle = [...quoteHeader.querySelectorAll("span")]
      .map((node) => node.textContent.trim())
      .find((value) => /^@[A-Za-z0-9_]+$/.test(value)) || "";
    const verified = Boolean(
      quoted.querySelector(VERIFIED_SELECTOR)
    );
    const avatar = readAvatar(quoteHeader) || readAvatar(quoted);
    const replyTo = [...quoted.querySelectorAll("div")]
      .map((node) => node.textContent.trim())
      .find((value) => REPLYING_TO_RE.test(value))
      ?.match(/@[A-Za-z0-9_]+/)?.[0] || "";
    const quotedTime = quoted.querySelector("time")?.textContent?.trim() || "";
    const quotedDate =
      [...quoted.querySelectorAll("span, a, div")]
        .filter((node) => node.children.length === 0)
        .map((node) => node.textContent.trim())
        .find((value) =>
          value.length <= 12 &&
          /^(?:\d+h|\d+m|\d+s|\d+d|\d+\s*(?:小时|分钟|天)|(?:AM|PM|上午|下午)|\d{1,2}:\d{2})/i.test(value)
        ) || "";
    return {
      text: quoteText,
      author: name,
      handle,
      verified,
      avatar,
      replyTo,
      time: quotedTime || quotedDate,
      image: image?.src ? normalizeUrl(image.src) : ""
    };
  }

  function readPost(article) {
    const author = readAuthor(article);
    const detailLayout = isPostDetailPage(article);
    const replyContainer = [
      ...article.querySelectorAll("div"),
    ].find((node) => {
      if (node.children.length !== 3) return false;
      const reply = [...node.children].some(
        (child) =>
          child.children.length === 1 &&
          REPLYING_TO_RE.test(child.textContent.trim())
      );
      return reply;
    });
    const textNode =
      article.querySelector('[data-testid="tweetText"]') ||
      [...article.querySelectorAll("div")].find(
        (node) =>
          node.children.length === 1 &&
          node.querySelector("span") &&
          /text-lead font-normal text-primary/.test(node.className || "") &&
          !replyContainer?.contains(node)
      ) ||
      [...article.querySelectorAll("div[dir='auto']")].find(
        (node) =>
          node.textContent.trim() &&
          !replyContainer?.contains(node) &&
          !node.closest('div[role="link"]')
      ) ||
      [...article.querySelectorAll("div")]
        .filter(
          (node) =>
            node.children.length === 0 &&
            node.textContent.trim() &&
            !node.closest('div[role="link"]')
        )
        .sort((a, b) => b.textContent.length - a.textContent.length)[0];
    const text = extractRichText(textNode);
    const quoted = readQuoted(article);
    const quotedText =
      quoted?.text ||
      (article.querySelector("article")
        ? extractRichText(article.querySelector("article").querySelector('div[dir="auto"]'))
        : "");
    const allTimes = [...article.querySelectorAll("time")];
    const topLevelTime = detailLayout
      ? allTimes[allTimes.length - 1]
      : allTimes.find(
          (node) =>
            !node.closest('div[role="link"]') &&
            !node.closest("article article") &&
            !node.closest('[data-testid="Quote"]') &&
            !(quotedText && node.textContent.trim() === quoted?.time)
        ) || allTimes[0];
    const topLevelLinks = [...article.querySelectorAll("a")].filter(
      (link) =>
        !link.closest('div[role="link"]') &&
        !link.closest("article article") &&
        !(quotedText && link.textContent.trim() === quoted?.time)
    );
    const relativeTime =
      topLevelTime?.textContent?.trim() ||
      topLevelLinks
        .map((link) => link.textContent.trim())
        .find((value) => /^\d+\s*(?:h|m|s|d)$|^\d+\s*(?:小时|分钟|天)$/i.test(value)) ||
      "";
    const detailTime =
      topLevelLinks
        .map((link) => link.textContent.trim())
        .find((value) => /^\d{1,2}:\d{2}(?:\s*(?:AM|PM))?.*\d{4}/i.test(value)) || "";
    const time = topLevelTime || null;
    const timestamp = time?.getAttribute("datetime") || "";
    const timeLink = topLevelLinks.find((link) =>
      /(?:AM|PM|上午|下午|\d{1,2}:\d{2}).*(?:\d{4}|年)/i.test(link.textContent.trim())
    );
    const rawTime = time?.textContent?.trim() || timeLink?.textContent?.trim() || "";
    const displayDate = detailTime || (timestamp ? formatPostTime(timestamp, rawTime) : rawTime);
    const url = getStatusUrl(article);
    const statusId = url.match(/\/status\/(\d+)/)?.[1] || "";

    return {
      author,
      text,
      timestamp,
      displayDate,
      relativeTime,
      url,
      statusId,
      avatar: readAvatar(article),
      media: readMedia(article),
      quoted,
      metrics: readMetrics(article),
      mode: detailLayout ? "detail" : "timeline",
      isDark: isDarkPage()
    };
  }

  function isPostDetailPage(article) {
    if (!article) return false;
    if (!/^\/(?:[^/]+\/)?status\/\d+/.test(location.pathname)) return false;
    const articles = [...document.querySelectorAll("article")];
    if (articles.length > 1) return article === articles[0];
    return Boolean(
      article.querySelector('button[aria-label*="Follow"]') ||
        article.closest('[data-testid="primaryColumn"]')?.querySelector('[role="heading"]')
    );
  }

  function formatPostTime(timestamp, relativeText) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return relativeText || "";
    const locale = currentLocale();
    if (locale === "en") {
      const clock = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }).format(date);
      const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
      return `${clock} · ${day}, ${date.getFullYear()}`;
    }
    const clock = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);
    // CJK layouts on X put the date first, e.g. "2026年10月20日 15:45".
    if (/^(?:zh|ja|ko)/.test(locale)) {
      const day = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
      return `${day} ${clock}`;
    }
    const day = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
    return `${clock} · ${day}`;
  }

  function isDarkPage() {
    const probe = document.querySelector(
      'article[data-testid="tweet"] [data-testid="tweetText"], main'
    );
    const color = getComputedStyle(probe || document.body).color;
    const match = color.match(/\d+/g)?.map(Number) || [];
    if (match.length >= 3) {
      return (match[0] + match[1] + match[2]) / 3 > 150;
    }
    return matchMedia("(prefers-color-scheme: dark)").matches;
  }

  // X ships three display themes: Default (white), Dim (navy) and Lights out
  // (black). Read the page background so the modal matches the active one.
  function detectPageTheme() {
    const backgrounds = [document.body, document.documentElement]
      .map((node) => node && getComputedStyle(node).backgroundColor)
      .filter((value) => value && !/rgba?\(0, 0, 0, 0\)|transparent/.test(value));
    const rgb = backgrounds[0]?.match(/\d+/g)?.map(Number);
    if (rgb && rgb.length >= 3) {
      const [r, g, b] = rgb;
      if ((r + g + b) / 3 > 128) return "light";
      // Dim is #15202b; Lights out is #000000.
      return b - r > 12 ? "dim" : "dark";
    }
    return isDarkPage() ? "dark" : "light";
  }

  async function expandLongPost(article) {
    for (let pass = 0; pass < 4; pass += 1) {
      const showMore =
        article.querySelector('button[data-testid="tweet-text-show-more-link"]') ||
        [...article.querySelectorAll("button")].find((button) =>
          SHOW_MORE_RE.test(button.textContent.trim())
        );
      if (!showMore) break;
      showMore.click();
      await pause(220);
    }
  }

  function findArticleForShareButton(button) {
    return button?.closest("article") || activeArticle;
  }

  function styleShareMenu(menu, item) {
    if (!item) return;
    const dark = isDarkPage();
    item.classList.toggle("xshare-menu-item--dark", dark);
    item.setAttribute("role", "menuitem");
    item.setAttribute("tabindex", "0");
  }

  function injectMenuItem(menu) {
    if (!menu || menu.querySelector("[data-xshare-menu-item]")) return;
    if (!menu.querySelector('[role="menuitem"]')) return;

    const item = document.createElement("div");
    item.className = "xshare-menu-item";
    item.dataset.xshareMenuItem = "true";
    item.innerHTML = `
      <div class="xshare-menu-item__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M3 3h18v13H3V3Zm2 2v9h14V5H5Zm2.4 10.6-1.2 1.6V18h2.2l1-1.4h3.2l1 1.4H16v-1.8l-1.2-1.6H7.4ZM19 18h2v2h-5l1-2h2Zm-9 2h4l-1-2h-2l-1 2Z"></path>
        </svg>
      </div>
      <div class="xshare-menu-item__body">
        <span class="xshare-menu-item__label">${escapeHtml(t("shareLabel"))}</span>
      </div>
    `;

    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const article = activeArticle || findArticleForShareButton(activeShareButton);
      if (!article) {
        showToast(t("postNotFound"), "error");
        return;
      }
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
      );
      openPreview(article);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        item.click();
      }
    });

    const existingItem = menu.querySelector('[role="menuitem"]');
    const list = existingItem?.parentElement || menu;
    list.appendChild(item);
    styleShareMenu(menu, item);
  }

  function scanMenus() {
    const menus = document.querySelectorAll('[role="menu"]');
    for (const menu of menus) {
      if (!menu.querySelector('[role="menuitem"]')) continue;
      // A menu that opens right after a share-button click is the share menu
      // in any language; the text match covers keyboard-opened menus.
      const fromShareClick = Date.now() - shareClickedAt < 3000;
      const isShareMenu =
        fromShareClick ||
        [...menu.querySelectorAll('[role="menuitem"]')].some((node) =>
          SHARE_MENU_RE.test(node.textContent)
        );
      if (!isShareMenu) continue;
      injectMenuItem(menu);
      // Only the first menu after a share click may skip the text match.
      if (fromShareClick) shareClickedAt = 0;
    }
  }

  // aria-labels are localized, so also recognize the share button by X's
  // share icon path inside a post.
  function findShareButton(target) {
    const labelled = target.closest(
      'button[aria-label="Share post"], button[aria-label="分享"], button[aria-label="Share"], button[data-engagement-action="share"]'
    );
    if (labelled) return labelled;
    const button = target.closest("button");
    if (!button?.closest("article")) return null;
    const path = button.querySelector("svg path")?.getAttribute("d") || "";
    return path.startsWith(X_ICON_PATHS.share.slice(0, 16)) ? button : null;
  }

  function scheduleScan() {
    if (scanFrame) return;
    scanFrame = requestAnimationFrame(() => {
      scanFrame = 0;
      scanMenus();
    });
  }

  function startMenuWatcher() {
    if (menuObserver) return;
    menuObserver = new MutationObserver(scheduleScan);
    menuObserver.observe(document.body, { childList: true, subtree: true });
    scanMenus();
  }

  document.addEventListener(
    "click",
    (event) => {
      if (event.target.closest("[data-xshare-menu-item]")) return;
      const shareButton = findShareButton(event.target);
      if (!shareButton) return;
      shareClickedAt = Date.now();
      activeShareButton = shareButton;
      activeArticle = shareButton.closest("article");
      scheduleScan();
    },
    true
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && overlay) {
        closeOverlay();
      }
    },
    true
  );

  function createOverlay() {
    const locale = currentLocale();
    if (overlay && overlay.dataset.locale === locale) return overlay;
    if (overlay) {
      // X's display language changed since the overlay was built.
      overlay.remove();
      overlay = null;
    }
    const h = (key) => escapeHtml(I18N.translate(locale, key));
    overlay = document.createElement("div");
    overlay.id = ROOT_ID;
    overlay.dataset.locale = locale;
    overlay.lang = locale;
    overlay.innerHTML = `
      <div class="xshare-modal" role="dialog" aria-modal="true" aria-labelledby="xshare-title">
        <header class="xshare-modal__header">
          <div class="xshare-modal__brand">
            <span class="xshare-logo" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"></path></svg>
            </span>
            <h2 id="xshare-title">${h("shareLabel")}</h2>
          </div>
          <button class="xshare-icon-button" type="button" data-xshare-action="close" aria-label="${h("close")}">
            <svg viewBox="0 0 24 24"><path d="M10.59 12 4.59 6 6 4.59l6 6 6-6L19.41 6l-6 6 6 6L18 19.41l-6-6-6 6L4.59 18l6-6Z"></path></svg>
          </button>
        </header>
        <div class="xshare-modal__body">
          <div class="xshare-preview-pane">
            <div class="xshare-preview-frame">
              <div class="xshare-preview-loading">
                <span class="xshare-spinner"></span>
                <p>${h("rendering")}</p>
              </div>
              <div class="xshare-preview-art"></div>
            </div>
            <div class="xshare-preview-meta">
              <span data-xshare-size>${h("sizePending")}</span>
              <span>${h("exportScale")}</span>
            </div>
          </div>
          <aside class="xshare-controls">
            <div class="xshare-control-group">
              <span class="xshare-control-label">${h("cardTheme")}</span>
              <div class="xshare-segmented" role="group" aria-label="${h("cardTheme")}">
                <button type="button" data-xshare-theme="auto">${h("themeAuto")}</button>
                <button type="button" data-xshare-theme="light">${h("themeLight")}</button>
                <button type="button" data-xshare-theme="dark">${h("themeDark")}</button>
              </div>
            </div>
            <label class="xshare-switch-row">
              <span>
                <strong>${h("watermark")}</strong>
                <small>${h("watermarkHint")}</small>
              </span>
              <input type="checkbox" data-xshare-setting="watermark" />
              <i aria-hidden="true"></i>
            </label>
            <label class="xshare-switch-row">
              <span>
                <strong>${h("metrics")}</strong>
                <small>${h("metricsHint")}</small>
              </span>
              <input type="checkbox" data-xshare-setting="showMetrics" />
              <i aria-hidden="true"></i>
            </label>
            <div class="xshare-divider"></div>
            <p class="xshare-note">
              ${h("localNote")}
            </p>
            <div class="xshare-actions">
              <button class="xshare-button xshare-button--primary" type="button" data-xshare-action="download">
                <svg viewBox="0 0 24 24"><path d="M11 2h2v12.17l4.59-4.58L19 11l-7 7-7-7 1.41-1.41L11 14.17V2Zm-8 18h18v2H3v-2Z"></path></svg>
                ${h("download")}
              </button>
              <button class="xshare-button" type="button" data-xshare-action="copy">
                <svg viewBox="0 0 24 24"><path d="M8 2h13v16h-2V4H8V2ZM3 6h13v16H3V6Zm2 2v12h9V8H5Z"></path></svg>
                ${h("copy")}
              </button>
            </div>
          </aside>
        </div>
      </div>
      <div class="xshare-toast" role="status" aria-live="polite"></div>
      <style>${OVERLAY_STYLES}</style>
    `;
    document.documentElement.appendChild(overlay);
    overlay.addEventListener("click", handleOverlayClick);
    overlay.addEventListener("change", handleOverlayChange);
    return overlay;
  }

  function handleOverlayClick(event) {
    const action = event.target.closest("[data-xshare-action]")?.dataset.xshareAction;
    const themeButton = event.target.closest("[data-xshare-theme]");
    if (themeButton) {
      setSetting("theme", themeButton.dataset.xshareTheme);
      updateThemeControls();
      renderCurrent();
      return;
    }

    if (!action) {
      if (event.target === overlay) closeOverlay();
      return;
    }

    if (action === "close") closeOverlay();
    if (action === "download") downloadRendered();
    if (action === "copy") copyRendered();
  }

  function handleOverlayChange(event) {
    const key = event.target.dataset.xshareSetting;
    if (!key) return;
    setSetting(key, event.target.checked);
    renderCurrent();
  }

  function setSetting(key, value) {
    settings[key] = value;
    Promise.resolve(chrome.storage.sync.set({ [key]: value })).catch(() => {});
  }

  function updateThemeControls() {
    overlay?.querySelectorAll("[data-xshare-theme]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.xshareTheme === settings.theme));
    });
    const watermark = overlay?.querySelector('[data-xshare-setting="watermark"]');
    const metrics = overlay?.querySelector('[data-xshare-setting="showMetrics"]');
    if (watermark) watermark.checked = Boolean(settings.watermark);
    if (metrics) metrics.checked = Boolean(settings.showMetrics);
  }

  async function openPreview(article) {
    lastFocusedElement = document.activeElement;
    createOverlay();
    overlay.querySelector(".xshare-preview-art").replaceChildren();
    overlay.querySelector(".xshare-preview-loading").hidden = false;
    overlay.querySelector("[data-xshare-size]").textContent = t("sizePending");
    updateThemeControls();
    overlay.dataset.xsTheme = detectPageTheme();
    overlay.classList.add("xshare-open");
    document.documentElement.classList.add("xshare-lock-scroll");
    overlay.querySelector('[data-xshare-action="close"]').focus();

    activeArticle = article;
    await expandLongPost(article);
    const post = readPost(article);

    try {
      rendered = await renderCard(post, settings);
      const image = new Image();
      image.className = "xshare-preview-image";
      image.alt = t("imageAlt", { name: post.author.name });
      image.src = rendered.dataUrl;
      overlay.querySelector(".xshare-preview-art").replaceChildren(image);
      overlay.querySelector(".xshare-preview-loading").hidden = true;
      overlay.querySelector("[data-xshare-size]").textContent =
        `PNG · ${rendered.width} × ${rendered.height}`;
    } catch (error) {
      console.error("[XShare]", error);
      overlay.querySelector(".xshare-preview-loading").innerHTML =
        `<p class="xshare-error">${escapeHtml(t("renderFailed", { error: error.message }))}</p>`;
    }
  }

  async function renderCurrent() {
    if (!activeArticle) return;
    try {
      updateThemeControls();
      overlay.querySelector(".xshare-preview-loading").hidden = false;
      rendered = await renderCard(readPost(activeArticle), settings);
      const image = new Image();
      image.className = "xshare-preview-image";
      image.alt = t("imageAlt", { name: rendered.post.author.name });
      image.src = rendered.dataUrl;
      overlay.querySelector(".xshare-preview-art").replaceChildren(image);
      overlay.querySelector(".xshare-preview-loading").hidden = true;
      overlay.querySelector("[data-xshare-size]").textContent =
        `PNG · ${rendered.width} × ${rendered.height}`;
    } catch (error) {
      console.error("[XShare]", error);
      overlay.querySelector(".xshare-preview-loading").hidden = true;
      showToast(t("rerenderFailed", { error: error.message }), "error");
    }
  }

  function closeOverlay() {
    overlay?.classList.remove("xshare-open");
    document.documentElement.classList.remove("xshare-lock-scroll");
    rendered = null;
    lastFocusedElement?.focus?.();
  }

  function showToast(message, tone = "success") {
    createOverlay();
    const toast = overlay.querySelector(".xshare-toast");
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.classList.add("xshare-toast--show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("xshare-toast--show"), 2400);
  }

  async function downloadRendered() {
    if (!rendered) {
      showToast(t("notReady"), "error");
      return;
    }
    const safeHandle = (rendered.post.author.handle || "x")
      .replace(/^@/, "")
      .replace(/[^a-z0-9_-]+/gi, "")
      .slice(0, 30) || "post";
    const filename = `xshare-${safeHandle}-${rendered.post.statusId || Date.now()}.png`;
    const response = await chrome.runtime.sendMessage({
      type: "XSHARE_DOWNLOAD",
      dataUrl: rendered.dataUrl,
      filename
    });
    if (!response?.ok) {
      showToast(response?.error || t("downloadFailed"), "error");
      return;
    }
    showToast(t("downloaded"));
  }

  async function copyRendered() {
    if (!rendered) {
      showToast(t("notReady"), "error");
      return;
    }
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": rendered.blob })
      ]);
      showToast(t("copied"));
    } catch (error) {
      console.error("[XShare]", error);
      showToast(t("copyFailed"), "error");
    }
  }

  async function renderCard(post, currentSettings) {
    const useDark =
      currentSettings.theme === "dark" ||
      (currentSettings.theme === "auto" && post.isDark);
    const colors = useDark ? COLORS.dark : COLORS.light;
    const scale = 2;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error(t("canvasUnsupported"));

    const images = await loadPostImages(post);
    const isDetail = post.mode === "detail";
    const bodyLeft = isDetail ? CARD_PADDING : CONTENT_LEFT;
    const contentWidth = CARD_WIDTH - CARD_PADDING - bodyLeft;
    const nameRow = layoutNameRow(context, post, CARD_WIDTH - CARD_PADDING - CONTENT_LEFT, isDetail);
    context.font = `400 17px ${FONT_FAMILY}`;
    const textLines = wrapText(context, post.text || t("noText"), contentWidth);

    const textTop = isDetail ? 66 : 38;
    const textHeight = textLines.length * 24;
    const mediaBlocks = layoutMedia(images, contentWidth);
    const quoteWidth = isDetail ? CARD_WIDTH - CARD_PADDING * 2 : contentWidth;
    const quoteBlock = post.quoted
      ? layoutQuote(context, post.quoted, quoteWidth, images, !isDetail)
      : null;

    let contentBottom = textTop + textHeight;
    if (mediaBlocks.length) {
      contentBottom += 12 + Math.max(...mediaBlocks.map((block) => block.y + block.height));
    }
    if (quoteBlock) contentBottom += 12 + quoteBlock.height;

    // Timeline keeps the timestamp in the byline. Detail puts it on its own
    // row after the post body, matching X's full-post view.
    const dateTop = isDetail ? contentBottom + 14 : 0;
    const signatureLabel = currentSettings.watermark ? buildSignatureLabel() : "";
    // The signature always sits right-aligned above the metrics row. Detail
    // cards share the timestamp row when both fit, otherwise it wraps below.
    const signatureOnDateRow =
      isDetail && Boolean(signatureLabel) && fitsDateRow(context, post.displayDate, signatureLabel);
    let signatureTop = 0;
    let metricsTop;
    if (isDetail) {
      signatureTop = signatureOnDateRow ? dateTop + 2 : dateTop + 24;
      metricsTop = signatureLabel && !signatureOnDateRow ? dateTop + 48 : dateTop + 28;
    } else {
      signatureTop = contentBottom + 12;
      metricsTop = signatureLabel ? signatureTop + 20 : contentBottom + 12;
    }
    const footerHeight = currentSettings.showMetrics ? 56 : 6;
    const MIN_CARD_HEIGHT = isDetail ? metricsTop + 42 : 126;
    const cardHeight = Math.max(MIN_CARD_HEIGHT, metricsTop + footerHeight);

    canvas.width = CARD_WIDTH * scale;
    canvas.height = cardHeight * scale;
    context.scale(scale, scale);
    context.textBaseline = "top";

    context.fillStyle = colors.surface;
    context.fillRect(0, 0, CARD_WIDTH, cardHeight);

    paintAvatar(context, images.avatar, post, colors);
    paintAuthor(context, nameRow, colors);
    if (isDetail) {
      paintMore(context, colors);
    }

    context.fillStyle = colors.text;
    context.font = `400 17px ${FONT_FAMILY}`;
    let cursorY = textTop;
    for (const line of textLines) {
      if (line) context.fillText(line, bodyLeft, cursorY + 2, contentWidth);
      cursorY += 24;
    }

    if (mediaBlocks.length) {
      cursorY += 12;
      for (const block of mediaBlocks) {
        block.y += cursorY;
        paintMedia(context, block, images, colors, useDark);
      }
      cursorY += Math.max(...mediaBlocks.map((block) => block.y - (textTop + textHeight + 12) + block.height));
    }

    if (quoteBlock) {
      cursorY += 12;
      quoteBlock.y += cursorY;
      if (isDetail) {
        quoteBlock.x = CARD_PADDING;
      }
      paintQuote(context, quoteBlock, colors, images);
      cursorY += quoteBlock.height;
    }

    if (isDetail) {
      context.fillStyle = colors.muted;
      context.font = `400 15px ${FONT_FAMILY}`;
      context.fillText(post.displayDate, CARD_PADDING, dateTop);
    }

    if (currentSettings.showMetrics) {
      paintMetrics(
        context,
        post.metrics,
        colors,
        // Timeline actions start at the body column; detail spans the card.
        isDetail ? CARD_PADDING : CONTENT_LEFT,
        isDetail ? metricsTop + 22 : metricsTop + 10,
        isDetail ? CARD_WIDTH - CARD_PADDING * 2 : contentWidth,
        currentSettings.watermark,
        isDetail
      );
    }

    if (signatureLabel) {
      paintSignature(context, signatureLabel, colors, signatureTop);
    }

    const [dataUrl, blob] = await Promise.all([
      Promise.resolve(canvas.toDataURL("image/png")),
      new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error(t("pngFailed")))),
          "image/png"
        );
      })
    ]);

    return {
      dataUrl,
      blob,
      width: canvas.width,
      height: canvas.height,
      post,
      useDark
    };
  }

  function paintAvatar(context, image, post, colors) {
    const x = CARD_PADDING;
    const y = 12;
    context.save();
    context.beginPath();
    context.arc(x + AVATAR_SIZE / 2, y + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
    context.clip();
    if (image) {
      drawImageCover(context, image, x, y, AVATAR_SIZE, AVATAR_SIZE);
    } else {
      context.fillStyle = ACCENT;
      context.fillRect(x, y, AVATAR_SIZE, AVATAR_SIZE);
      context.fillStyle = "#ffffff";
      context.font = `700 18px ${FONT_FAMILY}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(initials(post.author.name), x + AVATAR_SIZE / 2, y + AVATAR_SIZE / 2);
      context.textAlign = "left";
      context.textBaseline = "top";
    }
    context.restore();

  }

  function layoutNameRow(context, post, maxWidth, detail = false, relative = false) {
    const parts = [];
    let x = 0;
    const add = (type, text, options = {}) => {
      context.font = options.font || `700 15px ${FONT_FAMILY}`;
      const width =
        type === "verified" ? options.size || 18 : context.measureText(text).width;
      parts.push({ type, text, x, width, color: options.color, size: options.size });
      x += width + (options.gap ?? 4);
    };

    // Timeline byline is a single line. Detail stacks handle on a second line.
    add("name", post.author.name, { color: "text", gap: post.author.verified ? 5 : 4 });
    if (post.author.verified) {
      add("verified", "", { size: 17, gap: detail ? 3 : 5 });
    }
    if (detail) {
      add("dot", "·", { font: `400 15px ${FONT_FAMILY}`, color: "muted", gap: 3 });
      return { y: 12, parts, width: x, maxWidth, detail, handle: post.author.handle };
    }
    add("handle", post.author.handle, {
      font: `400 15px ${FONT_FAMILY}`,
      color: "muted",
      gap: 3
    });
    add("dot", "·", { font: `400 15px ${FONT_FAMILY}`, color: "muted", gap: 3 });
    add("time", relative ? post.relativeTime || post.displayDate : post.displayDate, {
      font: `400 15px ${FONT_FAMILY}`,
      color: "muted",
      gap: 0
    });

    return { y: 12, parts, width: x, maxWidth, detail };
  }

  function paintAuthor(context, row, colors) {
    const x = CONTENT_LEFT;
    context.font = `700 15px ${FONT_FAMILY}`;
    context.textBaseline = "top";
    for (const part of row.parts) {
      const partX = x + part.x;
      if (part.type === "verified") {
        paintVerifiedBadge(
          context,
          partX,
          textCenterY(context, `700 15px ${FONT_FAMILY}`, row.y) - part.size / 2,
          part.size
        );
        continue;
      }
      context.fillStyle = colors[part.color] || colors.text;
      context.font =
        part.type === "name" ? `700 15px ${FONT_FAMILY}` : `400 15px ${FONT_FAMILY}`;
      let text = part.text;
      const available = row.maxWidth - part.x;
      if (part.width > available) {
        text = trimText(context, text, available);
      }
      context.fillText(text, partX, row.y, Math.max(1, available));
    }

    if (row.detail) {
      context.fillStyle = colors.muted;
      context.font = `400 15px ${FONT_FAMILY}`;
      context.fillText(row.handle || "", CONTENT_LEFT, row.y + 20);
    }
  }

  function paintMore(context, colors) {
    context.save();
    context.fillStyle = colors.muted;
    context.globalAlpha = 0.92;
    context.font = `400 15px ${FONT_FAMILY}`;
    context.textAlign = "right";
    context.fillText("···", CARD_WIDTH - CARD_PADDING - 1, 10);
    context.restore();
  }

  function paintVerifiedBadge(context, x, y, size) {
    context.save();
    context.translate(x, y);
    context.scale(size / 22, size / 22);
    context.fillStyle = "#1d9bf0";
    context.fill(new Path2D(X_ICON_PATHS.verified));
    context.restore();
  }

  // Center icons on the rendered cap-height band rather than the font box, so
  // badges match X's visual alignment for Latin and CJK display names.
  function textCenterY(context, font, y) {
    context.save();
    context.font = font;
    context.textBaseline = "top";
    const metrics = context.measureText("H");
    context.restore();
    const top = y - (metrics.actualBoundingBoxAscent || 0);
    const baseline = y + (metrics.actualBoundingBoxDescent || 11);
    return (top + baseline) / 2;
  }

  function paintMedia(context, block, images, colors, useDark) {
    const image = images.media.get(block.src);
    const radius = 16;
    context.save();
    roundedRect(context, block.x, block.y, block.width, block.height, radius);
    context.clip();
    context.fillStyle = colors.media;
    context.fillRect(block.x, block.y, block.width, block.height);

    if (image) {
      drawImageCover(context, image, block.x, block.y, block.width, block.height);
    }
    context.restore();

    if (block.type === "video" || block.type === "gif") {
      context.save();
      context.fillStyle = "rgba(0, 0, 0, 0.64)";
      context.beginPath();
      context.arc(block.x + block.width / 2, block.y + block.height / 2, 27, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.moveTo(block.x + block.width / 2 - 7, block.y + block.height / 2 - 11);
      context.lineTo(block.x + block.width / 2 + 12, block.y + block.height / 2);
      context.lineTo(block.x + block.width / 2 - 7, block.y + block.height / 2 + 11);
      context.closePath();
      context.fill();
      context.restore();
    }

    if (block.type === "link" && block.title) {
      const boxHeight = 72;
      const boxY = block.y + block.height - boxHeight;
      context.fillStyle = useDark ? "rgba(22, 24, 28, 0.96)" : "rgba(255, 255, 255, 0.96)";
      context.fillRect(block.x, boxY, block.width, boxHeight);
      context.fillStyle = useDark ? "#8b98a5" : "#536471";
      context.font = `400 13px ${FONT_FAMILY}`;
      context.fillText(block.domain || "", block.x + 12, boxY + 10);
      context.fillStyle = useDark ? "#e7e9ea" : "#0f1419";
      context.font = `400 15px ${FONT_FAMILY}`;
      context.fillText(trimText(context, block.title, block.width - 24), block.x + 12, boxY + 32);
    }

    context.strokeStyle = colors.line;
    context.lineWidth = 1;
    roundedRect(context, block.x, block.y, block.width, block.height, radius);
    context.stroke();
  }

  function paintQuote(context, block, colors, images) {
    if (block.filled) {
      context.fillStyle = colors.media;
      roundedRect(context, block.x, block.y, block.width, block.height, 16);
      context.fill();
    }
    context.strokeStyle = colors.quoteBorder;
    context.lineWidth = 1;
    roundedRect(context, block.x, block.y, block.width, block.height, 16);
    context.stroke();

    const left = block.x + 13;
    const top = block.y + 13;
    const avatarX = left;
    const avatarY = top;
    const avatarSize = 24;
    context.save();
    context.beginPath();
    context.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    context.clip();
    if (block.avatarImage) {
      drawImageCover(context, block.avatarImage, avatarX, avatarY, avatarSize, avatarSize);
    } else {
      context.fillStyle = ACCENT;
      context.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    context.restore();

    let bylineX = avatarX + avatarSize + 8;
    context.fillStyle = colors.text;
    context.font = `700 15px ${FONT_FAMILY}`;
    context.fillText(block.author, bylineX + 4, top + 2);
    bylineX += context.measureText(block.author).width + 7;
    if (block.verified) {
      paintVerifiedBadge(
        context,
        bylineX,
        textCenterY(context, `700 15px ${FONT_FAMILY}`, top + 2) - 17 / 2,
        17
      );
      bylineX += 17;
    }
    context.fillStyle = colors.muted;
    context.font = `400 15px ${FONT_FAMILY}`;
    const handleLabel = `${block.handle || ""}`;
    if (handleLabel) {
      context.fillText(handleLabel, bylineX, top + 2);
      bylineX += context.measureText(handleLabel).width + 3;
      if (block.time && block.filled) {
        context.fillText("·", bylineX, top + 2);
        bylineX += context.measureText("·").width + 3;
        context.fillText(block.time, bylineX, top + 2);
      }
    }
    let y = top + 26;
    if (block.replyTo) {
      const replyPrefix = t("replyingTo");
      context.fillText(replyPrefix, left + 14, y);
      const prefixWidth = context.measureText(replyPrefix).width;
      context.fillStyle = colors.muted;
      context.font = `400 15px ${FONT_FAMILY}`;
      context.fillText(block.replyTo, left + 14 + prefixWidth, y);
      y += 20;
    }

    context.fillStyle = colors.text;
    context.font = `400 15px ${FONT_FAMILY}`;
    for (const line of block.lines) {
      context.fillText(line, left, y, block.width - 26);
      y += 20;
    }

    if (block.image && images.quoteImage) {
      const imageY = y + 2;
      const imageWidth = block.width - 26;
      context.save();
      roundedRect(context, left, imageY, imageWidth, block.imageHeight, 12);
      context.clip();
      drawImageCover(
        context,
        images.quoteImage,
        left,
        imageY,
        imageWidth,
        block.imageHeight
      );
      context.restore();
    }

    context.fillStyle = colors.muted;
    context.font = `400 15px ${FONT_FAMILY}`;
    context.textAlign = "right";
    context.fillText("···", block.x + block.width - 13, top + 2);
    context.textAlign = "left";
  }

  function paintMetrics(context, metrics, colors, x, y, width, showWatermark, detail = false) {
    const entries = [
      ["comment", metrics.replies],
      ["repost", metrics.reposts],
      ["like", metrics.likes],
      // Bookmark (with its count) is only drawn on the full-post view.
      ...(detail ? [["bookmark", metrics.bookmarks]] : []),
      ["views", metrics.views],
      ["share", ""]
    ];
    // Timeline actions span the body column, ending with share at its right edge.
    const step = detail ? width / 6 : (width - 18.75) / (entries.length - 1);
    context.font = `400 13px ${FONT_FAMILY}`;
    // Center the digits' ink box on the icon's center instead of top-aligning.
    const ICON_SIZE = 18.75;
    const iconCenterY = y - 1 + ICON_SIZE / 2;
    context.save();
    context.textBaseline = "alphabetic";
    const digitAscent = context.measureText("0").actualBoundingBoxAscent || 9.5;
    const valueBaseline = iconCenterY + digitAscent / 2;
    entries.forEach(([type, value], index) => {
      const iconX = x + step * index;
      if (type === "share" && !showWatermark) return;
      drawMetricIcon(context, type, iconX, y, colors.muted);
      if (!value) return;
      context.fillStyle = colors.muted;
      context.fillText(value, iconX + 24, valueBaseline);
    });
    context.restore();
  }

  function drawMetricIcon(context, type, x, y, color) {
    context.save();
    context.fillStyle = color;
    const path = X_ICON_PATHS[type];
    if (!path) {
      context.restore();
      return;
    }
    context.translate(x, y - 1);
    context.scale(18.75 / 24, 18.75 / 24);
    context.fill(new Path2D(path));
    context.restore();
  }

  function buildSignatureLabel() {
    const locale = currentLocale();
    const shareTime = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: locale === "en"
    }).format(new Date());
    return `Post on 𝕏 · XShare · ${shareTime}`;
  }

  function fitsDateRow(context, dateText, label) {
    context.save();
    context.font = `400 15px ${FONT_FAMILY}`;
    const dateWidth = context.measureText(dateText || "").width;
    context.font = `400 12px ${FONT_FAMILY}`;
    const labelWidth = context.measureText(label).width;
    context.restore();
    return dateWidth + labelWidth + 24 <= CARD_WIDTH - CARD_PADDING * 2;
  }

  function paintSignature(context, label, colors, y) {
    context.save();
    context.textAlign = "right";
    context.textBaseline = "top";
    context.fillStyle = colors.muted;
    context.globalAlpha = 0.78;
    context.font = `400 12px ${FONT_FAMILY}`;
    context.fillText(label, CARD_WIDTH - CARD_PADDING, Math.max(y, 0));
    context.restore();
  }

  function layoutMedia(images, width) {
    const blocks = [];
    let y = 0;
    const items = [...images.media.values()];
    const count = items.length;
    if (!count) return blocks;

    if (count === 1) {
      const image = items[0];
      const ratio = image.naturalWidth / Math.max(1, image.naturalHeight);
      const height = Math.max(140, Math.min(360, width / Math.max(ratio, 0.5)));
      blocks.push({
        type: postMediaType(images, image.src),
        src: image.src,
        x: CONTENT_LEFT,
        y,
        width,
        height
      });
    } else {
      const gap = 10;
      const columns = count === 2 ? 2 : 2;
      const rows = Math.ceil(count / columns);
      const cellWidth = (width - gap) / columns;
      const cellHeight = Math.min(180, Math.max(120, cellWidth * 0.62));
      items.forEach((image, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        blocks.push({
          type: postMediaType(images, image.src),
          src: image.src,
          x: CONTENT_LEFT + column * (cellWidth + gap),
          y: row * (cellHeight + gap),
          width: cellWidth,
          height: cellHeight
        });
      });
      if (rows > 2) {
        blocks.length = 4;
      }
    }

    return blocks;
  }

  function postMediaType(images, src) {
    return images.types.get(src) || "photo";
  }

  function layoutQuote(context, quote, width, images, filled = false) {
    context.font = `400 15px ${FONT_FAMILY}`;
    const innerWidth = width - 26;
    const lines = wrapText(context, quote.text, innerWidth).slice(0, 6);
    const hasImage = Boolean(quote.image);
    const imageHeight = hasImage ? Math.min(160, width * 0.34) : 0;
    const replyHeight = quote.replyTo ? 20 : 0;
    return {
      x: CONTENT_LEFT,
      y: 0,
      width,
      height:
        13 +
        24 +
        replyHeight +
        lines.length * 20 +
        (hasImage ? imageHeight + 10 : 0) +
        13,
      author: quote.author,
      handle: quote.handle,
      verified: quote.verified,
      avatar: quote.avatar,
      avatarImage: images.quoteAvatar,
      replyTo: quote.replyTo,
      time: quote.time,
      filled,
      lines,
      image: quote.image,
      imageHeight
    };
  }

  function wrapText(context, text, maxWidth) {
    const paragraphs = String(text).split("\n");
    const lines = [];
    for (const paragraph of paragraphs) {
      if (!paragraph) {
        lines.push("");
        continue;
      }
      let current = "";
      for (const char of [...paragraph]) {
        const candidate = current + char;
        if (current && context.measureText(candidate).width > maxWidth) {
          lines.push(current);
          current = char;
        } else {
          current = candidate;
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  }

  function trimText(context, text, maxWidth) {
    if (context.measureText(text).width <= maxWidth) return text;
    let trimmed = text;
    while (trimmed.length > 1 && context.measureText(`${trimmed}…`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    return `${trimmed}…`;
  }

  function roundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
  }

  function drawImageCover(context, image, x, y, width, height) {
    const imageWidth = image.naturalWidth || image.width || 1;
    const imageHeight = image.naturalHeight || image.height || 1;
    const scale = Math.max(width / imageWidth, height / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    context.drawImage(
      image,
      x + (width - drawWidth) / 2,
      y + (height - drawHeight) / 2,
      drawWidth,
      drawHeight
    );
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  async function loadPostImages(post) {
    const media = new Map();
    const types = new Map();
    const avatarPromise = loadImage(post.avatar);
    const quoteAvatarPromise = post.quoted?.avatar ? loadImage(post.quoted.avatar) : Promise.resolve(null);
    const mediaPromises = post.media.map(async (item) => {
      types.set(item.src, item.type);
      const image = await loadImage(item.src);
      if (image) media.set(item.src, image);
    });
    const quotePromise = post.quoted?.image ? loadImage(post.quoted.image) : Promise.resolve(null);
    const [avatar, quoteImage, quoteAvatar, ...rest] = await Promise.all([
      avatarPromise,
      quotePromise,
      quoteAvatarPromise,
      ...mediaPromises
    ]);
    void rest;
    if (quoteImage && post.quoted) {
      post.quoted.imageElement = quoteImage;
    }
    return { avatar, media, types, quoteImage, quoteAvatar };
  }

  function registerMessageBridge() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "XSHARE_LOCALE") {
        sendResponse({ ok: true, locale: currentLocale() });
        return false;
      }
      if (message?.type === "XSHARE_OPEN") {
        const article = document.querySelector('article[data-testid="tweet"]');
        if (article) openPreview(article);
        sendResponse({ ok: Boolean(article) });
        return false;
      }
      return false;
    });
  }

  async function init() {
    try {
      const stored = await Promise.resolve(chrome.storage.sync.get(DEFAULT_SETTINGS));
      settings = { ...DEFAULT_SETTINGS, ...stored };
    } catch {
      settings = { ...DEFAULT_SETTINGS };
    }
    startMenuWatcher();
    registerMessageBridge();
    watchPageLocale();
  }

  // Remember X's language so the toolbar popup can match it.
  function watchPageLocale() {
    let lastLocale = "";
    const publish = () => {
      const locale = currentLocale();
      if (locale === lastLocale) return;
      lastLocale = locale;
      Promise.resolve(chrome.storage.local.set({ pageLocale: locale })).catch(() => {});
    };
    publish();
    new MutationObserver(publish).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"]
    });
  }

  const OVERLAY_STYLES = `
    #xshare-overlay-root {
      --xs-panel: #000000;
      --xs-text: #e7e9ea;
      --xs-muted: #71767b;
      --xs-line: #2f3336;
      --xs-blue: #1d9bf0;
      --xs-backdrop: rgba(91, 112, 131, 0.4);
      --xs-hover: rgba(231, 233, 234, 0.1);
      --xs-strong: #e7e9ea;
      --xs-on-strong: #0f1419;
      --xs-strong-hover: #d7dbdc;
      --xs-outline: #536471;
      --xs-switch-off: #3e4144;
      --xs-card-border: var(--xs-line);
      --xs-preview-max: calc(100vh - 230px);
      align-items: center;
      background: var(--xs-backdrop);
      display: none;
      font-family: TwitterChirp, -apple-system, "system-ui", "Segoe UI", "PingFang SC", sans-serif;
      inset: 0;
      justify-content: center;
      padding: 22px;
      position: fixed;
      z-index: 2147483647;
    }
    #xshare-overlay-root[data-xs-theme="dim"] {
      --xs-panel: #15202b;
      --xs-text: #f7f9f9;
      --xs-muted: #8b98a5;
      --xs-line: #38444d;
      --xs-hover: rgba(247, 249, 249, 0.1);
      --xs-strong: #f7f9f9;
      --xs-on-strong: #0f1419;
      --xs-strong-hover: #d7dbdc;
      --xs-outline: #536471;
      --xs-switch-off: #425364;
    }
    #xshare-overlay-root[data-xs-theme="light"] {
      --xs-panel: #ffffff;
      --xs-text: #0f1419;
      --xs-muted: #536471;
      --xs-line: #eff3f4;
      --xs-backdrop: rgba(0, 0, 0, 0.4);
      --xs-hover: rgba(15, 20, 25, 0.1);
      --xs-strong: #0f1419;
      --xs-on-strong: #ffffff;
      --xs-strong-hover: #272c30;
      --xs-outline: #cfd9de;
      --xs-switch-off: #cfd9de;
      --xs-card-border: #cfd9de;
    }
    #xshare-overlay-root.xshare-open {
      display: flex;
      animation: xshare-fade 180ms ease both;
    }
    html.xshare-lock-scroll,
    html.xshare-lock-scroll body {
      overflow: hidden !important;
    }
    @keyframes xshare-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .xshare-modal {
      background: var(--xs-panel);
      border-radius: 16px;
      color: var(--xs-text);
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 44px);
      max-width: 1130px;
      overflow: hidden;
      position: relative;
      width: min(960px, 100%);
    }
    .xshare-modal__header {
      align-items: center;
      border-bottom: 1px solid var(--xs-line);
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
    }
    .xshare-modal__brand {
      align-items: center;
      display: flex;
      gap: 12px;
    }
    .xshare-logo {
      color: var(--xs-text);
      display: flex;
    }
    .xshare-logo svg {
      fill: currentColor;
      height: 22px;
      width: 22px;
    }
    .xshare-modal__brand h2 {
      font-size: 17px;
      font-weight: 700;
      line-height: 1.2;
      margin: 0;
    }
    .xshare-icon-button {
      align-items: center;
      background: transparent;
      border: 0;
      border-radius: 50%;
      color: var(--xs-text);
      cursor: pointer;
      display: flex;
      height: 36px;
      justify-content: center;
      padding: 0;
      width: 36px;
    }
    .xshare-icon-button:hover {
      background: var(--xs-hover);
    }
    .xshare-icon-button svg {
      fill: currentColor;
      height: 21px;
      width: 21px;
    }
    .xshare-modal__body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 284px;
      min-height: 0;
    }
    .xshare-preview-pane {
      align-items: center;
      background: var(--xs-panel);
      border-right: 1px solid var(--xs-line);
      display: flex;
      flex-direction: column;
      gap: 12px;
      justify-content: center;
      min-height: 430px;
      overflow: hidden;
      padding: 24px;
      position: relative;
    }
    .xshare-preview-frame {
      align-items: center;
      display: flex;
      justify-content: center;
      max-height: var(--xs-preview-max);
      min-height: 270px;
      position: relative;
      width: 100%;
    }
    .xshare-preview-art {
      align-items: center;
      display: flex;
      justify-content: center;
      max-height: var(--xs-preview-max);
      transition: opacity 150ms ease;
      width: 100%;
    }
    .xshare-preview-image {
      border: 1px solid var(--xs-card-border);
      border-radius: 8px;
      display: block;
      height: auto;
      max-height: var(--xs-preview-max);
      max-width: 100%;
      object-fit: contain;
      width: auto;
    }
    .xshare-preview-loading {
      align-items: center;
      background: var(--xs-panel);
      border: 1px solid var(--xs-line);
      border-radius: 12px;
      color: var(--xs-muted);
      display: flex;
      flex-direction: column;
      gap: 11px;
      font-size: 12px;
      left: 50%;
      padding: 16px 20px;
      pointer-events: none;
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
    }
    /* Keep the previous image in place while re-rendering, just dimmed. */
    .xshare-preview-loading:not([hidden]) + .xshare-preview-art {
      opacity: 0.4;
    }
    .xshare-preview-loading p {
      margin: 0;
    }
    .xshare-preview-loading[hidden] {
      display: none;
    }
    .xshare-spinner {
      animation: xshare-spin 760ms linear infinite;
      border: 2px solid var(--xs-line);
      border-radius: 50%;
      border-top-color: var(--xs-blue);
      display: block;
      height: 28px;
      width: 28px;
    }
    @keyframes xshare-spin {
      to { transform: rotate(360deg); }
    }
    .xshare-preview-meta {
      color: var(--xs-muted);
      display: flex;
      flex: 0 0 auto;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      justify-content: space-between;
      line-height: 16px;
      padding: 0 2px;
      width: 100%;
    }
    .xshare-controls {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 22px 20px;
    }
    .xshare-control-group {
      margin-bottom: 17px;
    }
    .xshare-control-label {
      color: var(--xs-text);
      display: block;
      font-size: 15px;
      font-weight: 700;
      margin: 0 0 10px;
    }
    .xshare-segmented {
      border: 1px solid var(--xs-line);
      border-radius: 9999px;
      display: flex;
      padding: 3px;
    }
    #xshare-overlay-root .xshare-segmented button {
      align-items: center;
      background: transparent;
      border: 0;
      border-radius: 9999px;
      color: var(--xs-muted);
      cursor: pointer;
      display: flex;
      flex: 1;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      justify-content: center;
      line-height: 1;
      margin: 0;
      min-width: 0;
      padding: 8px 4px;
      text-align: center;
    }
    #xshare-overlay-root .xshare-segmented button[aria-pressed="true"] {
      background: var(--xs-strong);
      color: var(--xs-on-strong);
    }
    .xshare-switch-row {
      align-items: center;
      border-bottom: 1px solid var(--xs-line);
      cursor: pointer;
      display: flex;
      gap: 12px;
      padding: 13px 2px;
    }
    .xshare-switch-row > span {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 3px;
    }
    .xshare-switch-row strong {
      font-size: 15px;
      font-weight: 700;
    }
    .xshare-switch-row small {
      color: var(--xs-muted);
      font-size: 13px;
    }
    .xshare-switch-row input {
      height: 0;
      opacity: 0;
      position: absolute;
      width: 0;
    }
    .xshare-switch-row i {
      background: var(--xs-switch-off);
      border-radius: 99px;
      flex: 0 0 34px;
      height: 20px;
      position: relative;
      transition: background 150ms ease;
      width: 34px;
    }
    .xshare-switch-row i::after {
      background: #fff;
      border-radius: 50%;
      content: "";
      height: 16px;
      left: 2px;
      position: absolute;
      top: 2px;
      transition: transform 150ms ease;
      width: 16px;
    }
    .xshare-switch-row input:checked + i {
      background: var(--xs-blue);
    }
    .xshare-switch-row input:checked + i::after {
      transform: translateX(14px);
    }
    .xshare-switch-row input:focus-visible + i {
      outline: 2px solid var(--xs-blue);
      outline-offset: 2px;
    }
    .xshare-divider {
      background: var(--xs-line);
      height: 1px;
      margin: 14px 0 13px;
    }
    .xshare-note {
      color: var(--xs-muted);
      font-size: 13px;
      line-height: 1.5;
      margin: 0 0 16px;
    }
    .xshare-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: auto;
    }
    .xshare-button {
      align-items: center;
      background: transparent;
      border: 1px solid var(--xs-outline);
      border-radius: 9999px;
      color: var(--xs-text);
      cursor: pointer;
      display: flex;
      font-family: inherit;
      font-size: 15px;
      font-weight: 700;
      line-height: 1;
      gap: 8px;
      justify-content: center;
      min-height: 40px;
      padding: 0 16px;
      transition: background 120ms ease, border-color 120ms ease;
    }
    .xshare-button:hover {
      background: var(--xs-hover);
    }
    .xshare-button--primary {
      background: var(--xs-strong);
      border-color: var(--xs-strong);
      color: var(--xs-on-strong);
    }
    .xshare-button--primary:hover {
      background: var(--xs-strong-hover);
      border-color: var(--xs-strong-hover);
    }
    .xshare-button svg {
      fill: currentColor;
      height: 16px;
      width: 16px;
    }
    .xshare-toast {
      background: var(--xs-blue);
      border-radius: 4px;
      bottom: 26px;
      color: #ffffff;
      font-size: 15px;
      font-weight: 700;
      left: 50%;
      opacity: 0;
      padding: 11px 17px;
      pointer-events: none;
      position: fixed;
      transform: translate(-50%, 10px);
      transition: opacity 160ms ease, transform 160ms ease;
      z-index: 2;
    }
    .xshare-toast[data-tone="error"] {
      background: #f4212e;
    }
    .xshare-toast--show {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    .xshare-error {
      color: #f4212e !important;
      max-width: 310px;
      text-align: center;
    }
    @media (max-width: 760px) {
      #xshare-overlay-root {
        padding: 10px;
      }
      .xshare-modal {
        border-radius: 16px;
        max-height: calc(100vh - 20px);
      }
      .xshare-modal__body {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
      }
      .xshare-preview-pane {
        border-bottom: 1px solid var(--xs-line);
        border-right: 0;
        min-height: 260px;
        padding: 16px;
      }
      .xshare-preview-frame,
      .xshare-preview-art,
      .xshare-preview-image {
        max-height: 44vh;
      }
      .xshare-preview-meta {
        display: none;
      }
      .xshare-controls {
        overflow: visible;
        padding: 17px;
      }
    }
  `;

  init();
})();
