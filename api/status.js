/* ==========================================================================
   WAVESIDE — GET /api/status : statut du serveur FiveM en direct
   Sources (dans l'ordre) :
     1. ressource waveside_status → http://IP:30120/waveside_status/status
     2. FiveM standard            → http://IP:30120/dynamic.json
     3. liste officielle Cfx.re   → frontend.cfx-services.net (code cfx.re/join)
   Variables :
     FIVEM_ENDPOINT = IP:30120 ou http://IP:30120   (http:// et :30120 ajoutés si absents)
     FIVEM_CFX_CODE = code de cfx.re/join/xxxxxx    (par défaut : jyz6ga)
   Ajoutez ?debug=1 à l'URL pour voir la raison d'un échec.
   ========================================================================== */
const TIMEOUT = 4500;

function normalize(raw) {
  let ep = String(raw || "").trim().replace(/\/+$/, "");
  if (!ep) return "";
  ep = ep.replace(/^fivem:\/\/connect\//i, "").replace(/^connect\s+/i, "");
  if (!/^https?:\/\//i.test(ep)) ep = `http://${ep}`;
  try {
    const u = new URL(ep);
    if (!u.port && u.protocol === "http:") u.port = "30120";
    return u.origin;
  } catch { return ""; }
}

async function getJson(url, headers = {}) {
  const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT), headers: { "User-Agent": "WaveSide-Site", ...headers } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
const why = (e) => (e.name === "TimeoutError" || e.name === "AbortError") ? "délai dépassé (port fermé ou pare-feu ?)"
  : e.cause?.code ? `${e.cause.code}` : e.message;

module.exports = async (req, res) => {
  const debug = req.query?.debug === "1";
  res.setHeader("Cache-Control", debug ? "no-store" : "public, s-maxage=15, stale-while-revalidate=30");
  const ep = normalize(process.env.FIVEM_ENDPOINT);
  const cfx = String(process.env.FIVEM_CFX_CODE || "jyz6ga").trim() // cfx.re/join/jyz6ga (public)
   .replace(/^.*\/join\//, "");
  if (!ep && !cfx) return res.status(200).json({ configured: false, online: false });

  const now = Date.now(), errors = [];

  if (ep) {
    try {
      const s = await getJson(`${ep}/waveside_status/status`);
      return res.status(200).json({
        configured: true, online: true, source: "resource",
        players: +s.players || 0, max: +s.max || 0, queue: +s.queue || 0,
        startedAt: s.startedAt ? s.startedAt * 1000 : null, peak: +s.peak || 0, checkedAt: now,
      });
    } catch (e) { errors.push(`ressource : ${why(e)}`); }

    try {
      const d = await getJson(`${ep}/dynamic.json`);
      return res.status(200).json({
        configured: true, online: true, source: "fivem",
        players: +d.clients || 0, max: +d.sv_maxclients || 0, queue: null, startedAt: null, peak: null, checkedAt: now,
        ...(debug ? { errors } : {}),
      });
    } catch (e) { errors.push(`dynamic.json : ${why(e)}`); }
  }

  if (cfx) {
    // API officielle Cfx.re (nouvelle adresse puis ancienne)
    for (const host of ["https://frontend.cfx-services.net", "https://servers-frontend.fivem.net"]) {
      try {
        const j = await getJson(`${host}/api/servers/single/${encodeURIComponent(cfx)}`, { Accept: "application/json" });
        const d = j.Data || {};
        if (d.clients == null) throw new Error("serveur absent de la liste");
        return res.status(200).json({
          configured: true, online: true, source: "cfx",
          players: +d.clients || 0, max: +(d.sv_maxclients || d.svMaxclients || d.vars?.sv_maxClients) || 0,
          queue: null, startedAt: null, peak: null, checkedAt: now,
          ...(debug ? { errors } : {}),
        });
      } catch (e) { errors.push(`${new URL(host).hostname} : ${why(e)}`); }
    }
  }

  return res.status(200).json({
    configured: true, online: false, checkedAt: now,
    ...(debug ? { errors, endpoint: ep ? ep.replace(/(\d+\.\d+)\.\d+\.\d+/, "$1.x.x") : null, cfx: !!cfx } : {}),
  });
};
