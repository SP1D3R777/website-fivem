/* ==========================================================================
   WAVESIDE — Fonction Vercel : lecture d'une fiche de candidature
   GET /api/fiche?id=<messageId>.<signature>

   Les réponses sont stockées dans le message Discord envoyé par le webhook
   (pièce jointe .dat). On relit ce message via le webhook lui-même, puis le
   fichier joint. La signature empêche d'ouvrir une fiche sans le vrai lien.
   ========================================================================== */
const { checkFicheRef } = require("../lib/session");
const { botEnabled, channelId, botApi, readDecision } = require("../lib/discord");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook && !botEnabled()) return res.status(500).json({ error: "Serveur non configuré." });

  let messageId;
  try { messageId = checkFicheRef(req.query?.id); } catch { return res.status(500).json({ error: "Serveur non configuré." }); }
  if (!messageId) return res.status(400).json({ error: "Ce lien de fiche est invalide." });

  try {
    // Le message peut avoir été posté par le bot ou par le webhook : on essaie les deux
    let msg = null, status = 0;
    if (botEnabled()) {
      const r = await botApi(`/channels/${channelId()}/messages/${messageId}`);
      status = r.status; if (r.ok) msg = r.data;
    }
    if (!msg && hook) {
      const m = await fetch(`${hook}/messages/${messageId}`, { cache: "no-store" });
      status = m.status; if (m.ok) msg = await m.json();
    }
    if (!msg) return status === 404 || status === 10008
      ? res.status(404).json({ error: "Cette candidature a été supprimée du salon Discord." })
      : res.status(502).json({ error: "Discord est indisponible, réessayez." });
    const att = (msg.attachments || []).find((a) => /\.(dat|json)$/i.test(a.filename));
    if (!att) return res.status(404).json({ error: "Données de la candidature introuvables." });

    const f = await fetch(att.url, { cache: "no-store" });
    if (!f.ok) return res.status(502).json({ error: "Lecture du fichier impossible, réessayez." });
    const data = JSON.parse(await f.text());
    data.id = messageId;
    data.decision = readDecision(msg.embeds?.[0]);
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Lecture impossible." });
  }
};
