/* ==========================================================================
   WAVESIDE — Fonction Vercel : réception des candidatures
   POST /api/candidature  (JSON)

   1. Valide et nettoie les réponses.
   2. Enregistre la candidature dans Vercel Blob (si BLOB_READ_WRITE_TOKEN
      est configuré) → fiche consultable sur /fiche?id=…
   3. Envoie UN embed propre dans le salon Discord avec le lien de la fiche.
      Sans Blob : l'embed est accompagné du fichier .txt complet.

   Sécurité : connexion Discord obligatoire, requête depuis notre site
   uniquement, formulaire refusé s'il est rempli en moins de 30 s,
   1 candidature / 24 h par compte Discord (avec Blob), anti-spam IP.

   Variables d'environnement (Vercel → Settings → Environment Variables) :
   - DISCORD_WEBHOOK_URL   (obligatoire)
   - DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET (connexion Discord, obligatoire)
   - BLOB_READ_WRITE_TOKEN (ajoutée automatiquement en créant un store Blob)
   - SITE_URL              (facultatif, ex : https://waveside.fr)
   ========================================================================== */
const crypto = require("crypto");
const { verify, currentUser, originOk } = require("../lib/session");

const LIMITS = {
  identite: [3, 80], age: [1, 2], source: [1, 20],
  qualites: [15, 400], defauts: [15, 400], presentation: [80, 1000],
  motivations: [350, 1500], pourquoi_waveside: [60, 1000], pourquoi_vous: [60, 1000], infos: [0, 600],
};
const SOURCES = ["Amis", "Top-Serveur", "Discord"];
const RED = 0xe11d2e;
const LOGO = "https://imgg.fr/r/rw8tuwhj.png";

const recent = new Map(); // anti-spam : 1 envoi / 2 min / IP (par instance)

const clean = (v) => String(v ?? "").replace(/\r/g, "").trim();
const safe = (v) => clean(v).replace(/@(everyone|here)/gi, "@​$1").replace(/<@[!&]?\d+>/g, "[mention]");
const cut = (v, n) => (v.length > n ? v.slice(0, n - 1).trimEnd() + "…" : v);
const oneLine = (v) => v.replace(/\s+/g, " ");

const MIN_FILL_MS = 30 * 1000;      // temps minimum de remplissage
const USER_COOLDOWN_MS = 24 * 3600e3; // 1 candidature / 24 h / compte

const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

async function lastApplication(uid) {
  if (!hasBlob()) return 0;
  try {
    const { list } = require("@vercel/blob");
    const { blobs } = await list({ prefix: `users/${uid}.json`, limit: 1 });
    if (!blobs.length) return 0;
    const r = await fetch(`${blobs[0].url}?t=${Date.now()}`, { cache: "no-store" });
    return r.ok ? (await r.json()).last || 0 : 0;
  } catch { return 0; }
}

async function saveToBlob(record) {
  if (!hasBlob()) return null;
  try {
    const { put } = require("@vercel/blob");
    await put(`candidatures/${record.id}.json`, JSON.stringify(record), {
      access: "public", contentType: "application/json", addRandomSuffix: false,
    });
    await put(`users/${record.user.id}.json`, JSON.stringify({ last: Date.now(), id: record.id }), {
      access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60,
    });
    return true;
  } catch (e) {
    console.error("Blob error", e);
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });

  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook) return res.status(500).json({ error: "Le serveur n'est pas configuré (webhook manquant)." });

  // 1) Requête envoyée depuis notre propre site uniquement
  if (!originOk(req)) return res.status(403).json({ error: "Requête refusée." });

  // 2) Connexion Discord obligatoire
  let user;
  try { user = currentUser(req); } catch { return res.status(500).json({ error: "Connexion Discord non configurée." }); }
  if (!user) return res.status(401).json({ error: "Connectez-vous avec Discord pour postuler." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  if (clean(body.website)) return res.status(200).json({ ok: true }); // pot de miel anti-robots

  const d = {};
  for (const [k, [min, max]] of Object.entries(LIMITS)) {
    const v = safe(body[k]);
    if (v.length < min || v.length > max) return res.status(400).json({ error: `Champ invalide : ${k}.` });
    d[k] = v;
  }
  const age = parseInt(d.age, 10);
  if (!(age >= 13 && age <= 99)) return res.status(400).json({ error: "Âge invalide." });
  if (!SOURCES.includes(d.source)) return res.status(400).json({ error: "Origine invalide." });

  // 3) Jeton de formulaire : même compte, rempli en plus de 30 secondes
  const ft = verify(body.formToken);
  if (!ft || ft.kind !== "form" || ft.uid !== user.id) return res.status(400).json({ error: "Session expirée, rechargez la page." });
  if (Date.now() - ft.t < MIN_FILL_MS) return res.status(429).json({ error: "Envoi trop rapide : prenez le temps de relire vos réponses." });

  // 4) Une candidature par compte toutes les 24 h
  const last = await lastApplication(user.id);
  if (last && Date.now() - last < USER_COOLDOWN_MS) {
    const h = Math.ceil((USER_COOLDOWN_MS - (Date.now() - last)) / 3600e3);
    return res.status(429).json({ error: `Vous avez déjà postulé. Nouvelle candidature possible dans ${h} h.` });
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  const now = Date.now();
  if (recent.has(ip) && now - recent.get(ip) < 120000) return res.status(429).json({ error: "Patientez 2 minutes avant un nouvel envoi." });
  recent.set(ip, now);

  const id = crypto.randomBytes(12).toString("base64url"); // 16 caractères, impossible à deviner
  const date = new Date().toISOString();
  const record = { id, date, user, discord: user.username, ...d, age };

  const stored = await saveToBlob(record);
  const site = (process.env.SITE_URL || `https://${req.headers["x-forwarded-host"] || req.headers.host}`).replace(/\/$/, "");
  const ficheUrl = stored ? `${site}/fiche?id=${id}` : null;

  /* ---------- Embed unique ---------- */
  const embed = {
    color: RED,
    author: { name: "WaveSide Roleplay • Recrutement Staff", icon_url: LOGO },
    title: `Candidature — ${cut(user.name, 40)}`,
    ...(ficheUrl ? { url: ficheUrl } : {}),
    description: [
      `**${cut(oneLine(d.identite), 80)}**`,
      `> ${cut(oneLine(d.motivations), 180)}`,
      "",
      ficheUrl ? `### [Ouvrir la fiche complète ↗](${ficheUrl})` : "Réponses complètes dans le fichier joint.",
    ].join("\n"),
    fields: [
      { name: "Compte Discord", value: `<@${user.id}>\n\`@${user.username}\``, inline: true },
      { name: "Âge", value: `${age} ans`, inline: true },
      { name: "A rejoint via", value: d.source, inline: true },
    ],
    thumbnail: { url: user.avatar },
    footer: { text: `Réf. ${id}` },
    timestamp: date,
  };

  const payload = { username: "WaveSide • Candidatures", avatar_url: LOGO, allowed_mentions: { parse: [] }, embeds: [embed] };

  let fetchOpts;
  if (ficheUrl) {
    fetchOpts = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
  } else {
    // Repli sans stockage : fichier texte complet joint
    const txt = [
      `CANDIDATURE STAFF — WAVESIDE ROLEPLAY`, `Référence : ${id}`, `Date : ${date}`, ``,
      `Compte Discord : @${user.username} (${user.name}) — ID ${user.id}`, `Identité RP : ${d.identite}`, `Âge : ${age}`, `A rejoint via : ${d.source}`, ``,
      `— Qualités —`, d.qualites, ``, `— Défauts —`, d.defauts, ``, `— Présentation IRL —`, d.presentation, ``,
      `— Motivations —`, d.motivations, ``, `— Pourquoi rejoindre l'équipe WaveSide ? —`, d.pourquoi_waveside, ``,
      `— Pourquoi vous et pas un autre ? —`, d.pourquoi_vous, ``, `— Informations complémentaires —`, d.infos || "—",
    ].join("\n");
    const fileName = `candidature-${user.username.replace(/[^a-z0-9_.-]/gi, "_").slice(0, 32)}.txt`;
    payload.attachments = [{ id: 0, filename: fileName }];
    const fd = new FormData();
    fd.append("payload_json", JSON.stringify(payload));
    fd.append("files[0]", new Blob([txt], { type: "text/plain;charset=utf-8" }), fileName);
    fetchOpts = { method: "POST", body: fd };
  }

  try {
    const r = await fetch(hook, fetchOpts);
    if (!r.ok) {
      console.error("Discord webhook error", r.status, await r.text());
      recent.delete(ip);
      return res.status(502).json({ error: "Discord a refusé l'envoi, réessayez plus tard." });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    recent.delete(ip);
    return res.status(502).json({ error: "Impossible de joindre Discord." });
  }
};
