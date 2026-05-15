const listEl = document.getElementById("fontList");
const searchEl = document.getElementById("searchInput");
const categoryEl = document.getElementById("categoryFilter");
const licenseEl = document.getElementById("licenseFilter");
const previewEl = document.getElementById("previewInput");
const sizeEl = document.getElementById("sizeRange");
const sizeLabelEl = document.getElementById("sizeLabel");
const countEl = document.getElementById("resultCount");

let fonts = [];

async function loadFonts() {
  try {
    const res = await fetch("fonts.json?v=1");
    fonts = await res.json();
    injectGoogleFonts();
    populateFilters();
    applyFilters();
  } catch (err) {
    listEl.innerHTML = `<p class="error">데이터를 불러올 수 없습니다. 로컬에서는 Live Server나 http 서버로 띄워주세요.</p>`;
    console.error(err);
  }
}

function injectGoogleFonts() {
  const families = [
    ...new Set(fonts.map((f) => f.googleFontFamily).filter(Boolean)),
  ];
  if (!families.length) return;

  const familyParams = families
    .map((name) => {
      const weights = fonts.find((f) => f.googleFontFamily === name)?.weights || [400];
      const w = weights.join(";");
      return `family=${encodeURIComponent(name)}:wght@${w}`;
    })
    .join("&");

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
  document.head.appendChild(link);

  const pre1 = document.createElement("link");
  pre1.rel = "preconnect";
  pre1.href = "https://fonts.googleapis.com";
  document.head.appendChild(pre1);

  const pre2 = document.createElement("link");
  pre2.rel = "preconnect";
  pre2.href = "https://fonts.gstatic.com";
  pre2.crossOrigin = "";
  document.head.appendChild(pre2);
}

function uniqueSorted(arr) {
  return [...new Set(arr)].filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
}

function populateFilters() {
  const categories = uniqueSorted(fonts.map((f) => f.category));
  const licenses = uniqueSorted(fonts.map((f) => f.license));
  categories.forEach((c) => categoryEl.add(new Option(c, c)));
  licenses.forEach((l) => licenseEl.add(new Option(l, l)));
}

function render(items) {
  countEl.textContent = `${items.length}개 폰트`;
  if (!items.length) {
    listEl.innerHTML = `<p class="empty">조건에 맞는 폰트가 없습니다.</p>`;
    return;
  }
  const previewText = previewEl.value || "다람쥐 헌 쳇바퀴에 타고파";
  const size = sizeEl.value;

  listEl.innerHTML = items
    .map(
      (f) => `
    <article class="font-card">
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
        <a class="download-btn" href="${f.downloadUrl}" target="_blank" rel="noopener noreferrer">
          다운로드 →
        </a>
      </div>
    </article>
  `
    )
    .join("");
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function applyFilters() {
  const q = searchEl.value.trim().toLowerCase();
  const category = categoryEl.value;
  const license = licenseEl.value;

  const filtered = fonts.filter((f) => {
    if (category && f.category !== category) return false;
    if (license && f.license !== license) return false;
    if (q) {
      const hay = `${f.name} ${f.englishName} ${f.designer} ${(f.tags || []).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  render(filtered);
}

searchEl.addEventListener("input", applyFilters);
categoryEl.addEventListener("change", applyFilters);
licenseEl.addEventListener("change", applyFilters);
previewEl.addEventListener("input", applyFilters);
sizeEl.addEventListener("input", () => {
  sizeLabelEl.textContent = `${sizeEl.value}px`;
  applyFilters();
});

loadFonts();
