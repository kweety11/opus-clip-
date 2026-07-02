/* ============================================================
   FILM-TREND AI — UI logic
   Steps: script (brief + specs) / storyboard / voice / settings.
   Streams LLM output (any configured provider) and renders markdown.
   All user-visible strings go through t() (js/i18n.js).
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

  // dir="auto" makes each block flow by its own language (Arabic → RTL,
  // English prompts → LTR) so mixed output always reads clean.
  const closeBlocks = () => {
    if (inList) { html += "</ul>"; inList = false; }
    if (inTable) { html += "</table></div>"; inTable = false; }
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
    if (h) { closeBlocks(); html += `<h${h[1].length + 1} dir="auto">${inline(h[2])}</h${h[1].length + 1}>`; continue; }

    if (/^\s*[-*•]\s+/.test(line)) {
      if (inTable) { html += "</table></div>"; inTable = false; }
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li dir="auto">${inline(line.replace(/^\s*[-*•]\s+/, ""))}</li>`;
      continue;
    }

    if (/^\s*\|/.test(line)) {
      if (inList) { html += "</ul>"; inList = false; }
      if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue; // separator row
      if (!inTable) { html += '<div class="tblw"><table>'; inTable = true; }
      const cells = line.trim().replace(/^\||\|$/g, "").split("|");
      html += "<tr>" + cells.map(c => `<td dir="auto">${inline(c.trim())}</td>`).join("") + "</tr>";
      continue;
    }

    if (/^\s*(---|━+)\s*$/.test(line)) { closeBlocks(); html += "<hr>"; continue; }
    if (line.trim() === "") { closeBlocks(); continue; }

    closeBlocks();
    html += `<p dir="auto">${inline(line)}</p>`;
  }
  if (inCode) html += "</pre>";
  if (inList) html += "</ul>";
  if (inTable) html += "</table></div>";
  return html;
}

/* ---------- landing / studio views ---------- */
function openStudio() {
  document.body.classList.add("in-studio");
  window.scrollTo(0, 0);
}
function goLanding() {
  document.body.classList.remove("in-studio");
}

/* ---------- stepper tabs ---------- */
function switchTab(name) {
  openStudio();
  document.querySelectorAll(".step-btn").forEach(b =>
    b.classList.toggle("on", b.dataset.tab === name));
  document.querySelectorAll(".panel").forEach(p =>
    p.classList.toggle("show", p.id === "panel-" + name));
  window.scrollTo(0, 0);
}

function markStepDone(tool) {
  const btn = document.querySelector(`.step-btn[data-tab="${tool}"]`);
  if (btn) btn.classList.add("done");
}

/* ---------- shared run/render plumbing ---------- */
function checkReady() {
  const { mode, cloudToken, apiKey } = getSettings();
  if (mode === "cloud" ? !cloudToken : !apiKey) {
    toast(mode === "cloud" ? t("t_need_login") : t("t_need_key"));
    switchTab("settings");
    return false;
  }
  return true;
}

/* ---------- theme ---------- */
function setTheme(name) {
  document.documentElement.dataset.theme = name;
  localStorage.setItem("fta_theme", name);
  document.querySelectorAll(".tdot").forEach(d => d.classList.toggle("on", d.dataset.theme === name));
}

/* one line describing an auto-retry, incl. rate-limit countdowns */
function retryMsg(attempt, max, waitMs) {
  const base = waitMs && waitMs > 10000
    ? t("retrying_rate").replace("{s}", Math.round(waitMs / 1000))
    : t("retrying");
  return `${base} (${attempt}/${max})`;
}

function startRun(tool, text, sysAddon, images) {
  if (!checkReady()) return;
  if (activeController) activeController.abort();

  const out = document.getElementById(`out-${tool}`);
  const btn = document.getElementById(`run-${tool}`);
  const stop = document.getElementById(`stop-${tool}`);
  out.innerHTML = `<p class="thinking">${t("thinking")}</p>`;
  out.dataset.raw = "";
  btn.disabled = true;
  stop.style.display = "inline-flex";

  activeController = runLLM([{ role: "user", text, images: images || [] }], {
    onRetry(attempt, max, waitMs) {
      out.innerHTML = `<p class="thinking">${retryMsg(attempt, max, waitMs)}</p>`;
    },
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
        out.innerHTML = `<p class="thinking">${t("no_result")}</p>`;
        return;
      }
      out.innerHTML = mdToHtml(full);
      document.getElementById(`actions-${tool}`).style.display = "flex";
      markStepDone(tool);
      if (tool === "board") {
        boardView = "full";
        const sb = document.getElementById("split-board");
        if (sb) sb.textContent = t("split");
        // auto-pipeline: split into scene cards and draw the b/w
        // sketches in scene order, one after the other
        if (document.getElementById("board-sketch").checked) {
          setTimeout(() => {
            if (boardView === "full") toggleBoardView();
            if ((window._scenes || []).length) {
              toast(t("sk_auto"));
              drawAllSketches();
            }
          }, 80);
        }
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
  }, sysAddon ? { system: SYSTEM_PROMPT + sysAddon } : {});
}

function stopRun(tool) {
  if (activeController) activeController.abort();
  document.getElementById(`run-${tool}`).disabled = false;
  document.getElementById(`stop-${tool}`).style.display = "none";
}

function copyOut(tool) {
  navigator.clipboard.writeText(document.getElementById(`out-${tool}`).dataset.raw || "")
    .then(() => toast(t("t_copied")));
}

function downloadOut(tool, name) {
  const blob = new Blob([document.getElementById(`out-${tool}`).dataset.raw || ""], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* the studio chat — two specialist agents behind one conversation */
const STUDIO_CHAT_ADDON = `

## ACTIVE MODE — CREATIVE STUDIO CHAT (two agents, one conversation)
You are a two-agent creative studio. In EVERY reply you act as exactly ONE agent and open with its signature:
- «🎯 الاستراتيجي:» — THE STRATEGIST: a world-class social-media & marketing consultant. Documents, brand questions, analysis, marketing → he answers. His deliverable is a professional BRIEF: brand & product (real facts), business objective, target audience & insight, core message, tone of voice, platforms & formats, creative direction, mandatories/constraints.
- «🎬 المخرج:» — THE DIRECTOR: an award-winning film director & screenwriter (drama, ads, UGC). Ideas, stories, scripts, scenes → he answers. His deliverable is a full professional SCRIPT following MODE 2 — SCRIPT of your master instructions (logline, synopsis, characters with Visual Identity Lines, structure, numbered scenes with dialogue & timing, MASTER PROMPT).
Pick the agent from the user's need. When a brief exists and the user asks for the script, the Director builds on that brief. Both are exceptionally professional, creative and inspiring — the user is a filmmaker; elevate every idea, never be generic.

REPLY PROTOCOL — every reply has up to two parts:
1. CHAT: a short, sharp, inspiring message (1-4 sentences, user's language) — what you did, one brilliant observation, or ONE critical question if something essential is missing. Never dump the deliverable here.
2. DELIVERABLE: only when you actually produced a brief or a script, add a line containing exactly:
=== OUTPUT ===
followed by the COMPLETE deliverable in clean markdown. Nothing after it. Casual conversation gets part 1 only — no marker.

STRICT DOCUMENT GROUNDING: attached documents (text or scanned page images) are the source of truth — real brand, real product, real numbers. Read every word, Arabic or English, analyze the visuals, and never invent facts that are not there.
DEEPTHINK: when the request contains "DEEPTHINK: on", think much harder before answering — explore multiple angles, draft alternatives, self-critique, keep only the strongest ideas — then deliver ONLY the polished result (never show the reasoning).`;

/* agent #3 — director / storyboard artist (Storyboard step) */
const BOARD_AGENT_ADDON = `

## ACTIVE AGENT — #3 DIRECTOR & STORYBOARD ARTIST (Storyboard step)
You are now operating as agent #3 of the studio's specialist team: a film director + storyboard artist + AI prompt engineer for image/video generation. Operate ONLY in STORYBOARD mode. Follow the per-scene code-block format exactly and honor INCLUDE VOICE-OVER strictly.`;

/* ---------- step 1: studio chat (strategist + director) ---------- */
let studioHistory = [];
let chatBusy = false;
let pendingFile = null;
let deepthink = localStorage.getItem("fta_deepthink") === "1";
const OUTPUT_MARKER = /\n?\s*={2,}\s*OUTPUT\s*={2,}\s*\n?/i;

function chatBubble(role, html) {
  const log = document.getElementById("chat-log");
  const div = document.createElement("div");
  div.className = "msg " + role + (role === "ai" ? " md" : "");
  div.innerHTML = html;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

function chatFilePicked(input) {
  pendingFile = input.files[0] || null;
  document.getElementById("chat-file-chip").textContent = pendingFile ? `📎 ${pendingFile.name}` : "";
}

function toggleDeepthink() {
  deepthink = !deepthink;
  localStorage.setItem("fta_deepthink", deepthink ? "1" : "0");
  applyDeepthinkUI();
  toast(deepthink ? t("dt_on") : t("dt_off"));
}
function applyDeepthinkUI() {
  const b = document.getElementById("deepthink-btn");
  if (b) { b.classList.toggle("on", deepthink); b.textContent = deepthink ? "🧠 DeepThink ✓" : "🧠 DeepThink"; }
}

/* the deliverable half of a split reply lands in the output panel */
function setDeliverable(md) {
  const out = document.getElementById("out-script");
  out.dataset.raw = md;
  out.innerHTML = mdToHtml(md);
  document.getElementById("actions-script").style.display = "flex";
  markStepDone("script");
  if (/SCENE|مشهد|FORMAT:/i.test(md)) {
    lastScript = md;
    const carry = document.getElementById("carry-note");
    if (carry) carry.style.display = "block";
  }
}

async function chatSend() {
  if (chatBusy) return;
  if (!checkReady()) return;

  const ta = document.getElementById("chat-text");
  let text = ta.value.trim();
  const file = pendingFile;
  if (!text && !file) { toast(t("t_idea")); return; }

  chatBusy = true;
  document.getElementById("chat-send").disabled = true;

  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  chatBubble("user", esc(text || "…") + (file ? `<div class="chip">📎 ${esc(file.name)}</div>` : ""));
  ta.value = "";
  pendingFile = null;
  document.getElementById("chat-file-chip").textContent = "";
  document.getElementById("chat-file").value = "";

  // extract the attached document locally (works with every provider)
  let images = [];
  if (file) {
    const extracting = chatBubble("ai", `<p class="thinking">${t("t_reading_doc")}</p>`);
    try {
      const doc = await extractDocument(file);
      if (doc.images && doc.images.length) images.push(...doc.images);
      if (doc.text) {
        text += `\n\n===== ATTACHED DOCUMENT «${file.name}» =====\n${doc.text.slice(0, 60000)}\n===== END OF DOCUMENT =====`;
      }
      if (images.length) {
        text += `\n\n[The attached document «${file.name}» ${doc.text ? "also includes" : "is scanned/visual — its pages are attached as"} images. Read ALL text inside them (Arabic or English) and analyze every visual, logo, chart and product shown. Base your work strictly on this real content.]`;
      }
      extracting.remove();
      if (!text.trim()) text = "Analyze this document and produce the professional brief.";
    } catch (e) {
      extracting.remove();
      chatBubble("ai", `<p class="err">⚠️ ${e.message}</p>`);
      chatBusy = false;
      document.getElementById("chat-send").disabled = false;
      return;
    }
  }

  text += `\n\nDEEPTHINK: ${deepthink ? "on" : "off"}`;

  studioHistory.push({ role: "user", text, images });
  if (studioHistory.length > 16) studioHistory = studioHistory.slice(-16);

  const aiDiv = chatBubble("ai", '<p class="thinking">⏳ …</p>');
  const out = document.getElementById("out-script");
  let raw = "";

  // live split: chat part streams into the bubble; once the marker
  // appears, the deliverable streams into the output panel
  const renderSplit = final => {
    const m = raw.split(OUTPUT_MARKER);
    aiDiv.innerHTML = mdToHtml(m[0].trim() || "…");
    if (m.length > 1) {
      out.dataset.raw = m.slice(1).join("\n").trim();
      out.innerHTML = mdToHtml(out.dataset.raw);
      if (!final) out.scrollTop = out.scrollHeight;
    }
    const log = document.getElementById("chat-log");
    log.scrollTop = log.scrollHeight;
  };

  activeController = runLLM(studioHistory, {
    onRetry(attempt, max, waitMs) {
      aiDiv.innerHTML = `<p class="thinking">${retryMsg(attempt, max, waitMs)}</p>`;
    },
    onText(d) {
      raw += d;
      renderSplit(false);
    },
    onDone(full) {
      chatBusy = false;
      document.getElementById("chat-send").disabled = false;
      activeController = null;
      if (!full.trim()) { aiDiv.innerHTML = `<p class="thinking">${t("no_result")}</p>`; return; }
      raw = full;
      renderSplit(true);
      studioHistory.push({ role: "assistant", text: full });
      const parts = full.split(OUTPUT_MARKER);
      if (parts.length > 1 && parts.slice(1).join("\n").trim()) {
        setDeliverable(parts.slice(1).join("\n").trim());
      }
    },
    onError(msg) {
      chatBusy = false;
      document.getElementById("chat-send").disabled = false;
      activeController = null;
      aiDiv.innerHTML = `<p class="err">⚠️ ${msg}</p>`;
    },
  }, { system: SYSTEM_PROMPT + STUDIO_CHAT_ADDON });
}

/* ---------- step 3: storyboard ---------- */
let boardCharImage = null; // {mime, b64} — consistent character reference

async function boardCharPicked(input) {
  const file = input.files[0];
  if (!file) { boardCharImage = null; document.getElementById("board-char-thumb").style.display = "none"; return; }
  boardCharImage = { mime: file.type, b64: await fileToBase64(file) };
  const thumb = document.getElementById("board-char-thumb");
  thumb.src = `data:${boardCharImage.mime};base64,${boardCharImage.b64}`;
  thumb.style.display = "block";
  toast(t("char_set"));
}

function runBoard() {
  let script = document.getElementById("board-script").value.trim();
  if (!script && lastScript) script = lastScript;
  if (!script) { toast(t("t_script_first")); return; }
  const styleSel = document.getElementById("board-style-sel").value;
  const styleCustom = document.getElementById("board-style").value.trim();
  const style = [styleSel, styleCustom].filter(Boolean).join(", ");
  const ratio = document.getElementById("board-ratio").value;
  const withVO = document.getElementById("board-vo").checked;
  const charName = document.getElementById("board-char-name").value.trim();

  let req = `MODE: STORYBOARD\nASPECT RATIO: ${ratio}\nINCLUDE VOICE-OVER: ${withVO ? "yes" : "no"}${style ? "\nVISUAL STYLE: " + style : ""}`;
  if (boardCharImage) {
    req += `\n\nCHARACTER REFERENCE: a photo of the main character${charName ? ` «${charName}»` : ""} is attached. ` +
      `Study it and write the Visual Identity Line to match this EXACT person; reuse it verbatim in every scene, ` +
      `and add the **CHARACTER REF:** line inside every scene code block where this character appears.`;
  }
  req += `\n\nSCRIPT:\n${script}`;
  startRun("board", req, BOARD_AGENT_ADDON, boardCharImage ? [boardCharImage] : []);
}

function useLastScript() {
  if (!lastScript) { toast(t("t_no_script")); return; }
  document.getElementById("board-script").value = lastScript;
  toast(t("t_script_set"));
}

/* ---------- storyboard: split into standalone scene cards ---------- */
let boardView = "full"; // full | scenes

function splitScenes(raw) {
  // scenes are delimited by the machine-parsed header: ━━━ SCENE 04 …
  const parts = raw.split(/(?=━{2,}\s*SCENE\s)/i).filter(p => /━{2,}\s*SCENE\s/i.test(p));
  return parts.map(p => {
    const header = (p.match(/━{2,}\s*(SCENE[^━\n]*)/i) || [, "SCENE"])[1].trim();
    // lookahead stops at the next section: audio note, next scene, another
    // field (possibly **bold**), a code fence, a table row, or a heading
    const stop = "(?=\\n\\s*(?:🔊|━{2,}|\\*{0,2}SKETCH PROMPT|\\*{0,2}IMAGE PROMPT|\\*{0,2}MOTION PROMPT|\\*{0,2}VOICE-?OVER|\\*{0,2}CHARACTER REF|```|\\||#)|$)";
    const grab = label =>
      (p.match(new RegExp(label + "[^:\\n]*:?\\*{0,2}\\s*\\n?([\\s\\S]*?)" + stop, "i")) || [, ""])[1].trim();
    const sketch = grab("SKETCH PROMPT");
    const img = grab("IMAGE PROMPT");
    const mot = grab("MOTION PROMPT");
    const vo = grab("VOICE-?OVER");
    const ref = grab("CHARACTER REF");
    return { header, full: p.trim(), sketch, img, mot, vo, ref };
  });
}

function copyText(txt, label) {
  navigator.clipboard.writeText(txt).then(() => toast(label + " — " + t("t_copied")));
}

function scenePromptBlock(i, field, labelKey, copyKey, dir) {
  const s = window._scenes[i];
  if (!s[field]) return "";
  return `
    <div class="scene-prompt">
      <div class="sp-head"><span>${t(labelKey)}</span>
        <button class="btn btn-ghost btn-xs" onclick="copyText(window._scenes[${i}].${field}, t('${copyKey}'))">${t("copy")}</button>
      </div>
      <pre dir="${dir}">${s[field].replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>
    </div>`;
}

function toggleBoardView() {
  const out = document.getElementById("out-board");
  const btn = document.getElementById("split-board");
  const raw = out.dataset.raw || "";

  if (boardView === "full") {
    const scenes = splitScenes(raw);
    if (!scenes.length) { toast(t("t_no_scenes")); return; }
    window._scenes = scenes;
    // sketch boxes always render — the checkbox only controls auto-drawing
    const wantSketches = scenes.some(s => s.sketch || s.img);
    out.innerHTML =
      (wantSketches ? `<button class="btn btn-ghost btn-sm" style="margin-bottom:14px" onclick="drawAllSketches()">${t("sk_all")}</button>` : "") +
      scenes.map((s, i) => `
      <div class="scene-card">
        <div class="scene-head">
          <b>🎬 ${s.header.replace(/━/g, "").trim()}</b>
          <button class="btn btn-ghost btn-xs" onclick="copyText(window._scenes[${i}].full, t('copied_scene'))">${t("scene_full")}</button>
        </div>
        ${wantSketches ? `
        <div class="sketch-box" id="sketch-${i}">
          <button class="btn btn-ghost btn-xs" onclick="drawSketch(${i})">${t("sk_draw")}</button>
        </div>` : ""}
        ${scenePromptBlock(i, "sketch", "sk_prompt", "copied_sk", "ltr")}
        ${scenePromptBlock(i, "img", "scene_img", "copied_img", "ltr")}
        ${scenePromptBlock(i, "mot", "scene_mot", "copied_mot", "ltr")}
        ${scenePromptBlock(i, "vo", "scene_vo", "copied_vo", "auto")}
        ${scenePromptBlock(i, "ref", "scene_ref", "copied_scene", "ltr")}
      </div>`).join("");
    btn.textContent = t("split_back");
    boardView = "scenes";
    toast(scenes.length + t("t_scenes_done"));
  } else {
    out.innerHTML = mdToHtml(raw);
    btn.textContent = t("split");
    boardView = "full";
  }
}

/* ---------- storyboard sketches (b/w, drawn by the free Gemini image model) ---------- */
async function drawSketch(i) {
  const s = window._scenes && window._scenes[i];
  if (!s) return "done";
  const box = document.getElementById("sketch-" + i);
  if (!box) return "done";
  const desc = s.sketch || s.img || s.header;
  box.innerHTML = `<span class="sketch-status">${t("sk_drawing")}</span>`;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  try {
    const dataUrl = await sketchGenerate(desc, boardCharImage);
    const num = String(i + 1).padStart(2, "0");
    box.innerHTML = `<img src="${dataUrl}" alt="storyboard sketch">
      <a class="btn btn-ghost btn-xs" style="margin-top:8px" href="${dataUrl}" download="sketch-scene-${num}.png">${t("sk_dl")}</a>`;
    return "done";
  } catch (e) {
    const msg = e.message === "NO_KEY" ? t("sk_no_key")
      : e.message === "RATE" ? t("sk_rate")
      : e.message === "BUSY" ? t("sk_busy")
      : e.message === "BAD_KEY" ? t("v_bad_key")
      : t("sk_fail");
    box.innerHTML = `<button class="btn btn-ghost btn-xs" onclick="drawSketch(${i})">${t("sk_draw")}</button> <span class="sketch-status">⚠️ ${msg}</span>`;
    if (e.message === "NO_KEY") { switchTab("settings"); toast(t("sk_no_key")); return "stop"; }
    if (e.message === "RATE") return "wait"; // free tier: pause then continue
    return "done";
  }
}

/* the visible one-click entry: split if needed, then draw everything in order */
async function generateSketches() {
  const btn = document.getElementById("gen-sketches");
  if (sketchesRunning) return;
  if (boardView === "full") toggleBoardView();
  if (!(window._scenes || []).length) return; // toggleBoardView already toasted
  if (btn) { btn.disabled = true; btn.textContent = t("sk_gen_busy"); }
  toast(t("sk_auto"));
  await drawAllSketches();
  if (btn) { btn.disabled = false; btn.textContent = t("sk_gen_done"); }
}

let sketchesRunning = false;
async function drawAllSketches() {
  if (sketchesRunning) return;
  sketchesRunning = true;
  try {
    const n = (window._scenes || []).length;
    for (let i = 0; i < n; i++) {
      // sequential on purpose — the free tier rate-limits parallel image calls
      const r = await drawSketch(i);
      if (r === "stop") break;
      if (r === "wait") {
        // rate-limited: breathe for a minute, retry the same scene once
        await new Promise(res => setTimeout(res, 61000));
        await drawSketch(i);
      }
    }
  } finally {
    sketchesRunning = false;
  }
}

/* ---------- step 4: voice-over (Google Gemini TTS / ElevenLabs) ---------- */
let lastWavUrl = null;

const VO_EXTRACT_SYSTEM = `You are a voice-over script extractor. From the given screenplay, extract ONLY the words that will be spoken aloud (dialogue lines and narration/V.O.), in their original order and original language.
Remove completely: scene headers, action/description lines, camera notes, durations, character name labels, parentheticals, markdown, and any prompts.
Merge the result into clean flowing voice-over text, one paragraph per beat. Return ONLY the spoken text — no titles, no commentary.`;

function useScriptForVoice() {
  if (!lastScript) { toast(t("t_no_script")); return; }
  if (!checkReady()) return;
  const ta = document.getElementById("voice-text");
  const btn = document.getElementById("voice-pull");
  ta.value = "";
  ta.placeholder = t("vo_extracting");
  btn.disabled = true;

  runLLM([{ role: "user", text: "SCRIPT:\n" + lastScript.slice(0, 30000) }], {
    onRetry(a, m, w) { ta.placeholder = retryMsg(a, m, w); },
    onText(d) { ta.value += d; ta.scrollTop = ta.scrollHeight; },
    onDone(full) {
      btn.disabled = false;
      ta.value = full.trim();
      ta.placeholder = t("v_text_ph");
      if (full.trim()) toast(t("t_vo_ready"));
    },
    onError(msg) {
      btn.disabled = false;
      ta.placeholder = t("v_text_ph");
      toast(msg);
    },
  }, { system: VO_EXTRACT_SYSTEM });
}

/* voice provider switching (Google Gemini / ElevenLabs) */
function fillVoiceList() {
  const provider = document.getElementById("voice-provider").value;
  const sel = document.getElementById("voice-name");
  if (provider === "gemini") {
    sel.innerHTML = TTS_VOICES.map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
    return;
  }
  sel.innerHTML = `<option value="">${t("v_eleven_loading")}</option>`;
  const fill = vs => { sel.innerHTML = vs.map(([id, label]) => `<option value="${id}">${label}</option>`).join(""); };
  elevenVoices()
    .then(vs => fill(vs.length ? vs : ELEVEN_DEFAULT_VOICES))
    .catch(e => {
      if (e.message === "NO_KEY") { sel.innerHTML = ""; return; }
      // restricted keys can't list voices but can still speak —
      // fall back to the premade voices instead of rejecting the key
      fill(ELEVEN_DEFAULT_VOICES);
      toast(t("v_eleven_fallback"));
    });
}

function voiceProviderChanged() {
  const provider = document.getElementById("voice-provider").value;
  localStorage.setItem("fta_tts_provider", provider);
  document.getElementById("eleven-box").style.display = provider === "elevenlabs" ? "block" : "none";
  // ElevenLabs follows the text's own dialect — accent steering is a Gemini feature
  document.getElementById("accent-box").style.display = provider === "gemini" ? "block" : "none";
  fillVoiceList();
}

function elevenKeyChanged() {
  localStorage.setItem("fta_key_elevenlabs", document.getElementById("eleven-key").value.trim());
  if (document.getElementById("voice-provider").value === "elevenlabs") fillVoiceList();
}

async function runVoice() {
  const text = document.getElementById("voice-text").value.trim();
  if (!text) { toast(t("v_write_first")); return; }

  const status = document.getElementById("voice-status");
  const result = document.getElementById("voice-result");
  const btn = document.getElementById("run-voice");
  const voice = document.getElementById("voice-name").value;
  const style = TTS_STYLES[document.getElementById("voice-style").value] || "";
  const accent = document.getElementById("voice-accent").value;
  const provider = document.getElementById("voice-provider").value;

  if (provider === "elevenlabs" && !(localStorage.getItem("fta_key_elevenlabs") || "").trim()) {
    status.className = "voice-status err";
    status.textContent = "⚠️ " + t("v_eleven_key");
    document.getElementById("eleven-key").focus();
    return;
  }

  status.className = "voice-status";
  status.textContent = t("v_generating");
  result.style.display = "none";
  btn.disabled = true;

  try {
    const audio = provider === "elevenlabs"
      ? await elevenGenerate(text, voice)
      : await ttsGenerate(text, voice, style, accent);
    if (lastWavUrl) URL.revokeObjectURL(lastWavUrl);
    lastWavUrl = URL.createObjectURL(audio);
    document.getElementById("voice-audio").src = lastWavUrl;
    result.style.display = "block";
    status.textContent = t("v_ready");
    markStepDone("voice");
    const ext = provider === "elevenlabs" ? "mp3" : "wav";
    document.getElementById("voice-dl").onclick = () => {
      const a = document.createElement("a");
      a.href = lastWavUrl;
      a.download = "filmtrend-voiceover." + ext;
      a.click();
    };
  } catch (e) {
    status.className = "voice-status err";
    if (e.message === "NO_KEY") {
      status.textContent = t("v_no_key");
      switchTab("settings");
      toast(t("v_add_key_toast"));
    } else if (e.message.startsWith("BAD_KEY")) {
      status.textContent = provider === "elevenlabs" ? "⚠️ " + t("v_eleven_bad") : t("v_bad_key");
    } else if (e.message.startsWith("RATE")) {
      status.textContent = t("v_rate");
    } else {
      status.textContent = t("v_err") + e.message;
    }
  } finally {
    btn.disabled = false;
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
  document.getElementById("key-url") && (document.getElementById("key-url").textContent = P.keyUrl);
  document.getElementById("pdf-note").style.display = P.pdf ? "none" : "block";
}

function persistSettings() {
  const provider = document.getElementById("set-provider").value;
  const key = document.getElementById("set-key").value;
  const model = document.getElementById("set-model").value;
  const custom = document.getElementById("set-custom").value;
  if (!key.trim()) { toast(t("t_key_first")); return; }
  saveSettings(provider, key, model, custom);
  localStorage.setItem("fta_mode", "byok");
  toast(t("t_saved_pre") + PROVIDERS[provider].label);
}

/* ---------- cloud account mode ---------- */
function setMode(mode) {
  localStorage.setItem("fta_mode", mode);
  document.querySelectorAll(".mode-btn").forEach(b =>
    b.classList.toggle("on", b.dataset.mode === mode));
  document.getElementById("cloud-box").style.display = mode === "cloud" ? "block" : "none";
  document.getElementById("byok-box").style.display = mode === "byok" ? "block" : "none";
}

function renderUsage(u) {
  const box = document.getElementById("cloud-usage");
  if (!u) { box.style.display = "none"; return; }
  box.style.display = "block";
  if (u.paid) {
    box.innerHTML = t("usage_paid") + (u.paid_until ? ` (${u.paid_until})` : "");
  } else if (u.active) {
    box.innerHTML = LANG === "ar"
      ? `🎁 <b>التجربة المجانية شغالة</b> — استخدمت <b>${u.used}</b> من <b>${u.limit}</b> توليدة · تنتهي ${u.trial_ends}`
      : `🎁 <b>Free trial active</b> — used <b>${u.used}</b> of <b>${u.limit}</b> generations · ends ${u.trial_ends}`;
  } else {
    box.innerHTML = t("usage_over");
  }
}

async function doCloudSignup() {
  const email = document.getElementById("cloud-email").value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast(t("t_need_email")); return; }
  try {
    const usage = await cloudSignup(email);
    localStorage.setItem("fta_mode", "cloud");
    renderUsage(usage);
    toast(t("t_signup_ok"));
  } catch (e) {
    toast(t("t_signup_fail"));
  }
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

/* ---------- language: refresh JS-generated strings on toggle ---------- */
function refreshDynamicLang() {
  const noneOpt = document.querySelector('#board-style-sel option[value=""]');
  if (noneOpt) noneOpt.textContent = t("b_style_none");
  const sb = document.getElementById("split-board");
  if (sb) sb.textContent = boardView === "full" ? t("split") : t("split_back");
}
const _baseToggleLang = toggleLang;
toggleLang = function () { _baseToggleLang(); refreshDynamicLang(); };

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  applyLang();
  setTheme(localStorage.getItem("fta_theme") || "ocean");

  document.querySelectorAll(".step-btn").forEach(b =>
    b.addEventListener("click", () => switchTab(b.dataset.tab)));

  // voice-over: restore provider + accent, populate the voices list
  const savedTts = localStorage.getItem("fta_tts_provider") || "gemini";
  document.getElementById("voice-provider").value = savedTts;
  document.getElementById("eleven-key").value = localStorage.getItem("fta_key_elevenlabs") || "";
  voiceProviderChanged();

  // populate provider dropdown from the registry
  const provSel = document.getElementById("set-provider");
  provSel.innerHTML = Object.entries(PROVIDERS)
    .map(([id, p]) => `<option value="${id}">${p.label}</option>`).join("");

  // populate the visual-styles catalogue (grouped)
  const styleSel = document.getElementById("board-style-sel");
  styleSel.innerHTML = `<option value="">${t("b_style_none")}</option>` +
    STYLE_GROUPS.map(g =>
      `<optgroup label="${g.group}">` +
      g.styles.map(([val, label]) => `<option value="${val}">${label}</option>`).join("") +
      `</optgroup>`).join("");

  // studio chat: Enter sends, Shift+Enter = new line; restore DeepThink state
  const chatTa = document.getElementById("chat-text");
  chatTa.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chatSend(); }
  });
  applyDeepthinkUI();

  const { mode, provider, apiKey, cloudToken } = getSettings();
  provSel.value = provider;
  fillProviderUI(provider);
  provSel.addEventListener("change", () => fillProviderUI(provSel.value));

  // cloud mode only appears when the owner has deployed the backend
  if (backendUrl()) {
    document.getElementById("mode-switch").style.display = "flex";
    setMode(mode === "cloud" ? "cloud" : (cloudToken || !apiKey ? "cloud" : "byok"));
    const savedEmail = localStorage.getItem("fta_cloud_email");
    if (savedEmail) document.getElementById("cloud-email").value = savedEmail;
    cloudUsage().then(renderUsage);
  }

  // returning users land straight in the studio; new visitors see the landing page
  const ready = (mode === "cloud" && cloudToken) || apiKey;
  if (ready) openStudio();
});
