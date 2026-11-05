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

async function getJson(url, headers = {}, timeout = TIMEOUT) {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { "User-Agent": "WaveSide-Site", ...headers } });
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
  const wrap = (name, p) => p.catch((e) => { errors.push(`${name} : ${why(e)}`); return null; });

  // Les 3 sources sont interrogées EN PARALLÈLE ; on garde la plus complète disponible
  const [res1, res2, res3] = await Promise.all([
    ep ? wrap("ressource", getJson(`${ep}/waveside_status/status`, {}, 2500)) : null,
    ep ? wrap("dynamic.json", getJson(`${ep}/dynamic.json`, {}, 2500)) : null,
    cfx ? wrap("cfx.re", (async () => {
      for (const host of ["https://frontend.cfx-services.net", "https://servers-frontend.fivem.net"]) {
        try {
          const j = await getJson(`${host}/api/servers/single/${encodeURIComponent(cfx)}`, { Accept: "application/json" });
          if (j.Data && j.Data.clients != null) return j.Data;
        } catch {}
      }
      throw new Error("serveur introuvable dans la liste Cfx.re");
    })()) : null,
  ]);
  const extra = debug ? { errors } : {};

  if (res1) return res.status(200).json({
    configured: true, online: true, source: "resource",
    players: +res1.players || 0, max: +res1.max || 0, queue: +res1.queue || 0,
    startedAt: res1.startedAt ? res1.startedAt * 1000 : null, peak: +res1.peak || 0, checkedAt: now, ...extra,
  });
  if (res2) return res.status(200).json({
    configured: true, online: true, source: "fivem",
    players: +res2.clients || 0, max: +res2.sv_maxclients || 0, queue: null, startedAt: null, peak: null, checkedAt: now, ...extra,
  });
  if (res3) return res.status(200).json({
    configured: true, online: true, source: "cfx",
    players: +res3.clients || 0, max: +(res3.sv_maxclients || res3.svMaxclients || res3.vars?.sv_maxClients) || 0,
    queue: null, startedAt: null, peak: null, checkedAt: now, ...extra,
  });

  return res.status(200).json({
    configured: true, online: false, checkedAt: now,
    ...(debug ? { errors, endpoint: ep ? ep.replace(/(\d+\.\d+)\.\d+\.\d+/, "$1.x.x") : null, cfx: !!cfx } : {}),
  });
};
