/* ==========================================================================
   WAVESIDE — Outils Discord (bot, embeds, boutons, messages privés)

   Mode « bot » (recommandé) : DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID
     → messages avec boutons Accepter / Refuser / Ouvrir la fiche.
   Sinon repli sur le webhook DISCORD_WEBHOOK_URL (sans boutons).
   ========================================================================== */
const API = "https://discord.com/api/v10";
const LOGO = "https://imgg.fr/r/rw8tuwhj.png";
const COLORS = { pending: 0xe11d2e, accepted: 0x22c55e, refused: 0x4b5563 };

const botEnabled = () => !!(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID);
const channelId = () => process.env.DISCORD_CHANNEL_ID;
const discordInvite = () => process.env.DISCORD_INVITE_URL || "https://discord.gg/wavesiderp";
const ticketUrl = () => process.env.DISCORD_TICKET_URL || discordInvite();

/** Appel à l'API Discord avec le jeton du bot */
async function botApi(path, { method = "GET", json, form } = {}) {
  const headers = { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` };
  let body;
  if (form) body = form;
  else if (json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
  const r = await fetch(`${API}${path}`, { method, headers, body });
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) console.error(`Discord ${method} ${path}`, r.status, text.slice(0, 300));
  return { ok: r.ok, status: r.status, data };
}

/** Boutons du message de candidature */
function components({ ficheUrl, decision }) {
  const link = { type: 2, style: 5, label: "Ouvrir la fiche", url: ficheUrl };
  if (decision) {
    const done = {
      type: 2, style: decision.status === "accepted" ? 3 : 2, custom_id: "ws_done", disabled: true,
      label: `${decision.status === "accepted" ? "Acceptée" : "Refusée"} par ${String(decision.byName || "le staff").slice(0, 40)}`,
    };
    return [{ type: 1, components: [done, link] }];
  }
  return [{
    type: 1,
    components: [
      { type: 2, style: 3, custom_id: "ws_accept", label: "Accepter" },
      { type: 2, style: 4, custom_id: "ws_refuse", label: "Refuser" },
      link,
    ],
  }];
}

/** Message privé envoyé au candidat après la décision */
function decisionDM({ status, name, reason, site }) {
  const accepted = status === "accepted";
  const embed = accepted
    ? {
        color: COLORS.accepted,
        author: { name: "WaveSide Roleplay • Recrutement Staff", icon_url: LOGO },
        title: "Candidature acceptée",
        description: [
          `Félicitations **${name}** !`,
          "",
          "Votre candidature pour rejoindre l'équipe staff de **WaveSide** a été **acceptée**.",
          "",
          "### Prochaine étape",
          "Ouvrez un **ticket** sur le Discord WaveSide (catégorie *Recrutement*) pour finaliser votre intégration avec l'équipe.",
        ].join("\n"),
        ...(reason ? { fields: [{ name: "Message du staff", value: reason.slice(0, 1000) }] } : {}),
        thumbnail: { url: LOGO },
        footer: { text: "Bienvenue dans l'équipe • WaveSide Roleplay" },
        timestamp: new Date().toISOString(),
      }
    : {
        color: COLORS.pending,
        author: { name: "WaveSide Roleplay • Recrutement Staff", icon_url: LOGO },
        title: "Candidature non retenue",
        description: [
          `Bonjour **${name}**,`,
          "",
          "Merci pour le temps consacré à votre candidature. Après étude, elle **n'a pas été retenue** cette fois-ci.",
          "",
          "### Vous pourrez retenter votre chance",
          "Prenez en compte les retours ci-dessous et n'hésitez pas à **repostuler plus tard** : une nouvelle candidature est possible après 24 h.",
        ].join("\n"),
        fields: [{ name: "Retour du staff", value: (reason || "Aucun motif précisé.").slice(0, 1000) }],
        thumbnail: { url: LOGO },
        footer: { text: "Merci de votre intérêt • WaveSide Roleplay" },
        timestamp: new Date().toISOString(),
      };
  const button = accepted
    ? { type: 2, style: 5, label: "Ouvrir un ticket", url: ticketUrl() }
    : { type: 2, style: 5, label: "Repostuler plus tard", url: `${site}/#candidature` };
  return { embeds: [embed], components: [{ type: 1, components: [button] }], allowed_mentions: { parse: [] } };
}

/** Envoie un MP via le bot ; renvoie true si délivré */
async function sendDM(userId, payload) {
  if (!process.env.DISCORD_BOT_TOKEN) return false;
  const ch = await botApi("/users/@me/channels", { method: "POST", json: { recipient_id: userId } });
  if (!ch.ok) return false;
  const m = await botApi(`/channels/${ch.data.id}/messages`, { method: "POST", json: payload });
  return m.ok;
}

/** Lit la décision inscrite dans l'embed (champ « Décision ») */
function readDecision(embed) {
  const f = (embed?.fields || []).find((x) => x.name === "Décision");
  if (!f) return null;
  const status = /Accept/i.test(f.value) ? "accepted" : "refused";
  const by = (f.value.match(/<@(\d+)>/) || [])[1] || null;
  const at = (f.value.match(/<t:(\d+)/) || [])[1];
  const reason = (f.value.match(/Raison : ([\s\S]*?)(?:\n|$)/) || [])[1] || null;
  return { status, by, at: at ? +at * 1000 : null, reason };
}

module.exports = { API, LOGO, COLORS, botEnabled, channelId, botApi, components, decisionDM, sendDM, readDecision, discordInvite, ticketUrl };
