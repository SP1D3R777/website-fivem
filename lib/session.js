/* ==========================================================================
   WAVESIDE — Outils partagés par les fonctions Vercel
   Sessions signées (HMAC), cookies, URL du site, contrôle d'origine.
   ========================================================================== */
const crypto = require("crypto");

const SESSION_COOKIE = "ws_session";
const STATE_COOKIE = "ws_oauth_state";
const SESSION_DAYS = 7;

function key() {
  const base = process.env.SESSION_SECRET || process.env.DISCORD_CLIENT_SECRET;
  if (!base) throw new Error("SESSION_SECRET / DISCORD_CLIENT_SECRET manquant");
  return crypto.createHmac("sha256", base).update("waveside-session-v1").digest();
}

/** Signe un objet → "payload.signature" (base64url) */
function sign(obj) {
  const p = Buffer.from(JSON.stringify(obj)).toString("base64url");
  const s = crypto.createHmac("sha256", key()).update(p).digest("base64url");
  return `${p}.${s}`;
}

/** Vérifie et décode un jeton signé ; null si invalide ou expiré */
function verify(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [p, s] = token.split(".");
  const expected = crypto.createHmac("sha256", key()).update(p).digest("base64url");
  const a = Buffer.from(s), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(p, "base64url").toString());
    if (obj.exp && Date.now() > obj.exp) return null;
    return obj;
  } catch { return null; }
}

function cookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((c) => {
    const i = c.indexOf("=");
    if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}

function cookie(name, value, maxAgeSec) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

function siteUrl(req) {
  return (process.env.SITE_URL || `https://${req.headers["x-forwarded-host"] || req.headers.host}`).replace(/\/$/, "");
}

/** Refuse les requêtes envoyées depuis un autre site que le nôtre */
function originOk(req) {
  const origin = req.headers.origin || req.headers.referer || "";
  if (!origin) return false;
  let host;
  try { host = new URL(origin).host; } catch { return false; }
  const allowed = new Set([req.headers["x-forwarded-host"], req.headers.host].filter(Boolean));
  if (process.env.SITE_URL) { try { allowed.add(new URL(process.env.SITE_URL).host); } catch {} }
  const bare = [...allowed].map((h) => h.replace(/^www\./, ""));
  return allowed.has(host) || bare.includes(host.replace(/^www\./, ""));
}

function avatarUrl(u) {
  if (u.avatar) return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith("a_") ? "gif" : "png"}?size=256`;
  const idx = Number((BigInt(u.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

/** Utilisateur de la session courante, ou null */
function currentUser(req) {
  const s = verify(cookies(req)[SESSION_COOKIE]);
  return s && s.kind === "session" ? s.user : null;
}

module.exports = { sign, verify, cookies, cookie, siteUrl, originOk, avatarUrl, currentUser, SESSION_COOKIE, STATE_COOKIE, SESSION_DAYS };
