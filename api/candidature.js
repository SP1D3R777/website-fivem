/* ==========================================================================
   WAVESIDE — Fonction Vercel : relais des candidatures vers Discord
   POST /api/candidature  (JSON)
   L'URL du webhook est lue dans la variable d'environnement
   DISCORD_WEBHOOK_URL (Vercel → Settings → Environment Variables).
   Ne JAMAIS l'écrire en clair dans ce dépôt.
   ========================================================================== */

const LIMITS = {
  discord: [2, 40], identite: [3, 80], age: [1, 2], source: [1, 20],
  qualites: [15, 400], defauts: [15, 400], presentation: [80, 1000],
  motivations: [350, 1500], pourquoi_waveside: [60, 1000], pourquoi_vous: [60, 1000], infos: [0, 600],
};
const SOURCES = ["Amis", "Top-Serveur", "Discord"];
const RED = 0xe11d2e;

// Anti-spam simple (par instance) : 1 candidature / 2 min / IP
const recent = new Map();

const clean = (v) => String(v ?? "").replace(/\r/g, "").trim();
// Empêche les mentions @everyone / @here / <@id> et la casse du markdown de bloc
const safe = (v) => clean(v).replace(/@(everyone|here)/gi, "@​$1").replace(/<@[!&]?\d+>/g, "[mention]").replace(/```/g, "ʼʼʼ");
const cut = (v, n) => (v.length > n ? v.slice(0, n - 1) + "…" : v);
const block = (v, n = 1000) => (v ? cut(v, n) : "—");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });

  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook) return res.status(500).json({ error: "Le serveur n'est pas configuré (webhook manquant)." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // Pot de miel : les robots remplissent ce champ invisible
  if (clean(body.website)) return res.status(200).json({ ok: true });

  const d = {};
  for (const [k, [min, max]] of Object.entries(LIMITS)) {
    const v = safe(body[k]);
    if (v.length < min || v.length > max) return res.status(400).json({ error: `Champ invalide : ${k}.` });
    d[k] = v;
  }
  const age = parseInt(d.age, 10);
  if (!(age >= 13 && age <= 99)) return res.status(400).json({ error: "Âge invalide." });
  if (!SOURCES.includes(d.source)) return res.status(400).json({ error: "Origine invalide." });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  const now = Date.now();
  if (recent.has(ip) && now - recent.get(ip) < 120000) return res.status(429).json({ error: "Patientez 2 minutes avant un nouvel envoi." });
  recent.set(ip, now);

  const stamp = new Date().toISOString();
  const footer = { text: "WaveSide Roleplay • Candidatures Staff" };

  const embeds = [
    {
      color: RED,
      title: "Nouvelle candidature Staff",
      description: `**${cut(d.discord, 40)}** a déposé une candidature.`,
      fields: [
        { name: "Pseudo Discord", value: `\`${cut(d.discord, 40)}\``, inline: true },
        { name: "Identité RP", value: cut(d.identite, 80), inline: true },
        { name: "Âge", value: `${age} ans`, inline: true },
        { name: "A rejoint via", value: d.source, inline: true },
      ],
      timestamp: stamp,
    },
    {
      color: RED,
      title: "Profil",
      fields: [
        { name: "Qualités", value: block(d.qualites, 400), inline: true },
        { name: "Défauts", value: block(d.defauts, 400), inline: true },
        { name: "Présentation IRL", value: block(d.presentation, 1000) },
      ],
    },
    { color: RED, title: "Motivations", description: block(d.motivations, 1500) },
    {
      color: RED,
      title: "Pourquoi WaveSide / Pourquoi lui",
      fields: [
        { name: "Pourquoi rejoindre l'équipe WaveSide ?", value: block(d.pourquoi_waveside, 1000) },
        { name: "Pourquoi vous et pas un autre ?", value: block(d.pourquoi_vous, 1000) },
      ],
      ...(d.infos ? {} : { footer, timestamp: stamp }),
    },
  ];
  if (d.infos) embeds.push({ color: RED, title: "Informations complémentaires", description: block(d.infos, 600), footer, timestamp: stamp });

  // Discord limite un message à 6000 caractères au total : on réduit si besoin
  const size = () => JSON.stringify(embeds).length;
  if (size() > 5800) {
    embeds[2].description = cut(embeds[2].description, 900);
    embeds[3].fields.forEach((f) => (f.value = cut(f.value, 600)));
  }

  // Version texte complète jointe en fichier, pour archivage
  const txt = [
    `CANDIDATURE STAFF — WAVESIDE ROLEPLAY`, `Date : ${stamp}`, ``,
    `Pseudo Discord : ${d.discord}`, `Identité RP : ${d.identite}`, `Âge : ${age}`, `A rejoint via : ${d.source}`, ``,
    `— Qualités —`, d.qualites, ``, `— Défauts —`, d.defauts, ``, `— Présentation IRL —`, d.presentation, ``,
    `— Motivations —`, d.motivations, ``, `— Pourquoi rejoindre l'équipe WaveSide ? —`, d.pourquoi_waveside, ``,
    `— Pourquoi vous et pas un autre ? —`, d.pourquoi_vous, ``, `— Informations complémentaires —`, d.infos || "—",
  ].join("\n");

  const fileName = `candidature-${d.discord.replace(/[^a-z0-9_.-]/gi, "_").slice(0, 32)}.txt`;
  const fd = new FormData();
  fd.append("payload_json", JSON.stringify({
    username: "WaveSide • Candidatures",
    allowed_mentions: { parse: [] },
    embeds,
    attachments: [{ id: 0, filename: fileName }],
  }));
  fd.append("files[0]", new Blob([txt], { type: "text/plain;charset=utf-8" }), fileName);

  try {
    const r = await fetch(hook, { method: "POST", body: fd });
    if (!r.ok) {
      const t = await r.text();
      console.error("Discord webhook error", r.status, t);
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
