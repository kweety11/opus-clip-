/* ============================================================
   MEDIA STUDIO AI — Claude API client (browser, raw HTTP + SSE)
   No SDK bundler here, so we call POST /v1/messages directly.
   The user's API key stays in their browser (localStorage).
   ============================================================ */

const API_URL = "https://api.anthropic.com/v1/messages";

function getSettings() {
  return {
    apiKey: localStorage.getItem("msai_key") || "",
    model: localStorage.getItem("msai_model") || "claude-opus-4-8",
  };
}

function saveSettings(apiKey, model) {
  localStorage.setItem("msai_key", apiKey.trim());
  localStorage.setItem("msai_model", model);
}

/**
 * Stream a completion from Claude.
 * @param {Array}  content  user content blocks (text and/or document)
 * @param {Object} handlers { onText(delta), onDone(fullText), onError(msg) }
 * @returns {AbortController}
 */
function runClaude(content, handlers) {
  const { apiKey, model } = getSettings();
  const controller = new AbortController();

  const body = {
    model,
    max_tokens: 64000,
    stream: true,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  };
  // Haiku 4.5 predates adaptive thinking — only send it to 4.6+ tiers
  if (!model.startsWith("claude-haiku")) {
    body.thinking = { type: "adaptive" };
  }

  (async () => {
    let full = "";
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          // required for calling the API from a browser page
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const err = await res.json();
          msg = err?.error?.message || msg;
        } catch (_) { /* non-JSON error body */ }
        if (res.status === 401) msg = "مفتاح API غير صحيح — راجع الإعدادات ⚙️";
        if (res.status === 429) msg = "تجاوزت حد الطلبات — استنى شوية وحاول تاني";
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

        // SSE frames are separated by a blank line
        const frames = buf.split("\n\n");
        buf = frames.pop();
        for (const frame of frames) {
          const dataLine = frame.split("\n").find(l => l.startsWith("data:"));
          if (!dataLine) continue;
          let ev;
          try { ev = JSON.parse(dataLine.slice(5)); } catch (_) { continue; }

          if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
            full += ev.delta.text;
            handlers.onText(ev.delta.text);
          } else if (ev.type === "message_delta" && ev.delta?.stop_reason === "refusal") {
            handlers.onError("الطلب اترفض لأسباب تتعلق بسياسة الاستخدام — جرّب تعيد صياغته");
            return;
          } else if (ev.type === "error") {
            handlers.onError(ev.error?.message || "خطأ من الخادم");
            return;
          }
        }
      }
      handlers.onDone(full);
    } catch (e) {
      if (e.name === "AbortError") handlers.onDone(full);
      else handlers.onError("تعذّر الاتصال بالخادم — اتأكد من الإنترنت ومفتاح الـ API");
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
