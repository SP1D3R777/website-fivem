/* ==========================================================================
   WAVESIDE — Fonction Vercel : lecture d'une fiche de candidature
   GET /api/fiche?id=<messageId>.<signature>

   Les réponses sont stockées dans le message Discord envoyé par le webhook
   (pièce jointe .dat). On relit ce message via le webhook lui-même, puis le
   fichier joint. La signature empêche d'ouvrir une fiche sans le vrai lien.
   ========================================================================== */
const { checkFicheRef } = require("../lib/session");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook) return res.status(500).json({ error: "Serveur non configuré." });

  let messageId;
  try { messageId = checkFicheRef(req.query?.id); } catch { return res.status(500).json({ error: "Serveur non configuré." }); }
  if (!messageId) return res.status(400).json({ error: "Ce lien de fiche est invalide." });

  try {
    const m = await fetch(`${hook}/messages/${messageId}`, { cache: "no-store" });
    if (m.status === 404) return res.status(404).json({ error: "Cette candidature a été supprimée du salon Discord." });
    if (!m.ok) { console.error("Discord get message", m.status, await m.text()); return res.status(502).json({ error: "Discord est indisponible, réessayez." }); }
    const msg = await m.json();
    const att = (msg.attachments || []).find((a) => /\.(dat|json)$/i.test(a.filename));
    if (!att) return res.status(404).json({ error: "Données de la candidature introuvables." });

    const f = await fetch(att.url, { cache: "no-store" });
    if (!f.ok) return res.status(502).json({ error: "Lecture du fichier impossible, réessayez." });
    const data = JSON.parse(await f.text());
    data.id = messageId;
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Lecture impossible." });
  }
};
