/* ============================================================
   FILM-TREND AI — multi-provider LLM client (browser, raw HTTP + SSE)
   Two wire protocols cover the whole market:
   - "anthropic": Claude Messages API
   - "openai":    OpenAI-compatible /chat/completions (OpenAI, Gemini,
                  Grok, DeepSeek, Qwen, Kimi, GLM, Mistral, Groq, OpenRouter)
   Keys are stored per-provider in localStorage and never leave the browser.
   ============================================================ */

const PROVIDERS = {
  anthropic: {
    label: "🇺🇸 Anthropic — Claude",
    protocol: "anthropic",
    url: "https://api.anthropic.com/v1/messages",
    models: ["claude-opus-4-8", "claude-sonnet-5", "claude-haiku-4-5"],
    keyUrl: "platform.claude.com",
    pdf: true,
  },
  openai: {
    label: "🇺🇸 OpenAI — GPT",
    protocol: "openai",
    url: "https://api.openai.com/v1/chat/completions",
    models: ["gpt-5.1", "gpt-5.1-mini", "gpt-4o"],
    keyUrl: "platform.openai.com",
  },
  gemini: {
    label: "🇺🇸 Google — Gemini (مفتاح مجاني)",
    protocol: "openai",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: ["gemini-2.5-flash", "gemini-3-pro-preview", "gemini-2.5-pro"],
    keyUrl: "aistudio.google.com/apikey",
  },
  xai: {
    label: "🇺🇸 xAI — Grok",
    protocol: "openai",
    url: "https://api.x.ai/v1/chat/completions",
    models: ["grok-4", "grok-3-mini"],
    keyUrl: "console.x.ai",
  },
  deepseek: {
    label: "🇨🇳 DeepSeek",
    protocol: "openai",
    url: "https://api.deepseek.com/chat/completions",
    models: ["deepseek-chat", "deepseek-reasoner"],
    keyUrl: "platform.deepseek.com",
  },
  qwen: {
    label: "🇨🇳 Alibaba — Qwen",
    protocol: "openai",
    url: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
    models: ["qwen-max", "qwen-plus", "qwen-turbo"],
    keyUrl: "modelstudio.console.alibabacloud.com",
  },
  moonshot: {
    label: "🇨🇳 Moonshot — Kimi",
    protocol: "openai",
    url: "https://api.moonshot.ai/v1/chat/completions",
    models: ["kimi-latest", "kimi-k2-turbo-preview"],
    keyUrl: "platform.moonshot.ai",
  },
  zhipu: {
    label: "🇨🇳 Zhipu — GLM",
    protocol: "openai",
    url: "https://api.z.ai/api/paas/v4/chat/completions",
    models: ["glm-4.6", "glm-4.5-air"],
    keyUrl: "z.ai",
  },
  mistral: {
    label: "🇪🇺 Mistral",
    protocol: "openai",
    url: "https://api.mistral.ai/v1/chat/completions",
    models: ["mistral-large-latest", "mistral-medium-latest"],
    keyUrl: "console.mistral.ai",
  },
  groq: {
    label: "🇺🇸 Groq — Llama وموديلات مفتوحة",
    protocol: "openai",
    url: "https://api.groq.com/openai/v1/chat/completions",
    models: ["llama-3.3-70b-versatile", "moonshotai/kimi-k2-instruct"],
    keyUrl: "console.groq.com",
  },
  openrouter: {
    label: "🌍 OpenRouter — كل الموديلات بمفتاح واحد",
    protocol: "openai",
    url: "https://openrouter.ai/api/v1/chat/completions",
    models: [
      "anthropic/claude-sonnet-4.5",
      "openai/gpt-5.1",
      "google/gemini-3-pro-preview",
      "deepseek/deepseek-chat-v3.1",
      "qwen/qwen3-max",
      "moonshotai/kimi-k2",
      "z-ai/glm-4.6",
      "x-ai/grok-4",
    ],
    keyUrl: "openrouter.ai/keys",
  },
};

/* ---------- settings ---------- */
function backendUrl() {
  // localStorage override lets the owner test a Worker before baking it in
  return (localStorage.getItem("fta_backend") || FT_BACKEND_URL || "").replace(/\/+$/, "");
}

function getSettings() {
  const mode = localStorage.getItem("fta_mode") === "cloud" && backendUrl() ? "cloud" : "byok";
  const provider = localStorage.getItem("fta_provider") || "anthropic";
  const p = PROVIDERS[provider] ? provider : "anthropic";
  const custom = (localStorage.getItem("fta_custom_model_" + p) || "").trim();
  return {
    mode,
    cloudToken: localStorage.getItem("fta_cloud_token") || "",
    provider: p,
    apiKey: localStorage.getItem("fta_key_" + p) || "",
    model: custom || localStorage.getItem("fta_model_" + p) || PROVIDERS[p].models[0],
  };
}

function saveSettings(provider, apiKey, model, customModel) {
  localStorage.setItem("fta_provider", provider);
  localStorage.setItem("fta_key_" + provider, apiKey.trim());
  localStorage.setItem("fta_model_" + provider, model);
  localStorage.setItem("fta_custom_model_" + provider, (customModel || "").trim());
}

/* ============================================================
   streaming client — returns AbortController
   content: array of blocks [{type:"text",text}] and optionally
   one {type:"document", source:{...}} (Claude only)
   ============================================================ */
/**
 * runLLM(messages, handlers, opts)
 * messages: neutral history — [{role:"user"|"assistant", text, images?:[{mime,b64}]}]
 * opts.system: override the system prompt (defaults to SYSTEM_PROMPT)
 */
function runLLM(messages, handlers, opts = {}) {
  const { mode, cloudToken, provider, apiKey, model } = getSettings();
  const P = mode === "cloud" ? { protocol: "cloud", label: "☁️ حساب Film-trend" } : PROVIDERS[provider];
  const controller = new AbortController();
  const system = opts.system || SYSTEM_PROMPT;
  const hasImages = messages.some(m => m.images && m.images.length);

  let url, headers, body;

  if (P.protocol === "cloud") {
    if (hasImages) {
      handlers.onError("رفع الصور متاح في وضع المفتاح الخاص — في حساب Film-trend ارفع مستندات نصية (PDF/Word/PPTX)");
      return controller;
    }
    url = backendUrl() + "/generate";
    headers = { "content-type": "application/json", "authorization": "Bearer " + cloudToken };
    // the worker takes a single user string — flatten the conversation
    const flat = messages.map(m =>
      (m.role === "assistant" ? "ASSISTANT:\n" : "USER:\n") + m.text).join("\n\n");
    body = { system, user: flat };
  } else if (P.protocol === "anthropic") {
    url = P.url;
    headers = {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    };
    body = {
      model,
      max_tokens: 64000,
      stream: true,
      system,
      messages: messages.map(m => ({
        role: m.role,
        content: [
          ...(m.images || []).map(im => ({
            type: "image",
            source: { type: "base64", media_type: im.mime, data: im.b64 },
          })),
          { type: "text", text: m.text },
        ],
      })),
    };
    if (!model.startsWith("claude-haiku")) body.thinking = { type: "adaptive" };
  } else {
    url = P.url;
    headers = { "content-type": "application/json", "authorization": "Bearer " + apiKey };
    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "https://film-trend.ai";
      headers["X-Title"] = "Film-trend AI";
    }
    body = {
      model,
      stream: true,
      messages: [
        { role: "system", content: system },
        ...messages.map(m => ({
          role: m.role,
          content: (m.images && m.images.length)
            ? [
                ...m.images.map(im => ({ type: "image_url", image_url: { url: `data:${im.mime};base64,${im.b64}` } })),
                { type: "text", text: m.text },
              ]
            : m.text,
        })),
      ],
    };
  }

  // strings fall back to Arabic when i18n isn't loaded (defensive)
  const T = k => (typeof t === "function" ? t(k) : ({
    err_overload: "⏳ الموديل عليه ضغط عالي دلوقتي — استنى دقيقة وجرّب تاني، أو بدّل لموديل أخف من الإعدادات.",
    err_rate: "تجاوزت حد الطلبات أو الرصيد خلص — استنى دقيقة أو راجع حسابك عند المزود",
    err_server: "خطأ من الخادم — جرّب تاني",
    err_refusal: "الطلب اترفض لأسباب تتعلق بسياسة الاستخدام — جرّب تعيد صياغته",
    err_conn: "تعذّر الاتصال — اتأكد من الإنترنت والمفتاح",
  })[k] || k);

  // provider error bodies vary wildly: {error:{message}}, [{error:{…}}], {message}…
  const extractErrMsg = raw => {
    const e = Array.isArray(raw) ? raw[0] : raw;
    const inner = (e && typeof e.error === "object") ? e.error : e;
    return (inner && inner.message) || (typeof e?.error === "string" ? e.error : "") || "";
  };
  const isOverload = (status, msg) =>
    [500, 502, 503, 504, 529].includes(status) ||
    /overload|high demand|unavailable|try again later|capacity/i.test(msg || "");

  const MAX_TRIES = 3;
  const RETRY_WAIT = [2500, 6000];

  (async () => {
    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
      let full = "";
      // transient failure before any text arrived → retry automatically
      const retryOrFail = async msg => {
        if (attempt < MAX_TRIES) {
          handlers.onRetry && handlers.onRetry(attempt, MAX_TRIES);
          await new Promise(r => setTimeout(r, RETRY_WAIT[attempt - 1]));
          return true;
        }
        handlers.onError(msg);
        return false;
      };

      try {
        const res = await fetch(url, {
          method: "POST",
          signal: controller.signal,
          headers,
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          let msg = "", code = "";
          try {
            const err = await res.json();
            code = typeof err?.error === "string" ? err.error : "";
            msg = extractErrMsg(err) || code;
          } catch (_) { /* non-JSON error body */ }

          if (P.protocol === "cloud") {
            if (code === "trial_over") { handlers.onError("التجربة المجانية خلصت 🎬 — فعّل الاشتراك (10$/شهر) عشان تكمل"); return; }
            if (code === "daily_cap") { handlers.onError("وصلت للحد اليومي — كمّل بكرة أو فعّل الاشتراك"); return; }
            if (res.status === 401) { handlers.onError("الجلسة انتهت — سجّل بإيميلك تاني من الإعدادات ⚙️"); return; }
          } else {
            if (res.status === 401 || res.status === 403) {
              handlers.onError(`مفتاح ${P.label.replace(/^[^ ]+ /, "")} غير صحيح — راجع الإعدادات ⚙️`);
              return;
            }
          }
          if (isOverload(res.status, msg)) {
            if (await retryOrFail(T("err_overload"))) continue;
            return;
          }
          if (res.status === 429) {
            if (await retryOrFail(T("err_rate"))) continue;
            return;
          }
          handlers.onError(msg || `HTTP ${res.status}`);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "", streamErr = null;

        readloop:
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          const frames = buf.split("\n\n");
          buf = frames.pop();
          for (const frame of frames) {
            for (const line of frame.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (payload === "[DONE]") continue;
              let ev;
              try { ev = JSON.parse(payload); } catch (_) { continue; }

              let delta = "";
              if (P.protocol === "anthropic") {
                if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") delta = ev.delta.text;
                else if (ev.type === "message_delta" && ev.delta?.stop_reason === "refusal") {
                  handlers.onError(T("err_refusal"));
                  return;
                } else if (ev.type === "error") {
                  streamErr = extractErrMsg(ev) || T("err_server");
                  break readloop;
                }
              } else {
                delta = ev.choices?.[0]?.delta?.content || "";
                if (ev.error) {
                  streamErr = extractErrMsg(ev) || T("err_server");
                  break readloop;
                }
              }
              if (delta) {
                full += delta;
                handlers.onText(delta);
              }
            }
          }
        }

        if (streamErr) {
          // overload errors can arrive mid-stream with HTTP 200 — retry those too
          if (!full && isOverload(0, streamErr)) {
            if (await retryOrFail(T("err_overload"))) continue;
            return;
          }
          handlers.onError(streamErr);
          return;
        }
        handlers.onDone(full);
        return;
      } catch (e) {
        if (e.name === "AbortError") { handlers.onDone(full); return; }
        if (await retryOrFail(T("err_conn") + " (" + P.label.replace(/^[^ ]+ /, "") + ")")) continue;
        return;
      }
    }
  })();

  return controller;
}

/* ---------- cloud account (Film-trend backend) ---------- */
async function cloudSignup(email) {
  const res = await fetch(backendUrl() + "/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "signup failed");
  localStorage.setItem("fta_cloud_token", data.token);
  localStorage.setItem("fta_cloud_email", email);
  return data.usage;
}

async function cloudUsage() {
  const token = localStorage.getItem("fta_cloud_token");
  if (!token || !backendUrl()) return null;
  const res = await fetch(backendUrl() + "/me", {
    headers: { authorization: "Bearer " + token },
  });
  if (!res.ok) return null;
  return (await res.json()).usage;
}

/* read a File (PDF) as a base64 string without data: prefix */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
