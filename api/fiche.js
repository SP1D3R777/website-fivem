/* ==========================================================================
   WAVESIDE — Fonction Vercel : lecture d'une candidature
   GET /api/fiche?id=XXXXXXXXXXXXXXXX  → JSON de la candidature
   ========================================================================== */
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  const id = String(req.query?.id || "");
  if (!/^[A-Za-z0-9_-]{16}$/.test(id)) return res.status(400).json({ error: "Lien invalide." });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(500).json({ error: "Stockage non configuré." });

  try {
    const { list } = require("@vercel/blob");
    const { blobs } = await list({ prefix: `candidatures/${id}.json`, limit: 1 });
    if (!blobs.length) return res.status(404).json({ error: "Candidature introuvable." });
    const r = await fetch(blobs[0].url, { cache: "no-store" });
    if (!r.ok) return res.status(404).json({ error: "Candidature introuvable." });
    return res.status(200).json(await r.json());
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Lecture impossible." });
  }
};
