// Searchable multi-select font dropdown shared by the popup and the in-page
// export dialog. Picked fonts are numbered 1, 2, 3… in pick order, which is the
// fallback order on the card. Type to filter; ↑/↓ to move, Enter to toggle,
// Esc to close. Follows the ARIA combobox + multi-select listbox pattern.
(() => {
  "use strict";

  const MAX_OPTIONS = 200;
  let instances = 0;

  const quoteFont = (name) => `"${name.replace(/["\\]/g, "")}"`;

  // Older versions stored a single font name; accept both shapes.
  function normalizeFonts(value) {
    const names = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
    const seen = new Set();
    return names
      .filter((name) => typeof name === "string")
      .map((name) => name.trim())
      .filter((name) => name && !seen.has(name) && seen.add(name));
  }

  function mount(container, { defaultLabel, ariaLabel = "", onChange }) {
    const doc = container.ownerDocument;
    const id = `xshare-font-list-${++instances}`;

    const root = doc.createElement("div");
    root.className = "xshare-combo";
    const input = doc.createElement("input");
    input.className = "xshare-combo__input";
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-controls", id);
    const list = doc.createElement("ul");
    list.className = "xshare-combo__list";
    list.id = id;
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-multiselectable", "true");
    list.hidden = true;
    root.append(input, list);
    container.replaceChildren(root);

    let fonts = [];
    let selected = [];
    let matches = [];
    let active = -1;
    let query = "";

    const summary = () => (selected.length ? selected.join(", ") : defaultLabel);

    function showValue() {
      input.value = summary();
      input.title = selected.length
        ? selected.map((name, index) => `${index + 1}. ${name}`).join("\n")
        : defaultLabel;
      input.style.fontFamily = selected.length ? `${quoteFont(selected[0])}, inherit` : "";
    }

    function filter() {
      const needle = query.trim().toLowerCase();
      // Picked fonts first in fallback order, then the rest alphabetically.
      const names = [...selected, ...fonts.filter((name) => !selected.includes(name))];
      const found = names.filter((name) => !needle || name.toLowerCase().includes(needle));
      const showDefault = !needle || defaultLabel.toLowerCase().includes(needle);
      return (showDefault ? ["", ...found] : found).slice(0, MAX_OPTIONS);
    }

    function paint() {
      list.replaceChildren(
        ...matches.map((name, index) => {
          const item = doc.createElement("li");
          item.className = "xshare-combo__option";
          item.id = `${id}-${index}`;
          item.dataset.index = String(index);
          item.setAttribute("role", "option");
          const order = name ? selected.indexOf(name) + 1 : 0;
          const isSelected = name ? order > 0 : selected.length === 0;
          item.setAttribute("aria-selected", String(isSelected));
          if (index === active) item.classList.add("is-active");
          const label = doc.createElement("span");
          label.className = "xshare-combo__label";
          // Preview each font in its own face.
          if (name) label.style.fontFamily = quoteFont(name);
          label.textContent = name || defaultLabel;
          item.append(label);
          if (order) {
            const badge = doc.createElement("span");
            badge.className = "xshare-combo__order";
            badge.textContent = String(order);
            badge.setAttribute("aria-label", `#${order}`);
            item.append(badge);
          }
          return item;
        })
      );
      if (!matches.length) {
        const empty = doc.createElement("li");
        empty.className = "xshare-combo__empty";
        empty.textContent = "—";
        list.append(empty);
      }
      if (active >= 0) {
        input.setAttribute("aria-activedescendant", `${id}-${active}`);
        list.children[active]?.scrollIntoView({ block: "nearest" });
      } else {
        input.removeAttribute("aria-activedescendant");
      }
    }

    function refresh() {
      matches = filter();
      active = matches.length ? Math.min(Math.max(active, 0), matches.length - 1) : -1;
      paint();
    }

    function open() {
      if (!list.hidden) return;
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      root.classList.add("is-open");
      query = "";
      input.value = "";
      active = 0;
      refresh();
    }

    function close() {
      if (list.hidden) return;
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      root.classList.remove("is-open");
      query = "";
      showValue();
    }

    // Default clears the list; any other font is appended or removed, and the
    // remaining fonts renumber.
    function toggle(name) {
      if (!name) {
        if (!selected.length) return;
        selected = [];
      } else if (selected.includes(name)) {
        selected = selected.filter((entry) => entry !== name);
      } else {
        selected = [...selected, name];
      }
      const keep = matches[active];
      matches = filter();
      active = Math.max(0, matches.indexOf(keep));
      paint();
      onChange?.([...selected]);
    }

    input.addEventListener("focus", open);
    input.addEventListener("click", open);
    input.addEventListener("blur", close);
    input.addEventListener("input", () => {
      if (list.hidden) open();
      query = input.value;
      active = 0;
      refresh();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (list.hidden) {
          open();
          return;
        }
        if (!matches.length) return;
        const step = event.key === "ArrowDown" ? 1 : -1;
        active = (active + step + matches.length) % matches.length;
        paint();
      } else if (event.key === "Enter") {
        if (list.hidden) return;
        event.preventDefault();
        if (active >= 0) toggle(matches[active]);
      } else if (event.key === "Escape") {
        if (list.hidden) return;
        // Close just the list, not the dialog around it.
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (event.key === "Tab") {
        close();
      }
    });
    // mousedown keeps focus in the input so blur doesn't close the list first.
    list.addEventListener("mousedown", (event) => event.preventDefault());
    list.addEventListener("click", (event) => {
      const item = event.target.closest(".xshare-combo__option");
      if (!item) return;
      active = Number(item.dataset.index);
      toggle(matches[active]);
    });

    showValue();
    if (ariaLabel) input.setAttribute("aria-label", ariaLabel);

    return {
      isOpen: () => !list.hidden,
      setValue(value) {
        selected = normalizeFonts(value);
        if (list.hidden) showValue();
        else refresh();
      },
      setFonts(names) {
        fonts = Array.isArray(names) ? names : [];
        if (!list.hidden) refresh();
      },
      setLabels(labels) {
        if (labels.defaultLabel) defaultLabel = labels.defaultLabel;
        if (labels.ariaLabel) input.setAttribute("aria-label", labels.ariaLabel);
        if (labels.placeholder) input.placeholder = labels.placeholder;
        if (list.hidden) showValue();
        else paint();
      }
    };
  }

  globalThis.XShareFontCombobox = Object.freeze({ mount, normalizeFonts });
})();
