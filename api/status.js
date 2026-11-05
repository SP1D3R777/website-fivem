/* ==========================================================================
   WAVESIDE — GET /api/status : statut du serveur FiveM en direct
   Source 1 : ressource waveside_status  → http://IP:30120/waveside_status/status
              (joueurs, file d'attente, en ligne depuis, pic du jour)
   Source 2 : repli FiveM standard       → http://IP:30120/dynamic.json
   Variable : FIVEM_ENDPOINT = http://IP_DU_SERVEUR:30120
   ========================================================================== */
const TIMEOUT = 4000;

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT), headers: { "User-Agent": "WaveSide-Site" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

module.exports = async (req, res) => {
  // Mise en cache CDN 15 s : des centaines de visiteurs = 1 seule requête au serveur FiveM
  res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");
  const ep = (process.env.FIVEM_ENDPOINT || "").trim().replace(/\/+$/, "");
  if (!ep) return res.status(200).json({ configured: false, online: false });

  const now = Date.now();
  try {
    const s = await getJson(`${ep}/waveside_status/status`);
    return res.status(200).json({
      configured: true, online: true, source: "resource",
      players: +s.players || 0, max: +s.max || 0, queue: +s.queue || 0,
      startedAt: s.startedAt ? s.startedAt * 1000 : null, peak: +s.peak || 0,
      checkedAt: now,
    });
  } catch {}

  try {
    const d = await getJson(`${ep}/dynamic.json`);
    return res.status(200).json({
      configured: true, online: true, source: "fivem",
      players: +d.clients || 0, max: +d.sv_maxclients || 0, queue: null,
      startedAt: null, peak: null, checkedAt: now,
    });
  } catch {}

  return res.status(200).json({ configured: true, online: false, checkedAt: now });
};
