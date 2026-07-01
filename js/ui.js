/* ============================================================
   FILM TREND — shared UI: header, footer, shot cards,
   lightbox, downloads, toast.
   ============================================================ */

const NAV = [
  { href: "search.html", label: "Search" },
  { href: "movies.html", label: "Library" },
  { href: "pricing.html", label: "Pricing" },
  { href: "blog.html", label: "Blog" },
];

function renderHeader() {
  const here = location.pathname.split("/").pop() || "index.html";
  const el = document.getElementById("site-header");
  if (!el) return;
  el.innerHTML = `
    <div class="wrap">
      <a class="brand" href="index.html"><span class="logo-mark">▶</span>film<em>trend</em></a>
      <nav class="main-nav">
        ${NAV.map(n => `<a href="${n.href}" class="${here === n.href ? "active" : ""}">${n.label}</a>`).join("")}
      </nav>
      <div class="header-actions">
        <button class="btn btn-ghost btn-sm" onclick="toast('Sign in is coming soon — this is a demo build')">Sign in</button>
        <a class="btn btn-primary btn-sm" href="pricing.html">Get started</a>
      </div>
    </div>`;
}

function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  el.innerHTML = `
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <a class="brand" href="index.html"><span class="logo-mark">▶</span>film<em>trend</em></a>
          <p class="tagline">The AI search engine for reference research. Stills &amp; GIFs from the best films, commercials and music videos.</p>
        </div>
        <div>
          <h5>Product</h5>
          <ul>
            <li><a href="search.html">Shot Search</a></li>
            <li><a href="movies.html">Library</a></li>
            <li><a href="pricing.html">Pricing</a></li>
          </ul>
        </div>
        <div>
          <h5>Resources</h5>
          <ul>
            <li><a href="blog.html">Blog</a></li>
            <li><a href="blog.html">Treatment guides</a></li>
            <li><a href="blog.html">Color harmony 101</a></li>
          </ul>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Terms &amp; Conditions</a></li>
            <li><a href="#">Privacy</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 Film Trend. All movie references are illustrative demo content.</span>
        <span>Made for directors, DPs &amp; editors.</span>
      </div>
    </div>`;
}

/* ---------- shot cards ---------- */
function shotCard(shot) {
  const movie = MOVIES.find(m => m.slug === shot.movie);
  const card = document.createElement("div");
  card.className = "shot-card";
  card.innerHTML = `
    <div class="frame">${sceneSVG(shot)}</div>
    <span class="badge play">▶ PREVIEW</span>
    <span class="badge">GIF · MP4</span>
    <div class="meta">
      <b>${shot.title}</b>
      <span>${movie.title} (${movie.year}) · ${shot.size} · ${shot.move}</span>
    </div>`;
  card.addEventListener("click", () => openLightbox(shot));
  return card;
}

/* ---------- lightbox ---------- */
let lightboxEl = null;

function ensureLightbox() {
  if (lightboxEl) return lightboxEl;
  lightboxEl = document.createElement("div");
  lightboxEl.className = "lightbox";
  document.body.appendChild(lightboxEl);
  lightboxEl.addEventListener("click", e => { if (e.target === lightboxEl) closeLightbox(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });
  return lightboxEl;
}

function openLightbox(shot) {
  const movie = MOVIES.find(m => m.slug === shot.movie);
  const lb = ensureLightbox();
  lb.innerHTML = `
    <div class="lightbox-inner">
      <div class="lightbox-frame">
        ${sceneSVG(shot, 1)}
        <button class="lightbox-close" onclick="closeLightbox()">✕</button>
      </div>
      <div class="lightbox-body">
        <div class="about">
          <h3>${shot.title}</h3>
          <a class="film" href="movie.html?m=${movie.slug}">${movie.title} (${movie.year}) — ${movie.src}</a>
          <div class="spec-list">
            <span class="tag">${shot.size}</span>
            <span class="tag">${shot.angle} angle</span>
            <span class="tag">${shot.move}</span>
            <span class="tag">${shot.tod}</span>
            <span class="tag" style="border-color:${COLOR_DEFS[shot.color]};color:${COLOR_DEFS[shot.color]}">${shot.color}</span>
          </div>
          <p style="color:var(--muted);font-size:14px;margin-top:14px">
            Dir. ${movie.director} · DP ${movie.dp} · ${movie.genre} · ${movie.country}
          </p>
        </div>
        <div class="dl-stack">
          <button class="btn btn-primary" onclick="downloadStill(${shot.id})">↓ Download Still</button>
          <button class="btn btn-ghost" onclick="toast('GIF export: 20/mo on the Free plan — upgrade for unlimited')">↓ Download GIF</button>
          <button class="btn btn-ghost" onclick="toast('MP4 clips are a Pro feature — see Pricing')">↓ Download MP4</button>
          <button class="btn btn-ghost" onclick="toast('Added to your board ✓')">+ Add to board</button>
        </div>
      </div>
    </div>`;
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
  if (typeof onShotEngaged === "function") onShotEngaged(shot);
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove("open");
  document.body.style.overflow = "";
}

/* ---------- real still download (serialises the SVG frame) ---------- */
function downloadStill(id) {
  const shot = SHOTS.find(s => s.id === id);
  const blob = new Blob([sceneSVG(shot, 2)], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `filmtrend_${shot.movie}_${shot.id}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Still downloaded ✓");
}

/* ---------- toast ---------- */
let toastEl, toastTimer;
function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
});
