/* ============================================================
   FILM-TREND AI — storyboard sketch generator
   Draws black-and-white storyboard sketches with Google's free
   image model (gemini-2.5-flash-image). Uses the same free
   Gemini key as the voice-over. When a character reference
   photo is provided it is passed along so the drawn character
   keeps the same face/build in every frame.
   ============================================================ */

const SKETCH_MODEL = "gemini-2.5-flash-image";

const SKETCH_STYLE_PREFIX =
  "Professional film storyboard sketch, black and white pencil and ink drawing, " +
  "rough expressive linework, clear composition and framing, cinematic staging, " +
  "monochrome, no color, storyboard panel style. ";

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

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${SKETCH_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    }
  );

  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) throw new Error("BAD_KEY");
    if (res.status === 429) throw new Error("RATE");
    let msg = "HTTP " + res.status;
    try { msg = (await res.json())?.error?.message || msg; } catch (_) {}
    if (/overload|unavailable|high demand/i.test(msg)) throw new Error("BUSY");
    throw new Error(msg);
  }

  const data = await res.json();
  const blocks = data?.candidates?.[0]?.content?.parts || [];
  const img = blocks.find(p => p.inlineData || p.inline_data);
  if (!img) throw new Error("NO_IMAGE");
  const d = img.inlineData || img.inline_data;
  return `data:${d.mimeType || d.mime_type || "image/png"};base64,${d.data}`;
}
