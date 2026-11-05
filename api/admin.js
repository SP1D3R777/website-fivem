/* ==========================================================================
   WAVESIDE — GET /api/admin : liste des candidatures (staff uniquement)
   Lit l'historique du salon des candidatures via le bot (aucune base de
   données) : messages postés par le bot ET par le webhook.
   Variables : DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID, (DISCORD_GUILD_ID)
   ========================================================================== */
const { currentUser, ficheRef } = require("../lib/session");
const { botApi, channelId, readDecision } = require("../lib/discord");
const { isStaff } = require("../lib/decision");

const MAX_PAGES = 5; // 500 derniers messages

function field(embed, name) {
  return (embed.fields || []).find((f) => f.name === name)?.value || "";
}

function parse(msg, guild) {
  const e = msg.embeds?.[0];
  if (!e || !/^Candidature — /.test(e.title || "")) return null;
  const account = field(e, "Compte Discord");
  const decision = readDecision(e);
  const identite = ((e.description || "").match(/^\*\*(.+?)\*\*/) || [])[1] || "";
  const type = ((e.author?.name || "").match(/Recrutement (.+)$/) || [])[1] || "Staff";
  return {
    id: msg.id,
    date: e.timestamp || msg.timestamp,
    name: e.title.replace(/^Candidature — /, ""),
    userId: (account.match(/<@(\d+)>/) || [])[1] || null,
    username: (account.match(/`@([^`]+)`/) || [])[1] || "",
    avatar: e.thumbnail?.url || "",
    identite,
    age: parseInt(field(e, "Âge"), 10) || null,
    source: field(e, "A rejoint via") || "—",
    type,
    status: decision ? decision.status : "pending",
    decidedBy: decision?.by || null,
    decidedAt: decision?.at || null,
    reason: decision?.reason || null,
    fiche: e.url || null,
    ref: e.url ? ficheRef(msg.id) : null,
    jump: guild ? `https://discord.com/channels/${guild}/${channelId()}/${msg.id}` : null,
  };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");

  let user;
  try { user = currentUser(req); } catch { return res.status(500).json({ error: "Connexion Discord non configurée." }); }
  if (!user) return res.status(401).json({ error: "Connectez-vous avec Discord." });
  if (!(await isStaff(user))) return res.status(403).json({ error: "Réservé au staff WaveSide." });
  if (!process.env.DISCORD_BOT_TOKEN || !channelId()) {
    return res.status(503).json({ error: "Le panneau nécessite le bot Discord : ajoutez DISCORD_BOT_TOKEN et DISCORD_CHANNEL_ID dans Vercel." });
  }

  const items = [];
  let before = "";
  for (let page = 0; page < MAX_PAGES; page++) {
    const r = await botApi(`/channels/${channelId()}/messages?limit=100${before ? `&before=${before}` : ""}`);
    if (!r.ok) {
      const code = r.data?.code;
      return res.status(502).json({ error: code === 50001 || code === 50013
        ? "Le bot n'a pas accès au salon des candidatures (permissions « Voir le salon » et « Voir l'historique »)."
        : "Impossible de lire le salon Discord." });
    }
    for (const m of r.data) { const it = parse(m, process.env.DISCORD_GUILD_ID); if (it) items.push(it); }
    if (r.data.length < 100) break;
    before = r.data[r.data.length - 1].id;
  }

  return res.status(200).json({ items, viewer: { name: user.name, avatar: user.avatar }, fetchedAt: Date.now() });
};
