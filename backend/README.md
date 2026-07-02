# تفعيل نظام الاشتراكات (Backend) ☁️

الملف `worker.js` هو الـ backend اللي بيخبي مفتاح الـ API بتاعك ويدير التجربة المجانية والاشتراكات. بيتنشر على **Cloudflare Workers** (مجاني لحد 100,000 طلب يوميًا — أكتر من كفاية).

## خطوات التفعيل (15 دقيقة، مرة واحدة)

### 1. اعمل حساب Cloudflare
[dash.cloudflare.com](https://dash.cloudflare.com) → Sign up (مجاني)

### 2. اعمل الـ Worker
- من القائمة: **Workers & Pages** → **Create** → **Create Worker**
- سمّيه `film-trend` → **Deploy**
- دوس **Edit code** → امسح الكود الموجود والصق محتوى `worker.js` كامل → **Deploy**

### 3. اعمل قاعدة بيانات المستخدمين (KV)
- من القائمة: **Storage & Databases** → **KV** → **Create namespace** → سمّيها `film-trend-users`
- ارجع للـ Worker → **Settings** → **Bindings** → **Add** → **KV namespace**:
  - Variable name: `USERS`
  - KV namespace: `film-trend-users`

### 4. حط الإعدادات (Environment Variables)
في **Settings** → **Variables and Secrets** ضيف:

| الاسم | القيمة | مثال |
|---|---|---|
| `PROVIDER_URL` | رابط مزود الـ AI اللي هتدفع له | `https://api.deepseek.com/chat/completions` |
| `PROVIDER_KEY` | مفتاحك عند المزود (Secret) | `sk-...` |
| `MODEL` | اسم الموديل | `deepseek-chat` |
| `ADMIN_SECRET` | كلمة سر طويلة من عندك (Secret) | أي نص عشوائي طويل |

**اقتراحات المزود** (الأرخص والأحسن للعربي):
- DeepSeek: `https://api.deepseek.com/chat/completions` + موديل `deepseek-chat` — الأرخص (~1-2 سنت للتوليدة)
- Gemini: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` + موديل `gemini-2.5-flash`
- أي مزود OpenAI-compatible تاني

### 5. اربط الموقع بالـ Backend
- انسخ رابط الـ Worker (شكله: `https://film-trend.<اسم-حسابك>.workers.dev`)
- افتح ملف `js/config.js` في الريبو وحط الرابط:
  ```js
  const FT_BACKEND_URL = "https://film-trend.xxxx.workers.dev";
  ```
- اعمل commit وpush (وحدّث برانش `gh-pages`) — خلاص، وضع "حساب Film-trend" اشتغل على الموقع

## إدارة الاشتراكات

### القيم الافتراضية (تتعدل من أول `worker.js`)
- التجربة المجانية: **30 يوم أو 40 توليدة** (الأول)
- حد يومي: **15 توليدة** (حماية من الاستنزاف)

### تفعيل اشتراك مدفوع لمستخدم (بعد ما يدفعلك 10$)
```bash
curl -X POST https://film-trend.xxxx.workers.dev/activate \
  -H "content-type: application/json" \
  -H "x-admin-secret: كلمة-السر-بتاعتك" \
  -d '{"email": "user@example.com", "days": 31}'
```
تقدر تشغّل الأمر ده يدوي مع كل دفعة في الأول، وبعدين نربطه تلقائيًا بـ webhook بوابة الدفع (Lemon Squeezy / Paddle / Paymob) لما تختار واحدة.

## حسبة التكلفة
- مستخدم التجربة المجانية (40 توليدة على DeepSeek): يكلفك **أقل من دولار**
- المشترك بـ 10$ (حتى لو استخدم الحد اليومي كامل كل يوم): يكلفك **2-3 دولار كحد أقصى** → هامش ربح 70%+
