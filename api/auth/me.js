/* GET /api/auth/me → utilisateur connecté + jeton de formulaire horodaté */
const { sign, currentUser } = require("../../lib/session");

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) return res.status(503).json({ error: "config" });
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "unauthenticated" });
  // Jeton prouvant l'heure d'ouverture du formulaire (anti-remplissage robot)
  const formToken = sign({ kind: "form", uid: user.id, t: Date.now(), exp: Date.now() + 6 * 3600e3 });
  res.status(200).json({ user, formToken });
};
