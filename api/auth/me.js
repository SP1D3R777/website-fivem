/* GET /api/auth/me → utilisateur connecté + jeton de formulaire horodaté */
const { sign, currentUser } = require("../../lib/session");
const { isStaff } = require("../../lib/decision");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) return res.status(200).json({ configured: false, authenticated: false });
  const user = currentUser(req);
  // 200 même sans session : pas d'erreur rouge dans la console pour les visiteurs
  if (!user) return res.status(200).json({ authenticated: false });
  // Jeton prouvant l'heure d'ouverture du formulaire (anti-remplissage robot)
  const formToken = sign({ kind: "form", uid: user.id, t: Date.now(), exp: Date.now() + 6 * 3600e3 });
  let staff = false;
  try { staff = await isStaff(user); } catch {}
  res.status(200).json({ authenticated: true, user, formToken, staff });
};
