/* ============================================================
   FILM-TREND AI — UI logic
   Tabs: social plan / script / storyboard / settings.
   Streams LLM output (any configured provider) and renders markdown.
   ============================================================ */

let activeController = null;
let lastScript = "";   // carried from the Script tool into Storyboard

/* ---------- tiny markdown renderer (headings, bold, lists, tables, code) ---------- */
function mdToHtml(md) {
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split("\n");
  let html = "", inCode = false, inList = false, inTable = false;

  const inline = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

  const closeBlocks = () => {
    if (inList) { html += "</ul>"; inList = false; }
    if (inTable) { html += "</table>"; inTable = false; }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      closeBlocks();
      html += inCode ? "</pre>" : "<pre>";
      inCode = !inCode;
      continue;
    }
    if (inCode) { html += esc(line) + "\n"; continue; }

    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) { closeBlocks(); html += `<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`; continue; }

    if (/^\s*[-*•]\s+/.test(line)) {
      if (inTable) { html += "</table>"; inTable = false; }
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(line.replace(/^\s*[-*•]\s+/, ""))}</li>`;
      continue;
    }

    if (/^\s*\|/.test(line)) {
      if (inList) { html += "</ul>"; inList = false; }
      if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue; // separator row
      if (!inTable) { html += "<table>"; inTable = true; }
      const cells = line.trim().replace(/^\||\|$/g, "").split("|");
      html += "<tr>" + cells.map(c => `<td>${inline(c.trim())}</td>`).join("") + "</tr>";
      continue;
    }

    if (/^\s*(---|━+)\s*$/.test(line)) { closeBlocks(); html += "<hr>"; continue; }
    if (line.trim() === "") { closeBlocks(); continue; }

    closeBlocks();
    html += `<p>${inline(line)}</p>`;
  }
  if (inCode) html += "</pre>";
  if (inList) html += "</ul>";
  if (inTable) html += "</table>";
  return html;
}

/* ---------- tabs ---------- */
function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach(b =>
    b.classList.toggle("on", b.dataset.tab === name));
  document.querySelectorAll(".panel").forEach(p =>
    p.classList.toggle("show", p.id === "panel-" + name));
}

/* ---------- shared run/render plumbing ---------- */
function startRun(tool, content) {
  const { apiKey, provider } = getSettings();
  if (!apiKey) {
    toast(`ضيف مفتاح ${PROVIDERS[provider].label} الأول من تبويب الإعدادات ⚙️`);
    switchTab("settings");
    return;
  }
  if (activeController) activeController.abort();

  const out = document.getElementById(`out-${tool}`);
  const btn = document.getElementById(`run-${tool}`);
  const stop = document.getElementById(`stop-${tool}`);
  out.innerHTML = '<p class="thinking">⏳ الموديل بيفكر ويجهّز الناتج…</p>';
  out.dataset.raw = "";
  btn.disabled = true;
  stop.style.display = "inline-flex";

  activeController = runLLM(content, {
    onText(delta) {
      out.dataset.raw += delta;
      out.innerHTML = mdToHtml(out.dataset.raw);
      out.scrollTop = out.scrollHeight;
    },
    onDone(full) {
      btn.disabled = false;
      stop.style.display = "none";
      activeController = null;
      if (!full.trim()) {
        out.innerHTML = '<p class="thinking">ماوصلش ناتج — حاول تاني</p>';
        return;
      }
      out.innerHTML = mdToHtml(full);
      document.getElementById(`actions-${tool}`).style.display = "flex";
      if (tool === "board") {
        boardView = "full";
        const sb = document.getElementById("split-board");
        if (sb) sb.textContent = "🗂️ قسّم المشاهد";
      }
      if (tool === "script") {
        lastScript = full;
        const carry = document.getElementById("carry-note");
        if (carry) carry.style.display = "block";
      }
    },
    onError(msg) {
      btn.disabled = false;
      stop.style.display = "none";
      activeController = null;
      out.innerHTML = `<p class="err">⚠️ ${msg}</p>`;
    },
  });
}

function stopRun(tool) {
  if (activeController) activeController.abort();
  document.getElementById(`run-${tool}`).disabled = false;
  document.getElementById(`stop-${tool}`).style.display = "none";
}

function copyOut(tool) {
  navigator.clipboard.writeText(document.getElementById(`out-${tool}`).dataset.raw || "")
    .then(() => toast("اتنسخ ✓"));
}

function downloadOut(tool, name) {
  const blob = new Blob([document.getElementById(`out-${tool}`).dataset.raw || ""], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- tool 1: social plan ---------- */
async function runPlan() {
  const brief = document.getElementById("plan-brief").value.trim();
  const file = document.getElementById("plan-pdf").files[0];
  if (!brief && !file) { toast("اكتب البريف أو ارفع ملف PDF"); return; }

  const content = [];
  if (file) {
    if (file.size > 30 * 1024 * 1024) { toast("حجم الـ PDF أكبر من 30MB"); return; }
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: await fileToBase64(file) },
    });
  }
  content.push({
    type: "text",
    text: "MODE: SOCIAL_PLAN\n\n" + (brief || "البريف كامل في ملف الـ PDF المرفق. حوّله لخطة سوشيال ميديا شاملة."),
  });
  startRun("plan", content);
}

/* ---------- tool 2: script ---------- */
function runScript() {
  const idea = document.getElementById("script-idea").value.trim();
  if (!idea) { toast("اكتب الفكرة الأول"); return; }
  const format = document.getElementById("script-format").value;
  const duration = document.getElementById("script-duration").value.trim();
  startRun("script", [{
    type: "text",
    text: `MODE: SCRIPT\nFORMAT: ${format}${duration ? "\nTARGET DURATION: " + duration : ""}\n\n${idea}`,
  }]);
}

/* ---------- tool 3: storyboard ---------- */
function runBoard() {
  let script = document.getElementById("board-script").value.trim();
  if (!script && lastScript) script = lastScript;
  if (!script) { toast("الصق السيناريو أو ولّده الأول من تبويب السيناريو"); return; }
  const styleSel = document.getElementById("board-style-sel").value;
  const styleCustom = document.getElementById("board-style").value.trim();
  const style = [styleSel, styleCustom].filter(Boolean).join(", ");
  const ratio = document.getElementById("board-ratio").value;
  startRun("board", [{
    type: "text",
    text: `MODE: STORYBOARD\nASPECT RATIO: ${ratio}${style ? "\nVISUAL STYLE: " + style : ""}\n\nSCRIPT:\n${script}`,
  }]);
}

function useLastScript() {
  if (!lastScript) { toast("مفيش سيناريو متولد لسه"); return; }
  document.getElementById("board-script").value = lastScript;
  toast("آخر سيناريو اتحط ✓");
}

/* ---------- storyboard: split into standalone scene cards ---------- */
let boardView = "full"; // full | scenes

function splitScenes(raw) {
  // scenes are delimited by the machine-parsed header: ━━━ SCENE 04 …
  const parts = raw.split(/(?=━{2,}\s*SCENE\s)/i).filter(p => /━{2,}\s*SCENE\s/i.test(p));
  return parts.map(p => {
    const header = (p.match(/━{2,}\s*(SCENE[^━\n]*)/i) || [, "SCENE"])[1].trim();
    // lookahead stops at the next section: audio note, next scene, another
    // prompt, a code fence, a table row (shot list), or a heading
    const stop = "(?=\\n\\s*(?:🔊|━{2,}|IMAGE PROMPT|MOTION PROMPT|```|\\||#)|$)";
    const img = (p.match(new RegExp("IMAGE PROMPT[^:\\n]*:?\\s*\\n?([\\s\\S]*?)" + stop, "i")) || [, ""])[1].trim();
    const mot = (p.match(new RegExp("MOTION PROMPT[^:\\n]*:?\\s*\\n?([\\s\\S]*?)" + stop, "i")) || [, ""])[1].trim();
    return { header, full: p.trim(), img, mot };
  });
}

function copyText(txt, label) {
  navigator.clipboard.writeText(txt).then(() => toast(label + " اتنسخ ✓"));
}

function toggleBoardView() {
  const out = document.getElementById("out-board");
  const btn = document.getElementById("split-board");
  const raw = out.dataset.raw || "";

  if (boardView === "full") {
    const scenes = splitScenes(raw);
    if (!scenes.length) { toast("مش لاقي مشاهد بصيغة ━━━ SCENE — ولّد الاستوري بورد الأول"); return; }
    window._scenes = scenes;
    out.innerHTML = scenes.map((s, i) => `
      <div class="scene-card">
        <div class="scene-head">
          <b>🎬 ${s.header.replace(/━/g, "").trim()}</b>
          <button class="btn btn-ghost btn-xs" onclick="copyText(window._scenes[${i}].full, 'المشهد كامل')">📋 المشهد كامل</button>
        </div>
        ${s.img ? `
        <div class="scene-prompt">
          <div class="sp-head"><span>🖼 IMAGE PROMPT</span>
            <button class="btn btn-ghost btn-xs" onclick="copyText(window._scenes[${i}].img, 'برومبت الصورة')">📋 نسخ</button>
          </div>
          <pre dir="ltr">${s.img.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>
        </div>` : ""}
        ${s.mot ? `
        <div class="scene-prompt">
          <div class="sp-head"><span>🎥 MOTION PROMPT</span>
            <button class="btn btn-ghost btn-xs" onclick="copyText(window._scenes[${i}].mot, 'برومبت الحركة')">📋 نسخ</button>
          </div>
          <pre dir="ltr">${s.mot.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>
        </div>` : ""}
      </div>`).join("");
    btn.textContent = "📄 رجّع العرض الكامل";
    boardView = "scenes";
    toast(`اتقسم ${scenes.length} مشهد ✓`);
  } else {
    out.innerHTML = mdToHtml(raw);
    btn.textContent = "🗂️ قسّم المشاهد";
    boardView = "full";
  }
}

/* ---------- settings ---------- */
function fillProviderUI(provider) {
  const P = PROVIDERS[provider];
  const modelSel = document.getElementById("set-model");
  modelSel.innerHTML = P.models.map(m => `<option value="${m}">${m}</option>`).join("");

  const savedModel = localStorage.getItem("fta_model_" + provider);
  if (savedModel && P.models.includes(savedModel)) modelSel.value = savedModel;

  document.getElementById("set-key").value = localStorage.getItem("fta_key_" + provider) || "";
  document.getElementById("set-custom").value = localStorage.getItem("fta_custom_model_" + provider) || "";
  document.getElementById("key-url").textContent = P.keyUrl;
  document.getElementById("pdf-note").style.display = P.pdf ? "none" : "block";
}

function persistSettings() {
  const provider = document.getElementById("set-provider").value;
  const key = document.getElementById("set-key").value;
  const model = document.getElementById("set-model").value;
  const custom = document.getElementById("set-custom").value;
  if (!key.trim()) { toast("اكتب مفتاح الـ API الخاص بالمزود ده"); return; }
  saveSettings(provider, key, model, custom);
  toast(`الإعدادات اتحفظت ✓ — شغال دلوقتي على ${PROVIDERS[provider].label}`);
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

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tab-btn").forEach(b =>
    b.addEventListener("click", () => switchTab(b.dataset.tab)));

  // populate provider dropdown from the registry
  const provSel = document.getElementById("set-provider");
  provSel.innerHTML = Object.entries(PROVIDERS)
    .map(([id, p]) => `<option value="${id}">${p.label}</option>`).join("");

  // populate the visual-styles catalogue (grouped)
  const styleSel = document.getElementById("board-style-sel");
  styleSel.innerHTML = '<option value="">— من غير ستايل محدد (الموديل يختار) —</option>' +
    STYLE_GROUPS.map(g =>
      `<optgroup label="${g.group}">` +
      g.styles.map(([val, label]) => `<option value="${val}">${label}</option>`).join("") +
      `</optgroup>`).join("");

  const { provider, apiKey } = getSettings();
  provSel.value = provider;
  fillProviderUI(provider);
  provSel.addEventListener("change", () => fillProviderUI(provSel.value));

  document.getElementById("plan-pdf").addEventListener("change", e => {
    const f = e.target.files[0];
    document.getElementById("pdf-name").textContent = f ? `📄 ${f.name}` : "";
  });

  if (!apiKey) switchTab("settings");
});
