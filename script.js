const themeToggleEl = document.getElementById("themeToggle");
const THEME_KEY = "fontu:theme";

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
}

initTheme();

themeToggleEl.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
});

const listEl = document.getElementById("fontList");
const searchEl = document.getElementById("searchInput");
const categoryChipsEl = document.getElementById("categoryChips");
const licenseEl = document.getElementById("licenseFilter");
const previewEl = document.getElementById("previewInput");
const sizeEl = document.getElementById("sizeRange");
const sizeLabelEl = document.getElementById("sizeLabel");
const countEl = document.getElementById("resultCount");
const langTabsEl = document.getElementById("langTabs");
const toastEl = document.getElementById("toast");

let fonts = [];
let currentLang = "ko";
let currentCategory = "";

const DEFAULT_PREVIEW = {
  ko: "다람쥐 헌 쳇바퀴에 타고파",
  en: "The quick brown fox jumps over the lazy dog",
};

async function loadFonts() {
  try {
    const res = await fetch("fonts.json?v=5");
    fonts = await res.json();
    injectGoogleFonts();
    refreshForLang();
  } catch (err) {
    listEl.innerHTML = `<p class="error">데이터를 불러올 수 없습니다. Live Server나 http 서버로 띄워주세요.</p>`;
    console.error(err);
  }
}

function injectGoogleFonts() {
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = "https://fonts.googleapis.com";
  document.head.appendChild(link);
  const link2 = document.createElement("link");
  link2.rel = "preconnect";
  link2.href = "https://fonts.gstatic.com";
  link2.crossOrigin = "";
  document.head.appendChild(link2);

  const params = fonts
    .filter((f) => f.googleFontFamily)
    .map((f) => {
      const w = (f.weights && f.weights.length ? f.weights : [400]).join(";");
      return `family=${encodeURIComponent(f.googleFontFamily)}:wght@${w}`;
    })
    .join("&");

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
  document.head.appendChild(css);
}

function uniqueSorted(arr) {
  return [...new Set(arr)].filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
}

function refreshForLang() {
  const langFonts = fonts.filter((f) => f.language === currentLang);
  const categories = uniqueSorted(langFonts.map((f) => f.category));

  currentCategory = "";
  categoryChipsEl.innerHTML =
    `<button class="cat-chip active" data-cat="" type="button">전체</button>` +
    categories
      .map((c) => `<button class="cat-chip" data-cat="${c}" type="button">${c}</button>`)
      .join("");

  licenseEl.innerHTML = '<option value="">전체 라이선스</option>';
  uniqueSorted(langFonts.map((f) => f.license)).forEach((l) =>
    licenseEl.add(new Option(l, l))
  );

  if (previewEl.value === DEFAULT_PREVIEW.ko || previewEl.value === DEFAULT_PREVIEW.en) {
    previewEl.value = DEFAULT_PREVIEW[currentLang];
  }

  applyFilters();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function render(items) {
  countEl.textContent = `${items.length}개 폰트`;
  if (!items.length) {
    listEl.innerHTML = `<p class="empty">조건에 맞는 폰트가 없습니다.</p>`;
    return;
  }
  const previewText = previewEl.value || DEFAULT_PREVIEW[currentLang];
  const size = sizeEl.value;

  listEl.innerHTML = items
    .map(
      (f) => `
    <article class="font-card" data-id="${f.id}">
      <div class="font-preview" style="font-family: '${f.googleFontFamily}', sans-serif; font-size: ${size}px;">
        ${escapeHtml(previewText)}
      </div>
      <div class="font-meta">
        <div class="font-title">
          <h3>${f.name}</h3>
          <span class="font-eng">${f.englishName}</span>
        </div>
        <div class="font-info">
          <span class="cat">${f.category}</span>
          <span class="designer">${f.designer}</span>
        </div>
        <div class="font-license">
          <span class="license-badge">${f.license}</span>
          <span class="license-note">${f.licenseNote}</span>
        </div>
        <div class="font-tags">
          ${(f.tags || []).map((t) => `<span class="tag">#${t}</span>`).join("")}
        </div>
        <div class="card-actions">
          <button class="download-btn" data-action="zip" data-id="${f.id}" type="button">
            <span class="btn-label">ZIP 다운로드 (폰트 + 미리보기)</span>
          </button>
          <a class="source-btn" href="${f.sourceUrl}" target="_blank" rel="noopener noreferrer">출처 보기 ↗</a>
        </div>
      </div>
    </article>
  `
    )
    .join("");
}

function applyFilters() {
  const q = searchEl.value.trim().toLowerCase();
  const license = licenseEl.value;

  const filtered = fonts.filter((f) => {
    if (f.language !== currentLang) return false;
    if (currentCategory && f.category !== currentCategory) return false;
    if (license && f.license !== license) return false;
    if (q) {
      const hay = `${f.name} ${f.englishName} ${f.designer} ${(f.tags || []).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  render(filtered);
}

/* === ZIP download (font + preview PNG) === */

async function downloadZip(font, btnEl) {
  const labelEl = btnEl.querySelector(".btn-label");
  const origLabel = labelEl.textContent;
  btnEl.disabled = true;

  try {
    labelEl.textContent = "준비 중...";
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.googleFontFamily)}:wght@${(font.weights || [400]).join(";")}&display=swap`;
    const cssRes = await fetch(cssUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const cssText = await cssRes.text();

    const fontUrls = [
      ...new Set([...cssText.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1])),
    ];
    if (!fontUrls.length) throw new Error("폰트 URL을 찾을 수 없습니다");

    labelEl.textContent = "폰트 받는 중...";
    const zip = new JSZip();
    const folderName = font.englishName.replace(/[^a-zA-Z0-9-]/g, "-");

    for (let i = 0; i < fontUrls.length; i++) {
      const u = fontUrls[i];
      const buf = await (await fetch(u)).arrayBuffer();
      const wMatch = cssText.match(new RegExp(`font-weight: (\\d+);[\\s\\S]*?url\\(${u.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\)`));
      const weight = wMatch ? wMatch[1] : `${400 + i}`;
      zip.file(`${folderName}/${folderName}-${weight}.woff2`, buf);
    }

    labelEl.textContent = "미리보기 만드는 중...";
    const png = await renderPreviewPNG(font);
    zip.file(`${folderName}/preview.png`, png);

    const readme = buildReadme(font);
    zip.file(`${folderName}/README.txt`, readme);

    labelEl.textContent = "압축 중...";
    const blob = await zip.generateAsync({ type: "blob" });

    triggerDownload(blob, `${folderName}.zip`);
    showToast(`${font.name} 다운로드 완료`);
  } catch (err) {
    console.error(err);
    showToast(`다운로드 실패: ${err.message}`);
  } finally {
    labelEl.textContent = origLabel;
    btnEl.disabled = false;
  }
}

async function renderPreviewPNG(font) {
  await document.fonts.load(`64px "${font.googleFontFamily}"`);
  const text = previewEl.value || DEFAULT_PREVIEW[font.language] || font.name;

  const dpr = 2;
  const canvas = document.createElement("canvas");
  const W = 1200;
  const H = 630;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#fafaff");
  grad.addColorStop(1, "#ffffff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#9ca3af";
  ctx.font = "20px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(font.englishName, 60, 70);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 28px -apple-system, sans-serif";
  ctx.fillText(font.name, 60, 110);

  ctx.fillStyle = "#111827";
  let fontSize = 96;
  ctx.font = `${fontSize}px "${font.googleFontFamily}"`;
  while (ctx.measureText(text).width > W - 120 && fontSize > 24) {
    fontSize -= 4;
    ctx.font = `${fontSize}px "${font.googleFontFamily}"`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2 + 20);

  ctx.fillStyle = "#9ca3af";
  ctx.font = "16px -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("fontu — " + font.license, W - 60, H - 50);

  return await new Promise((res) => canvas.toBlob(res, "image/png"));
}

function buildReadme(f) {
  return [
    `Font: ${f.name} (${f.englishName})`,
    `Designer: ${f.designer}`,
    `Category: ${f.category}`,
    `License: ${f.license} — ${f.licenseNote}`,
    `Source: ${f.sourceUrl}`,
    `Download page: ${f.downloadUrl}`,
    ``,
    `Bundled by 폰투 (fontu) — https://leegemma.github.io/fontu/`,
    ``,
    `Files in this archive:`,
    `  *.woff2  — font files (re-downloaded from Google Fonts)`,
    `  preview.png — preview image rendered with the font`,
    ``,
    `라이선스(${f.license}) 조건에 따라 사용해주세요. 자세한 라이선스 전문은 Source URL을 참조하세요.`,
  ].join("\n");
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  requestAnimationFrame(() => toastEl.classList.add("show"));
  setTimeout(() => {
    toastEl.classList.remove("show");
    setTimeout(() => toastEl.classList.add("hidden"), 200);
  }, 2200);
}

/* === Event wiring === */

langTabsEl.addEventListener("click", (e) => {
  const tab = e.target.closest(".lang-tab");
  if (!tab) return;
  [...langTabsEl.querySelectorAll(".lang-tab")].forEach((t) => {
    t.classList.toggle("active", t === tab);
    t.setAttribute("aria-selected", t === tab ? "true" : "false");
  });
  currentLang = tab.dataset.lang;
  refreshForLang();
});

searchEl.addEventListener("input", applyFilters);
categoryChipsEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".cat-chip");
  if (!chip) return;
  [...categoryChipsEl.querySelectorAll(".cat-chip")].forEach((c) =>
    c.classList.toggle("active", c === chip)
  );
  currentCategory = chip.dataset.cat;
  applyFilters();
});
licenseEl.addEventListener("change", applyFilters);
previewEl.addEventListener("input", applyFilters);
sizeEl.addEventListener("input", () => {
  sizeLabelEl.textContent = `${sizeEl.value}px`;
  applyFilters();
});

listEl.addEventListener("click", (e) => {
  const btn = e.target.closest('[data-action="zip"]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const font = fonts.find((f) => f.id === id);
  if (font) downloadZip(font, btn);
});

loadFonts();
