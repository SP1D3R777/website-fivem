/* ==========================================================================
   WAVESIDE — POST /api/decision  { id, status: "accepted"|"refused", reason }
   Réservé au staff connecté avec Discord (DISCORD_STAFF_IDS ou rôle staff).
   ========================================================================== */
const { currentUser, originOk, checkFicheRef, siteUrl } = require("../lib/session");
const { isStaff, applyDecision } = require("../lib/decision");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });
  if (!originOk(req)) return res.status(403).json({ error: "Requête refusée." });

  let user;
  try { user = currentUser(req); } catch { return res.status(500).json({ error: "Connexion Discord non configurée." }); }
  if (!user) return res.status(401).json({ error: "Connectez-vous avec Discord." });
  if (!(await isStaff(user))) return res.status(403).json({ error: "Réservé au staff WaveSide." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  let messageId;
  try { messageId = checkFicheRef(body.id); } catch { messageId = null; }
  if (!messageId) return res.status(400).json({ error: "Fiche invalide." });
  if (!["accepted", "refused"].includes(body.status)) return res.status(400).json({ error: "Décision invalide." });
  const reason = String(body.reason || "").replace(/@(everyone|here)/gi, "@​$1").trim().slice(0, 700) || null;

  const out = await applyDecision({ messageId, status: body.status, reason, staff: user, site: siteUrl(req) });
  if (out.error) return res.status(out.code || 500).json({ error: out.error });
  return res.status(200).json(out);
};
