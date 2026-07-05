/* ============================================================
   FILM-TREND AI — storyboard sketch generator
   Draws black-and-white storyboard sketches with Google's free
   image model (gemini-2.5-flash-image). Uses the same free
   Gemini key as the voice-over. When a character reference
   photo is provided it is passed along so the drawn character
   keeps the same face/build in every frame.
   ============================================================ */

/* tried in order — first available image model on the key wins */
const SKETCH_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];
let _sketchModel = null; // remembered after the first success

const SKETCH_STYLE_PREFIX =
  "Professional hand-drawn storyboard sketch, graphite pencil and fine ink pen on white paper, " +
  "loose confident expressive strokes, cross-hatching and soft pencil shading, " +
  "monochrome black and white, authentic sketchbook look with visible stroke texture, " +
  "clear cinematic composition and framing, no color. ";

/**
 * sketchGenerate(sceneDescription, refImage?) → Promise<dataURL>
 * refImage: {mime, b64} — optional character reference photo.
 */
async function sketchGenerate(sceneDescription, refImage) {
  const key = localStorage.getItem("fta_key_gemini") || "";
  if (!key) throw new Error("NO_KEY");

  const parts = [];
  if (refImage) {
    parts.push({ inline_data: { mime_type: refImage.mime, data: refImage.b64 } });
    parts.push({
      text: SKETCH_STYLE_PREFIX +
        "Draw this scene as a storyboard panel. The main character MUST look like the person " +
        "in the attached reference photo (same face, hair, build) rendered as a b/w sketch:\n" +
        sceneDescription,
    });
  } else {
    parts.push({ text: SKETCH_STYLE_PREFIX + "Draw this scene as a storyboard panel:\n" + sceneDescription });
  }

  // walk the model list: skip names this key doesn't have (404 / not-found)
  const models = _sketchModel ? [_sketchModel] : SKETCH_MODELS;
  let lastErr = "NO_IMAGE";
  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          // image models want TEXT+IMAGE — IMAGE alone is rejected by some
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );

    if (!res.ok) {
      let msg = "HTTP " + res.status;
      try { msg = (await res.json())?.error?.message || msg; } catch (_) {}
      // keep the raw Google message on the error so the UI can surface the real cause
      const fail = code => { const e = new Error(code); e.detail = msg; return e; };
      if (res.status === 404 || /not found|is not supported/i.test(msg)) { lastErr = "NO_MODEL"; continue; }
      if (res.status === 401 || res.status === 403) throw fail("BAD_KEY");
      if (res.status === 429) throw fail("RATE");
      if (/overload|unavailable|high demand/i.test(msg) || res.status >= 500) throw fail("BUSY");
      if (res.status === 400 && /modalit/i.test(msg)) { lastErr = msg; continue; }
      throw fail(msg);
    }

    const data = await res.json();
    const blocks = data?.candidates?.[0]?.content?.parts || [];
    const img = blocks.find(p => p.inlineData || p.inline_data);
    if (!img) { lastErr = "NO_IMAGE"; continue; }
    _sketchModel = model;
    const d = img.inlineData || img.inline_data;
    return `data:${d.mimeType || d.mime_type || "image/png"};base64,${d.data}`;
  }
  throw new Error(lastErr);
}
