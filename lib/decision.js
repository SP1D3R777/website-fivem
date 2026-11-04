/* ==========================================================================
   WAVESIDE — Décision sur une candidature (depuis la fiche du site)
   - Vérifie que l'utilisateur connecté fait partie du staff
   - Envoie le message privé au candidat (si un bot est configuré)
   - Met à jour le message Discord (couleur + champ « Décision »)
   Fonctionne pour les messages postés par le bot OU par le webhook.
   ========================================================================== */
const { COLORS, botEnabled, channelId, botApi, components, decisionDM, sendDM, readDecision } = require("./discord");

const hook = () => process.env.DISCORD_WEBHOOK_URL;

/** Récupère le message Discord (bot puis webhook) */
async function fetchMessage(messageId) {
  if (botEnabled()) {
    const r = await botApi(`/channels/${channelId()}/messages/${messageId}`);
    if (r.ok) return { msg: r.data, via: "bot" };
  }
  if (hook()) {
    const r = await fetch(`${hook()}/messages/${messageId}`, { cache: "no-store" });
    if (r.ok) return { msg: await r.json(), via: "webhook" };
  }
  return null;
}

/** L'utilisateur fait-il partie du staff ? */
async function isStaff(user) {
  if (!user) return false;
  const ids = (process.env.DISCORD_STAFF_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.includes(user.id)) return true;
  const guild = process.env.DISCORD_GUILD_ID;
  const roles = (process.env.DISCORD_STAFF_ROLE_ID || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (guild && roles.length && process.env.DISCORD_BOT_TOKEN) {
    const r = await botApi(`/guilds/${guild}/members/${user.id}`);
    if (r.ok && (r.data.roles || []).some((x) => roles.includes(x))) return true;
  }
  return false;
}

async function applyDecision({ messageId, status, reason, staff, site }) {
  const found = await fetchMessage(messageId);
  if (!found) return { error: "Message Discord introuvable.", code: 404 };
  const { msg, via } = found;
  const embed = { ...(msg.embeds?.[0] || {}) };
  if (readDecision(embed)) return { error: "Cette candidature a déjà été traitée.", code: 409 };

  const candidateId = ((embed.fields || [])[0]?.value.match(/<@(\d+)>/) || [])[1];
  const name = (embed.title || "").replace(/^Candidature — /, "") || "candidat";
  const ficheUrl = embed.url;

  const dmOk = candidateId ? await sendDM(candidateId, decisionDM({ status, name, reason, site })) : false;

  const ts = Math.floor(Date.now() / 1000);
  embed.color = status === "accepted" ? COLORS.accepted : COLORS.refused;
  embed.fields = [
    ...(embed.fields || []),
    {
      name: "Décision",
      value: [
        `**${status === "accepted" ? "Acceptée" : "Refusée"}** par <@${staff.id}> • <t:${ts}:f>`,
        reason ? `Raison : ${reason.replace(/\n+/g, " ").slice(0, 700)}` : null,
        dmOk ? "Message privé envoyé au candidat."
             : process.env.DISCORD_BOT_TOKEN ? "Message privé non délivré (MP fermés ou candidat absent du serveur)."
             : "Aucun message privé envoyé (bot non configuré) : prévenez le candidat manuellement.",
      ].filter(Boolean).join("\n"),
    },
  ];

  const edit = {
    embeds: [embed],
    attachments: (msg.attachments || []).map((a) => ({ id: a.id })),
    allowed_mentions: { parse: [] },
    ...(via === "bot" && ficheUrl ? { components: components({ ficheUrl, decision: { status, byName: staff.name } }) } : {}),
  };
  const r = via === "bot"
    ? await botApi(`/channels/${channelId()}/messages/${messageId}`, { method: "PATCH", json: edit })
    : await fetch(`${hook()}/messages/${messageId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) });
  if (!r.ok) return { error: "Impossible de mettre à jour le message Discord.", code: 502 };

  return { ok: true, dmOk, decision: readDecision(embed) };
}

module.exports = { fetchMessage, isStaff, applyDecision };
