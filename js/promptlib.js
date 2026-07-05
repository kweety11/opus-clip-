/* ============================================================
   FILM-TREND AI — prompt library
   Ready-made, field-tested prompts organised by market niche.
   Three item types per niche:
     idea  — an Arabic studio-chat brief (drops into the Script chat)
     image — an English image-generation prompt
     video — an English motion/video prompt
   ============================================================ */

const PROMPT_LIB = [
  {
    cat: "🏠 عقارات",
    items: [
      { type: "idea", t: "إعلان كمبوند فاخر", d: "بريف جاهز لفيديو 60 ثانية بيبيع أسلوب حياة مش شقة",
        p: "عاوز سيناريو إعلان 60 ثانية لكمبوند سكني فاخر. الفكرة: متبعش الشقة — بيع اليوم اللي العميل هيعيشه فيها: يصحى على فيو مفتوح، قهوته على البلكونة، ولاده بيلعبوا في الجنينة بأمان، ويقفل يومه على حمام السبا. هوك أول 3 ثواني: سؤال مباشر «فاكر آخر مرة صحيت من غير منبه؟». النبرة: هادية وراقية، صوت رجالي دافي، موسيقى بيانو. CTA: احجز معاينتك المجانية." },
      { type: "image", t: "لقطة معمارية Golden Hour", d: "برومبت صورة لواجهة مشروع سكني وقت الغروب",
        p: "Luxury residential compound exterior at golden hour, modern Egyptian architecture with clean lines and warm stone facades, palm-lined entrance boulevard, warm sunset backlight with soft atmospheric haze, ultra-wide 16mm architectural photography, low angle emphasizing grandeur, people silhouettes adding life scale, teal and warm-orange color grade, photorealistic, high detail, 16:9" },
      { type: "video", t: "موشن: طيران فوق المشروع", d: "برومبت فيديو درون سينمائي للمشروع",
        p: "Slow cinematic drone push-in over a luxury residential compound at golden hour, camera glides forward and gently descends toward the main gate as palm trees pass beneath, warm sunset light flares across the lens, calm luxurious pace, buildings and landscaping stay stable and photorealistic, 8 seconds" },
    ],
  },
  {
    cat: "🍔 مطاعم وكافيهات",
    items: [
      { type: "idea", t: "ريل تيك توك لطبق جديد", d: "بريف ريل 30 ثانية بأسلوب POV يفتح شهية",
        p: "عاوز سيناريو ريل 30 ثانية لإطلاق برجر جديد في مطعمي. الأسلوب: POV من عين العميل — من أول ما يدخل ريحة الشوي تاخده، لقطة الجبنة السايحة سلوموشن، أول قضمة بصوت قرمشة واضح ASMR. هوك: «متكملش السكرول وانت جعان». اللهجة مصري شبابي، إيقاع سريع، CTA: اطلبه النهارده — الكمية محدودة." },
      { type: "image", t: "فوود شوت احترافي", d: "برومبت صورة طبق بإضاءة استوديو تفتح النفس",
        p: "Gourmet smash burger on a dark slate board, melted cheddar dripping between double patties, brioche bun with sesame glistening, steam rising, backlit rim light with soft warm key, macro food photography 85mm f/2.8, shallow depth of field, rich appetizing colors, crumbs and sauce artfully scattered, dark moody background, photorealistic, 4:5" },
      { type: "video", t: "موشن: سحب الجبنة", d: "برومبت فيديو للحظة السحب السحرية",
        p: "Extreme close-up of a cheese pull from a smash burger being lifted slowly, molten cheddar stretches in golden strings, steam rises through warm backlight, camera slowly orbits a few degrees around the burger, everything else stays sharp and stable, appetizing slow-motion feel, 5 seconds" },
    ],
  },
  {
    cat: "🏥 عيادات وتجميل",
    items: [
      { type: "idea", t: "إعلان عيادة أسنان — قبل/بعد", d: "بريف فيديو ثقة بشهادة عميل حقيقية",
        p: "عاوز سيناريو إعلان 45 ثانية لعيادة أسنان متخصصة في ابتسامة هوليود. البناء: افتح على شخص بيغطي ضحكته بإيده في المواقف الاجتماعية (مشكلة)، لقطات سريعة للعيادة والدكتور بيشتغل باطمئنان (حل)، ثم نفس الشخص بيضحك بحرية في نفس المواقف (تحول). من غير مبالغات طبية، نبرة إنسانية دافية. CTA: احجز كشفك واستشارتك مجانًا الأسبوع ده." },
      { type: "image", t: "بورتريه ابتسامة نظيف", d: "برومبت صورة إعلانية لنتيجة تجميلية طبيعية",
        p: "Natural confident smile portrait of a young woman, flawless healthy teeth, soft beauty lighting with large octabox key and subtle rim, clean white and mint-green clinical background softly blurred, genuine relaxed expression, professional beauty photography 105mm f/2, true-to-life skin texture with no over-retouching, bright airy color grade, 4:5" },
      { type: "video", t: "موشن: لحظة الثقة", d: "برومبت فيديو لتحول المشاعر قدام المرايا",
        p: "A young woman looks at her new smile in a clinic mirror, slowly breaks into a genuine happy laugh, camera pushes in gently from behind her shoulder to her mirror reflection, soft bright clinical light stays clean and airy, her face and hair stay consistent, warm hopeful mood, 6 seconds" },
    ],
  },
  {
    cat: "👗 فاشون وملابس",
    items: [
      { type: "idea", t: "لانش كولكشن جديدة", d: "بريف ريل ستايل مجلات للدروب الجديد",
        p: "عاوز سيناريو ريل 30 ثانية لإطلاق كولكشن شتوي لبراند ملابس. الأسلوب: fashion editorial سريع — flash photography، لقطات ستريت وير في شوارع وسط البلد بالليل، تقطيع على البيت (beat-synced cuts)، كل قطعة تظهر 2-3 ثواني بحركة واثقة. هوك بصري: أول فريم فلاش يكشف اللوك كامل. نص قليل جدًا — الصورة هي البطل. CTA: الدروب نزل — الكمية محدودة." },
      { type: "image", t: "لوك بوك ستريت وير", d: "برومبت صورة موديل بستايل مجلة",
        p: "Streetwear fashion editorial, young model in an oversized winter coat and layered fit, night city street with neon signs bokeh behind, direct flash photography look with hard shadows, confident stance mid-stride, magazine cover composition with negative space top-left, slightly desaturated grade with punchy contrast, shot on 35mm, 4:5" },
      { type: "video", t: "موشن: لفة الموديل", d: "برومبت فيديو حركة عرض القطعة",
        p: "Fashion model turns 180 degrees in one confident motion to face the camera, oversized coat flares and settles naturally with fabric physics, flash-lit night street behind with neon bokeh, camera stays locked, model's face and outfit stay perfectly consistent, editorial attitude, 4 seconds" },
    ],
  },
  {
    cat: "💪 جيم ولياقة",
    items: [
      { type: "idea", t: "إعلان اشتراك الصيف", d: "بريف فيديو تحفيزي 45 ثانية",
        p: "عاوز سيناريو إعلان 45 ثانية لجيم قبل الصيف. الفكرة: مش «جسمك وحش» — إحنا مع «النسخة الأقوى منك». نتابع 3 أشخاص حقيقيين (موظف، أم، طالب) في لحظة التعب الحقيقية والقرار: الجيم الساعة 6 الصبح، آخر عدة، أول حبل. مونتاج متصاعد مع موسيقى درامز، صوت مدرب حقيقي مش منمق. هوك: «الفرق بينك وبين اللي نفسك تكونه… 45 دقيقة في اليوم». CTA: اشتراك الصيف بخصم — أول حصة مجانًا." },
      { type: "image", t: "لقطة تدريب درامية", d: "برومبت صورة رياضية بإضاءة سينمائية",
        p: "Athlete mid-deadlift in a dark industrial gym, chalk dust exploding in the air frozen in motion, dramatic single hard rim light from behind, sweat highlights on determined face, low angle hero shot, deep shadows with warm tungsten accent, sports commercial photography, gritty texture, high shutter freeze, 16:9" },
      { type: "video", t: "موشن: آخر عدة", d: "برومبت فيديو للحظة المجهود الأقصى",
        p: "Athlete completes a final heavy deadlift rep and drops the bar, chalk dust bursts and drifts through a hard backlight beam, camera slowly pushes in on the exhausted triumphant face, gritty industrial gym stays dark and stable, sweat and breathing feel real, dramatic intensity, 5 seconds" },
    ],
  },
  {
    cat: "📚 تعليم وكورسات",
    items: [
      { type: "idea", t: "إعلان كورس أونلاين", d: "بريف UGC بيكسر حاجز «مش وقته»",
        p: "عاوز سيناريو إعلان UGC 40 ثانية لكورس أونلاين (حدد المجال). الأسلوب: شخص طبيعي ماسك موبايله بيتكلم لصحابه مش لكاميرا إعلان. البناء: اعتراض حقيقي («أنا مش فاضي أتعلم») → قلب الاعتراض («عشان كده الكورس مقسم 10 دقايق في اليوم») → إثبات (نتيجة طالب حقيقي بالأرقام) → CTA بخصم محدود. اللهجة مصري عفوي بالكامل، من غير كلمة واحدة تسويقية مصقولة." },
      { type: "image", t: "ثامبنيل يوتيوب جذاب", d: "برومبت صورة غلاف فيديو تعليمي",
        p: "YouTube thumbnail composition, young Egyptian instructor pointing at a glowing laptop screen with an amazed expression, bold negative space on the right for text, saturated complementary colors (deep blue background, warm orange key light on face), high contrast, crisp studio lighting, slightly exaggerated expression, sharp 50mm portrait, 16:9" },
      { type: "video", t: "موشن: لحظة الفهم", d: "برومبت فيديو للحظة «فهمتها!»",
        p: "A student studying at a desk at night suddenly understands, face lights up as they lean toward the laptop and smile, warm desk lamp glow with cool screen light on the face, camera slowly dollies in, papers and coffee mug stay stable, cozy focused mood, 4 seconds" },
    ],
  },
  {
    cat: "📱 تكنولوجيا وتطبيقات",
    items: [
      { type: "idea", t: "لانش تطبيق جديد", d: "بريف إعلان 30 ثانية مبني على المشكلة",
        p: "عاوز سيناريو إعلان 30 ثانية لإطلاق تطبيق (حدد وظيفته). البناء: افتح على المشكلة مضخمة بشكل كوميدي (فوضى، ورق طاير، أعصاب) — قطع صامت مفاجئ — التطبيق بيحل كل حاجة في 3 لقطات UI نظيفة سريعة — قفلة بجملة واحدة قوية. الأسلوب: إيقاع إعلانات Apple، مينيمال، موسيقى بتقف فجأة مع القطع. CTA: نزّله مجانًا." },
      { type: "image", t: "برودكت شوت للتطبيق", d: "برومبت صورة موبايل بإضاءة تك نظيفة",
        p: "Smartphone floating at a slight angle showing a clean modern app interface, minimal studio environment with soft gradient blue-to-white background, subtle reflection below, single softbox key with gentle rim light on edges, floating UI cards emerging from the screen in 3D, corporate clean tech aesthetic, ultra-sharp product photography, 1:1" },
      { type: "video", t: "موشن: UI بتطير", d: "برومبت فيديو عناصر الواجهة وهي بتتركب",
        p: "App interface cards fly in and assemble smoothly on a floating smartphone screen, camera orbits slowly around the phone in clean studio space, soft gradient background shifts subtly, glass reflections stay physical and consistent, precise minimal tech-launch energy, 6 seconds" },
    ],
  },
  {
    cat: "🚗 سيارات",
    items: [
      { type: "idea", t: "إعلان وكالة/معرض", d: "بريف فيديو تجربة قيادة بإحساس سينمائي",
        p: "عاوز سيناريو إعلان 45 ثانية لمعرض سيارات. الفكرة: مش مواصفات — إحساس. نتابع سائق من لحظة ما يمسك المفتاح: صوت القفل، إضاءة التابلوه بتصحى، أول دوسة بنزين على طريق ساحلي وقت الغروب. صوت محرك حقيقي، نص قليل، لقطات ديتيل (جنوط، مرايا، دعسة). قفلة: «مش عربية… قرار». CTA: احجز تجربة قيادتك." },
      { type: "image", t: "لقطة عربية Hero Shot", d: "برومبت صورة سيارة بإضاءة إعلانات عالمية",
        p: "Luxury sedan hero shot on wet asphalt at blue hour, dramatic low three-quarter front angle, city lights reflecting in the paint and puddles, rim light tracing the body lines, subtle fog in background, cinematic teal-orange automotive commercial grade, ultra-detailed reflections, 35mm, 16:9" },
      { type: "video", t: "موشن: مرور السيارة", d: "برومبت فيديو حركة سينمائية على الساحل",
        p: "Luxury sedan drives along a coastal road at sunset, camera tracks alongside at wheel height then rises smoothly to reveal the ocean, golden light flares across the glossy paint, reflections move naturally, powerful yet elegant pace, car body and color stay perfectly consistent, 8 seconds" },
    ],
  },
  {
    cat: "✈️ سفر وسياحة",
    items: [
      { type: "idea", t: "إعلان رحلة/منتجع", d: "بريف ريل بيبيع الإحساس مش الوجهة",
        p: "عاوز سيناريو ريل 30 ثانية لشركة سياحة بتبيع رحلة (حدد الوجهة). الفكرة: افتح على اللحظة اللي كل الناس بتحلم بيها (فطار على البحر / غطس أول مرة / غروب من فوق جبل) واشتغل بالعكس: من الحلم للحجز. لقطات POV حقيقية، صوت طبيعي (موج، ريح)، نص قليل على الشاشة. هوك: «إجازتك الجاية شكلها كده». CTA: الباكدج كامل بسعر واحد — الأماكن محدودة." },
      { type: "image", t: "لقطة ترافيل حالمة", d: "برومبت صورة وجهة سياحية بأسلوب مجلات السفر",
        p: "Overwater villa terrace at sunrise, turquoise lagoon stretching to the horizon, breakfast tray with tropical fruits in the foreground, bare feet at frame edge suggesting POV relaxation, soft golden morning light, gentle haze, dreamy travel magazine aesthetic, wide 24mm composition, warm airy grade, 4:5" },
      { type: "video", t: "موشن: كشف الفيو", d: "برومبت فيديو لحظة فتح الستارة على الجنة",
        p: "POV hands slowly open white curtains to reveal a turquoise lagoon and overwater villas at sunrise, warm light floods the room, sheer curtains breathe in the sea breeze, camera drifts gently forward toward the balcony, serene dreamy pace, 6 seconds" },
    ],
  },
  {
    cat: "🌸 عطور وبيوتي",
    items: [
      { type: "idea", t: "لانش عطر جديد", d: "بريف إعلان فاخر 30 ثانية",
        p: "عاوز سيناريو إعلان 30 ثانية لإطلاق عطر. الأسلوب: فخامة صامتة — لقطات ماكرو للزجاجة مع عناصر النوتات (خشب، فانيليا، حمضيات) بتتحرك سلوموشن حوالين الزجاجة، إضاءة درامية، موسيقى سترينجز. من غير وش بشري خالص أو بوجود موديل واحد في الضل. قفلة: اسم العطر + جملة واحدة. CTA بسيط: متوفر الآن." },
      { type: "image", t: "برودكت شوت عطر", d: "برومبت صورة زجاجة عطر بإضاءة فاخرة",
        p: "Luxury perfume bottle on black glossy surface, amber liquid glowing from a single dramatic backlight, cinnamon sticks and vanilla flowers artfully arranged around, fine mist droplets suspended in the light beam, deep shadows with golden accents, high-end fragrance commercial photography, macro detail on glass facets, 1:1" },
      { type: "video", t: "موشن: انفجار النوتات", d: "برومبت فيديو عناصر العطر بتدور حوالين الزجاجة",
        p: "Perfume bottle stands on a dark reflective surface as cinnamon sticks, vanilla flowers and citrus slices orbit slowly around it in weightless slow motion, golden mist swirls through a dramatic backlight, camera pushes in very slowly, bottle and label stay sharp and consistent, luxurious hypnotic mood, 6 seconds" },
    ],
  },
  {
    cat: "🛋️ أثاث وديكور",
    items: [
      { type: "idea", t: "إعلان معرض أثاث", d: "بريف فيديو «البيت اللي بيشبهك»",
        p: "عاوز سيناريو إعلان 45 ثانية لمعرض أثاث. الفكرة: نفس الأوضة بتتحول 3 مرات (مودرن / كلاسيك / بوهو) بقطع transitions سلسة، وكل ستايل معاه شخصية ساكنة مختلفة — رسالة: «مش بنبيع أثاث، بنفرش شخصيتك». لقطات ديتيل للخامات (خشب، قماش، رخام). CTA: زور المعرض — تصميم 3D مجاني لبيتك." },
      { type: "image", t: "لقطة ليفينج روم", d: "برومبت صورة غرفة معيشة بأسلوب كتالوج فاخر",
        p: "Modern living room interior, curved beige sofa with olive green accent pillows, natural oak coffee table, large window with sheer curtains diffusing soft daylight, indoor plants, warm minimal Scandinavian-Egyptian fusion style, wide 24mm interior photography, bright airy natural grade, magazine catalog quality, 4:5" },
      { type: "video", t: "موشن: تحول الأوضة", d: "برومبت فيديو الإضاءة بتتغير من نهار لليل",
        p: "Modern living room transitions from bright daylight to cozy evening: sunlight sweeps across the floor, lamps warm up one by one, curtains sway gently, camera dollies forward slowly through the room, furniture stays perfectly stable and consistent, warm homely mood, 8 seconds" },
    ],
  },
  {
    cat: "🛒 متاجر إلكترونية",
    items: [
      { type: "idea", t: "إعلان أوفر/خصم", d: "بريف ريل عاجل بيحرّك الشراء دلوقتي",
        p: "عاوز سيناريو ريل 25 ثانية لعرض خصم في متجري الإلكتروني (حدد المنتجات). البناء: هوك رقمي صادم في أول ثانية («خصم 50% على كل حاجة؟ آه بجد») → 4 منتجات بأسعارها قبل/بعد بتقطيع سريع → إثبات اجتماعي (عدد الطلبات/تقييم) → عد تنازلي حقيقي للعرض. نبرة مستعجلة بس مش صارخة. CTA: اطلب قبل ما يخلص — لينك في البايو." },
      { type: "image", t: "فلات لاي منتجات", d: "برومبت صورة منتجات مرتبة من فوق",
        p: "Flat lay top-down composition of curated e-commerce products arranged on a pastel beige background, clean geometric organization with breathing space, soft even shadowless lighting, small props (dried flowers, ribbon) adding warmth, bright commercial product photography, crisp details, space reserved top-center for promo text, 1:1" },
      { type: "video", t: "موشن: أنبوكسينج ساتيسفايينج", d: "برومبت فيديو فتح علبة المنتج",
        p: "Satisfying POV unboxing: hands lift the lid off a premium branded box, tissue paper unfolds, the product is revealed nestled inside, soft window light, gentle camera push-in from above, paper and hands move with natural physics, calm ASMR-like pacing, 5 seconds" },
    ],
  },
];

/* ---------- render ---------- */
let libCat = "";

const LIB_TYPE_META = {
  idea:  { key: "lib_t_idea",  cls: "lt-idea"  },
  image: { key: "lib_t_image", cls: "lt-image" },
  video: { key: "lib_t_video", cls: "lt-video" },
};

function renderLibrary() {
  const grid = document.getElementById("lib-grid");
  if (!grid) return;

  const cats = document.getElementById("lib-cats");
  cats.innerHTML =
    `<button class="lib-cat ${libCat === "" ? "on" : ""}" onclick="libSetCat('')">${t("lib_all")}</button>` +
    PROMPT_LIB.map((c, ci) =>
      `<button class="lib-cat ${libCat === c.cat ? "on" : ""}" onclick="libSetCat('${c.cat.replace(/'/g, "\\'")}')">${c.cat}</button>`
    ).join("");

  const q = (document.getElementById("lib-search").value || "").trim().toLowerCase();
  const cards = [];
  PROMPT_LIB.forEach((c, ci) => {
    if (libCat && c.cat !== libCat) return;
    c.items.forEach((it, ii) => {
      if (q && !(it.t + " " + it.d + " " + it.p + " " + c.cat).toLowerCase().includes(q)) return;
      const meta = LIB_TYPE_META[it.type];
      const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      cards.push(`
        <div class="lib-card">
          <div class="lib-card-head">
            <span class="lib-type ${meta.cls}">${t(meta.key)}</span>
            <span class="lib-niche">${c.cat}</span>
          </div>
          <h4>${esc(it.t)}</h4>
          <p class="lib-desc">${esc(it.d)}</p>
          <pre class="lib-preview" dir="${it.type === "idea" ? "rtl" : "ltr"}">${esc(it.p)}</pre>
          <div class="lib-actions">
            <button class="btn btn-primary btn-xs" onclick="libCopy(${ci},${ii})">${t("lib_copy")}</button>
            ${it.type === "idea" ? `<button class="btn btn-ghost btn-xs" onclick="libUse(${ci},${ii})">${t("lib_use")}</button>` : ""}
          </div>
        </div>`);
    });
  });

  grid.innerHTML = cards.length ? cards.join("") : `<p class="hint">${t("lib_empty")}</p>`;
}

function libSetCat(cat) {
  libCat = cat;
  renderLibrary();
}

function libCopy(ci, ii) {
  const it = PROMPT_LIB[ci].items[ii];
  navigator.clipboard.writeText(it.p).then(() => toast(t("t_copied")));
}

function libUse(ci, ii) {
  const it = PROMPT_LIB[ci].items[ii];
  const ta = document.getElementById("chat-text");
  ta.value = it.p;
  switchTab("script");
  ta.focus();
  toast(t("lib_used"));
}
