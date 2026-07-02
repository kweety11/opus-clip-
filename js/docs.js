/* ============================================================
   FILM-TREND AI — universal document reader (client-side)
   Extracts text from PDF / DOCX / PPTX / TXT locally in the
   browser, so documents work with EVERY provider. Images are
   passed through as vision blocks.
   Libraries load lazily from CDN only when first needed.
   ============================================================ */

const _libCache = {};
function loadLib(url) {
  if (_libCache[url]) return _libCache[url];
  _libCache[url] = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = url;
    s.onload = resolve;
    s.onerror = () => reject(new Error("فشل تحميل مكتبة القراءة — اتأكد من الإنترنت"));
    document.head.appendChild(s);
  });
  return _libCache[url];
}

const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const MAMMOTH = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js";
const JSZIP = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";

/**
 * extractDocument(file) →
 *   { text, images }   text = extracted document text (may be "")
 *                      images = [{mime,b64}] vision blocks (photo files,
 *                      or rendered PDF pages when the PDF is scanned /
 *                      image-heavy so the model can READ them itself)
 */
async function extractDocument(file) {
  const name = file.name.toLowerCase();
  const MAX = 25 * 1024 * 1024;
  if (file.size > MAX) throw new Error("الملف أكبر من 25MB");

  if (file.type.startsWith("image/")) {
    return { text: "", images: [{ mime: file.type, b64: await fileToBase64(file) }] };
  }
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return { text: await file.text(), images: [] };
  }
  if (name.endsWith(".pdf")) return await extractPdf(file);
  if (name.endsWith(".docx")) return { text: await extractDocx(file), images: [] };
  if (name.endsWith(".pptx")) return { text: await extractPptx(file), images: [] };
  throw new Error("صيغة غير مدعومة — المدعوم: PDF, Word, PowerPoint, صور, نص");
}

async function extractPdf(file) {
  await loadLib(PDFJS);
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let out = [];
  const pages = Math.min(pdf.numPages, 80);
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    out.push(tc.items.map(it => it.str).join(" "));
  }
  const text = out.join("\n\n").trim();

  // Scanned or design-heavy PDF (little selectable text) → render the
  // pages themselves as images so vision models read + analyze them.
  const images = [];
  if (text.length < 1200) {
    const n = Math.min(pdf.numPages, 12);
    for (let i = 1; i <= n; i++) {
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
      images.push({ mime: "image/jpeg", b64: canvas.toDataURL("image/jpeg", 0.82).split(",")[1] });
    }
  }
  if (!text && !images.length) throw new Error("معرفتش أقرا حاجة من الـ PDF ده");
  return { text, images };
}

async function extractDocx(file) {
  await loadLib(MAMMOTH);
  const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  const text = (result.value || "").trim();
  if (!text) throw new Error("معرفتش أقرا نص من ملف الـ Word ده");
  return text;
}

async function extractPptx(file) {
  await loadLib(JSZIP);
  const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
  const slideNames = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)));
  const slides = [];
  for (const n of slideNames) {
    const xml = await zip.files[n].async("string");
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]);
    if (runs.length) slides.push(`— شريحة ${slides.length + 1} —\n` + runs.join(" "));
  }
  const text = slides.join("\n\n").trim();
  if (!text) throw new Error("معرفتش أقرا نص من ملف الـ PowerPoint ده");
  return text;
}
