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
    label: "🇺🇸 Google — Gemini",
    protocol: "openai",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: ["gemini-3-pro-preview", "gemini-2.5-pro", "gemini-2.5-flash"],
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
function getSettings() {
  const provider = localStorage.getItem("fta_provider") || "anthropic";
  const p = PROVIDERS[provider] ? provider : "anthropic";
  const custom = (localStorage.getItem("fta_custom_model_" + p) || "").trim();
  return {
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
function runLLM(content, handlers) {
  const { provider, apiKey, model } = getSettings();
  const P = PROVIDERS[provider];
  const controller = new AbortController();

  const hasPdf = content.some(b => b.type === "document");
  if (hasPdf && !P.pdf) {
    handlers.onError("رفع الـ PDF متاح حاليًا مع Claude بس — اختار Anthropic من الإعدادات أو انسخ نص البريف في الخانة");
    return controller;
  }

  let url, headers, body;

  if (P.protocol === "anthropic") {
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
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    };
    if (!model.startsWith("claude-haiku")) body.thinking = { type: "adaptive" };
  } else {
    url = P.url;
    headers = {
      "content-type": "application/json",
      "authorization": "Bearer " + apiKey,
    };
    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "https://film-trend.ai";
      headers["X-Title"] = "Film-trend AI";
    }
    const userText = content.filter(b => b.type === "text").map(b => b.text).join("\n\n");
    body = {
      model,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
    };
  }

  (async () => {
    let full = "";
    try {
      const res = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const err = await res.json();
          msg = err?.error?.message || err?.message || JSON.stringify(err).slice(0, 200);
        } catch (_) { /* non-JSON error body */ }
        if (res.status === 401 || res.status === 403) msg = `مفتاح ${P.label.replace(/^[^ ]+ /, "")} غير صحيح — راجع الإعدادات ⚙️`;
        if (res.status === 429) msg = "تجاوزت حد الطلبات أو الرصيد خلص — راجع حسابك عند المزود";
        handlers.onError(msg);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

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
                handlers.onError("الطلب اترفض لأسباب تتعلق بسياسة الاستخدام — جرّب تعيد صياغته");
                return;
              } else if (ev.type === "error") {
                handlers.onError(ev.error?.message || "خطأ من الخادم");
                return;
              }
            } else {
              delta = ev.choices?.[0]?.delta?.content || "";
              if (ev.error) {
                handlers.onError(ev.error.message || "خطأ من الخادم");
                return;
              }
            }
            if (delta) {
              full += delta;
              handlers.onText(delta);
            }
          }
        }
      }
      handlers.onDone(full);
    } catch (e) {
      if (e.name === "AbortError") handlers.onDone(full);
      else handlers.onError("تعذّر الاتصال بـ " + P.label.replace(/^[^ ]+ /, "") + " — اتأكد من الإنترنت والمفتاح");
    }
  })();

  return controller;
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
