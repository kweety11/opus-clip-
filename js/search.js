/* ============================================================
   FILM TREND — search engine page
   - free-text search over titles / movies / keywords
   - faceted filters (source, shot size, angle, movement, time of day)
   - dominant-colour swatches + colour-harmony tool
   - Smart Feed: engaging with a shot re-ranks similar shots first
   - paste an image anywhere → colour-matched "similar vibe" results
   ============================================================ */

const state = {
  q: "",
  facets: { src: new Set(), size: new Set(), angle: new Set(), move: new Set(), tod: new Set() },
  colors: new Set(),
  boost: null, // shot the smart feed learns from
};

/* ---------- scoring ---------- */
function matches(shot) {
  for (const key of Object.keys(state.facets)) {
    const sel = state.facets[key];
    if (!sel.size) continue;
    const val = key === "src" ? MOVIES.find(m => m.slug === shot.movie).src : shot[key];
    if (!sel.has(val)) return false;
  }
  if (state.colors.size && !state.colors.has(shot.color)) return false;

  if (state.q) {
    const movie = MOVIES.find(m => m.slug === shot.movie);
    const hay = `${shot.title} ${shot.kw} ${shot.size} ${shot.angle} ${shot.move} ${shot.tod} ${shot.color} ${movie.title} ${movie.director} ${movie.dp} ${movie.genre} ${movie.year}`.toLowerCase();
    const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.every(t => hay.includes(t))) return false;
  }
  return true;
}

function similarity(a, b) {
  let s = 0;
  if (a.movie === b.movie) s += 3;
  if (a.color === b.color) s += 3;
  if (a.comp === b.comp) s += 2;
  if (a.tod === b.tod) s += 2;
  if (a.size === b.size) s += 1;
  if (a.move === b.move) s += 1;
  return s;
}

function rankedResults() {
  let res = SHOTS.filter(matches);
  if (state.boost) {
    res = res.slice().sort((x, y) => similarity(y, state.boost) - similarity(x, state.boost));
  }
  return res;
}

/* Smart Feed hook — called by the lightbox when a shot is opened */
function onShotEngaged(shot) {
  state.boost = shot;
  render();
  const note = document.getElementById("smartfeed-note");
  if (note) {
    note.style.display = "block";
    note.innerHTML = `⚡ Smart Feed: showing shots similar to “<b>${shot.title}</b>” first — <a href="#" onclick="clearBoost();return false">reset</a>`;
  }
}
function clearBoost() {
  state.boost = null;
  const note = document.getElementById("smartfeed-note");
  if (note) note.style.display = "none";
  render();
}

/* ---------- render ---------- */
function render() {
  const grid = document.getElementById("results");
  const res = rankedResults();
  document.getElementById("result-count").innerHTML = `<b>${res.length}</b> of ${SHOTS.length} shots`;
  grid.innerHTML = "";
  if (!res.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><b>No shots match</b>Try removing a filter or searching a broader term.</div>`;
    return;
  }
  res.forEach(s => grid.appendChild(shotCard(s)));
}

/* ---------- filters UI ---------- */
function buildFilters() {
  const box = document.getElementById("filters");
  let html = "";
  for (const [key, def] of Object.entries(FILTER_DEFS)) {
    html += `<h4>${def.label}</h4><div class="filter-opts">` +
      def.opts.map(o => `<button class="fopt" data-facet="${key}" data-val="${o}">${o}</button>`).join("") +
      `</div>`;
  }
  html += `<h4>Dominant Color</h4><div class="swatches">` +
    Object.entries(COLOR_DEFS).map(([name, hex]) =>
      `<button class="swatch" data-color="${name}" title="${name}" style="background:${hex}"></button>`).join("") +
    `</div>`;

  html += `
    <h4>Color Harmony</h4>
    <div class="harmony-box">
      <label>Pick a base hue — we find shots in its harmony</label>
      <div class="hue-track"></div>
      <input type="range" id="hue" min="0" max="360" value="28">
      <div class="harmony-modes">
        <button class="fopt on" data-mode="complementary">Compl.</button>
        <button class="fopt" data-mode="analogous">Analog.</button>
        <button class="fopt" data-mode="triadic">Triadic</button>
      </div>
      <div class="harmony-swatches" id="harmony-swatches"></div>
      <button class="btn btn-primary btn-sm harmony-apply" id="harmony-apply">Apply harmony</button>
    </div>`;

  html += `<button class="btn btn-ghost btn-sm clear-btn" id="clear-filters">Clear all filters</button>`;
  box.innerHTML = html;

  box.addEventListener("click", e => {
    const f = e.target.closest(".fopt[data-facet]");
    if (f) {
      const set = state.facets[f.dataset.facet];
      set.has(f.dataset.val) ? set.delete(f.dataset.val) : set.add(f.dataset.val);
      f.classList.toggle("on");
      render();
    }
    const sw = e.target.closest(".swatch");
    if (sw) {
      const c = sw.dataset.color;
      state.colors.has(c) ? state.colors.delete(c) : state.colors.add(c);
      sw.classList.toggle("on");
      render();
    }
    const m = e.target.closest(".fopt[data-mode]");
    if (m) {
      box.querySelectorAll(".fopt[data-mode]").forEach(b => b.classList.remove("on"));
      m.classList.add("on");
      drawHarmony();
    }
  });

  document.getElementById("hue").addEventListener("input", drawHarmony);
  document.getElementById("harmony-apply").addEventListener("click", applyHarmony);
  document.getElementById("clear-filters").addEventListener("click", () => {
    Object.values(state.facets).forEach(s => s.clear());
    state.colors.clear();
    state.boost = null;
    box.querySelectorAll(".on").forEach(el => { if (!el.dataset.mode) el.classList.remove("on"); });
    const note = document.getElementById("smartfeed-note");
    if (note) note.style.display = "none";
    render();
  });

  drawHarmony();
}

/* ---------- colour harmony ---------- */
function harmonyHues() {
  const h = +document.getElementById("hue").value;
  const mode = document.querySelector(".fopt[data-mode].on").dataset.mode;
  if (mode === "complementary") return [h, (h + 180) % 360];
  if (mode === "analogous") return [(h + 330) % 360, h, (h + 30) % 360];
  return [h, (h + 120) % 360, (h + 240) % 360];
}

function drawHarmony() {
  const el = document.getElementById("harmony-swatches");
  el.innerHTML = harmonyHues().map(h => `<div style="background:hsl(${h} 70% 52%)"></div>`).join("");
}

/* map a hue to our named colour buckets */
function hueToName(h) {
  if (h < 15 || h >= 345) return "red";
  if (h < 45) return "amber";
  if (h < 70) return "amber";
  if (h < 160) return "green";
  if (h < 200) return "teal";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  return "pink";
}

function applyHarmony() {
  state.colors = new Set(harmonyHues().map(hueToName));
  document.querySelectorAll(".swatch").forEach(sw =>
    sw.classList.toggle("on", state.colors.has(sw.dataset.color)));
  render();
  toast(`Harmony applied: ${[...state.colors].join(" + ")}`);
}

/* ---------- paste-image search (image → dominant colour → similar shots) ---------- */
function initPasteSearch() {
  document.addEventListener("paste", e => {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith("image/"));
    if (!item) return;
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 24;
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0, 24, 24);
      const d = ctx.getImageData(0, 0, 24, 24).data;
      let r = 0, g = 0, b = 0, n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      r /= n; g /= n; b /= n;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0;
      if (max !== min) {
        if (max === r) h = 60 * (((g - b) / (max - min)) % 6);
        else if (max === g) h = 60 * ((b - r) / (max - min) + 2);
        else h = 60 * ((r - g) / (max - min) + 4);
      }
      if (h < 0) h += 360;
      const name = (max - min < 18) ? "mono" : hueToName(h);
      state.colors = new Set([name]);
      state.q = "";
      document.getElementById("q").value = "";
      document.querySelectorAll(".swatch").forEach(sw =>
        sw.classList.toggle("on", sw.dataset.color === name));
      render();
      toast(`🖼 Image search: showing ${name} shots with a similar vibe`);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(item.getAsFile());
  });
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  buildFilters();

  const input = document.getElementById("q");
  const params = new URLSearchParams(location.search);
  if (params.get("q")) { state.q = params.get("q"); input.value = state.q; }
  if (params.get("color")) {
    state.colors = new Set([params.get("color")]);
    document.querySelectorAll(".swatch").forEach(sw =>
      sw.classList.toggle("on", state.colors.has(sw.dataset.color)));
  }
  input.addEventListener("input", () => { state.q = input.value; render(); });

  initPasteSearch();
  render();
});
