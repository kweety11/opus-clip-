/* ============================================================
   FILM-TREND AI — subscription backend (Cloudflare Worker)

   Hides YOUR provider API key behind a proxy, gives every user a
   free trial (30 days / 40 generations), then requires payment.

   Endpoints:
     POST /signup            {email}            → {token, usage}
     GET  /me                Bearer token       → {usage}
     POST /generate          Bearer token, {system, user}
                             → SSE stream (OpenAI chat format)
     POST /activate          x-admin-secret, {email, days}
                             → marks a user as paid (call it manually,
                               or from your payment gateway's webhook)

   Setup (see backend/README.md for the step-by-step guide):
     KV binding:  USERS
     Env vars:    PROVIDER_URL   e.g. https://api.deepseek.com/chat/completions
                  PROVIDER_KEY   your provider API key
                  MODEL          e.g. deepseek-chat
                  ADMIN_SECRET   any long random string (for /activate)
   ============================================================ */

const TRIAL_DAYS = 30;
const TRIAL_GENERATIONS = 40;   // total free generations in the trial
const DAILY_CAP = 15;           // per-user daily cap (abuse guard)
const MAX_INPUT_CHARS = 60000;  // guard against oversized payloads

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, x-admin-secret",
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...CORS } });

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(req.url);

    try {
      if (url.pathname === "/signup" && req.method === "POST") return await signup(req, env);
      if (url.pathname === "/me" && req.method === "GET") return await me(req, env);
      if (url.pathname === "/generate" && req.method === "POST") return await generate(req, env);
      if (url.pathname === "/activate" && req.method === "POST") return await activate(req, env);
      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: "server error: " + e.message }, 500);
    }
  },
};

/* ---------- helpers ---------- */

async function getUser(req, env) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const raw = await env.USERS.get("tok:" + token);
  if (!raw) return null;
  const user = JSON.parse(raw);
  user._token = token;
  return user;
}

function usageInfo(user) {
  const now = Date.now();
  const trialEnds = user.created + TRIAL_DAYS * 86400000;
  const paid = user.paid_until > now;
  const active = paid || (now < trialEnds && user.used < TRIAL_GENERATIONS);
  return {
    email: user.email,
    used: user.used,
    limit: TRIAL_GENERATIONS,
    trial_ends: new Date(trialEnds).toISOString().slice(0, 10),
    paid,
    paid_until: user.paid_until ? new Date(user.paid_until).toISOString().slice(0, 10) : null,
    active,
  };
}

async function saveUser(env, user) {
  const { _token, ...data } = user;
  await env.USERS.put("tok:" + _token, JSON.stringify(data));
}

/* ---------- endpoints ---------- */

async function signup(req, env) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "invalid email" }, 400);
  }
  const key = "email:" + email.toLowerCase().trim();

  // returning user → same token, same quota (no trial reset by re-signup)
  const existingToken = await env.USERS.get(key);
  if (existingToken) {
    const raw = await env.USERS.get("tok:" + existingToken);
    if (raw) {
      const user = JSON.parse(raw);
      user._token = existingToken;
      return json({ token: existingToken, usage: usageInfo(user) });
    }
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const user = { email: email.toLowerCase().trim(), used: 0, created: Date.now(), paid_until: 0, day: "", used_today: 0 };
  await env.USERS.put("tok:" + token, JSON.stringify(user));
  await env.USERS.put(key, token);
  user._token = token;
  return json({ token, usage: usageInfo(user) });
}

async function me(req, env) {
  const user = await getUser(req, env);
  if (!user) return json({ error: "unauthorized" }, 401);
  return json({ usage: usageInfo(user) });
}

async function generate(req, env) {
  const user = await getUser(req, env);
  if (!user) return json({ error: "unauthorized" }, 401);

  const info = usageInfo(user);
  if (!info.active) return json({ error: "trial_over" }, 402);

  // daily abuse cap (applies to trial and paid alike)
  const today = new Date().toISOString().slice(0, 10);
  if (user.day !== today) { user.day = today; user.used_today = 0; }
  if (user.used_today >= DAILY_CAP) return json({ error: "daily_cap" }, 429);

  const { system, user: userText } = await req.json().catch(() => ({}));
  if (!system || !userText) return json({ error: "missing system/user" }, 400);
  if (system.length + userText.length > MAX_INPUT_CHARS) return json({ error: "input too large" }, 413);

  // count the generation before streaming
  user.used += 1;
  user.used_today += 1;
  await saveUser(env, user);

  const upstream = await fetch(env.PROVIDER_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + env.PROVIDER_KEY },
    body: JSON.stringify({
      model: env.MODEL,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userText },
      ],
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return json({ error: "provider error: " + err.slice(0, 300) }, 502);
  }

  // pipe the provider's SSE stream straight through (OpenAI chat format)
  return new Response(upstream.body, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache", ...CORS },
  });
}

async function activate(req, env) {
  if (req.headers.get("x-admin-secret") !== env.ADMIN_SECRET) return json({ error: "forbidden" }, 403);
  const { email, days = 31 } = await req.json().catch(() => ({}));
  const token = await env.USERS.get("email:" + (email || "").toLowerCase().trim());
  if (!token) return json({ error: "user not found" }, 404);
  const raw = await env.USERS.get("tok:" + token);
  const user = JSON.parse(raw);
  const base = Math.max(Date.now(), user.paid_until || 0);
  user.paid_until = base + days * 86400000;
  await env.USERS.put("tok:" + token, JSON.stringify(user));
  user._token = token;
  return json({ ok: true, usage: usageInfo(user) });
}
