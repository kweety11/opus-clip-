/* ============================================================
   FILM-TREND AI — voice-over via Google Gemini TTS
   Uses the user's (free) Google AI Studio key. All voices are
   multilingual — they speak Arabic and English natively.
   ============================================================ */

const TTS_MODEL = "gemini-2.5-flash-preview-tts";

const TTS_VOICES = [
  ["Charon",       "شارون — ذكر · عميق إخباري (ممتاز للوثائقي)"],
  ["Algieba",      "الجيبا — ذكر · دافئ هادئ"],
  ["Orus",         "أوروس — ذكر · حازم واثق"],
  ["Puck",         "پَك — ذكر · حيوي شبابي"],
  ["Fenrir",       "فنرير — ذكر · متحمس قوي"],
  ["Enceladus",    "إنسيلادوس — ذكر · هامس هادئ"],
  ["Rasalgethi",   "رأس الجاثي — ذكر · معلوماتي واضح"],
  ["Schedar",      "شيدار — ذكر · متزن رسمي"],
  ["Kore",         "كوري — أنثى · واضح احترافي"],
  ["Zephyr",       "زفير — أنثى · مشرق مبهج"],
  ["Leda",         "ليدا — أنثى · شبابي خفيف"],
  ["Aoede",        "أويدي — أنثى · منطلق طبيعي"],
  ["Despina",      "ديسبينا — أنثى · ناعم حنون"],
  ["Erinome",      "إرينومي — أنثى · واضح مباشر"],
  ["Achernar",     "أخر النهر — أنثى · ناعم راقي"],
  ["Sulafat",      "سولافات — أنثى · دافئ قصصي"],
];

const TTS_STYLES = {
  none:  "",
  doc:   "Read the following in a warm, deep documentary narrator tone, measured pacing: ",
  promo: "Read the following as an energetic, exciting commercial voice-over with punch: ",
  story: "Read the following in a calm, intimate storytelling tone: ",
  news:  "Read the following in a formal, clear news anchor tone: ",
  ugc:   "Read the following casually and naturally, like a friend talking on camera: ",
};

/**
 * Generate speech. Returns a WAV Blob.
 */
async function ttsGenerate(text, voiceName, stylePrefix) {
  const key = localStorage.getItem("fta_key_gemini") || "";
  if (!key) throw new Error("NO_KEY");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: (stylePrefix || "") + text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      }),
    }
  );

  if (!res.ok) {
    let msg = "HTTP " + res.status;
    try { msg = (await res.json())?.error?.message || msg; } catch (_) { /* ignore */ }
    if (res.status === 400 || res.status === 403) throw new Error("BAD_KEY:" + msg);
    if (res.status === 429) throw new Error("RATE:" + msg);
    throw new Error(msg);
  }

  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("no audio in response");

  // Gemini TTS returns raw 16-bit PCM; sample rate is in the mimeType (rate=24000)
  const rate = parseInt((part.inlineData.mimeType.match(/rate=(\d+)/) || [, "24000"])[1], 10);
  const pcm = Uint8Array.from(atob(part.inlineData.data), c => c.charCodeAt(0));
  return pcmToWav(pcm, rate);
}

/* wrap raw 16-bit mono PCM in a WAV container so <audio> can play it */
function pcmToWav(pcm, sampleRate) {
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const str = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  str(0, "RIFF");
  v.setUint32(4, 36 + pcm.length, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);        // fmt chunk size
  v.setUint16(20, 1, true);         // PCM
  v.setUint16(22, 1, true);         // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); // byte rate
  v.setUint16(32, 2, true);         // block align
  v.setUint16(34, 16, true);        // bits per sample
  str(36, "data");
  v.setUint32(40, pcm.length, true);
  return new Blob([header, pcm], { type: "audio/wav" });
}
