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

/* dialect steering — Gemini TTS follows spoken-accent directives.
   The Egyptian one is aggressive on purpose: authentic عامية, not MSA. */
const TTS_ACCENTS = {
  none: "",
  egyptian:
    "CRITICAL PRONUNCIATION RULE: The text is in Egyptian colloquial Arabic (اللهجة المصرية العامية). " +
    "Speak it EXACTLY as an Egyptian from Cairo speaks in daily life: pronounce ج as G (like 'gamal'), " +
    "ق as a glottal stop (hamza), ث as S or T, ذ as Z. Casual street rhythm and intonation, " +
    "NEVER classical/MSA pronunciation, never formal case endings. ",
  msa:
    "Pronounce the following in clear, correct Modern Standard Arabic (الفصحى) with proper tashkeel. ",
  gulf:
    "The text is in Gulf Arabic (اللهجة الخليجية). Speak it with an authentic Khaleeji accent, " +
    "natural Gulf rhythm and pronunciation, not MSA. ",
};

/**
 * Generate speech. Returns a WAV Blob (Gemini) — accentKey picks TTS_ACCENTS.
 */
async function ttsGenerate(text, voiceName, stylePrefix, accentKey) {
  const accent = TTS_ACCENTS[accentKey || "none"] || "";
  stylePrefix = accent + (stylePrefix || "");
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

/* ============================================================
   ElevenLabs TTS — the strongest Arabic voices on the market.
   Free key from elevenlabs.io (10k chars/month). eleven_v3 follows
   the text's dialect closely, so Egyptian عامية sounds Egyptian.
   ============================================================ */
const ELEVEN_MODEL = "eleven_multilingual_v2";

async function elevenVoices() {
  const key = localStorage.getItem("fta_key_elevenlabs") || "";
  if (!key) throw new Error("NO_KEY");
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key },
  });
  if (!res.ok) throw new Error(res.status === 401 ? "BAD_KEY" : "HTTP " + res.status);
  const data = await res.json();
  return (data.voices || []).map(v => [v.voice_id, v.name + (v.labels?.accent ? " — " + v.labels.accent : "")]);
}

/* accent hints go into the text itself for ElevenLabs (v2 reads the text's dialect) */
async function elevenGenerate(text, voiceId) {
  const key = localStorage.getItem("fta_key_elevenlabs") || "";
  if (!key) throw new Error("NO_KEY");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: ELEVEN_MODEL,
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35 },
    }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("BAD_KEY");
    if (res.status === 429) throw new Error("RATE");
    let msg = "HTTP " + res.status;
    try { msg = (await res.json())?.detail?.message || msg; } catch (_) {}
    throw new Error(msg);
  }
  return await res.blob(); // audio/mpeg — plays directly in <audio>
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
