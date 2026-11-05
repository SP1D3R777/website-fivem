/* ==========================================================================
   WAVESIDE — GET /api/team : l'équipe, récupérée depuis Discord
   Variables :
     DISCORD_BOT_TOKEN, DISCORD_GUILD_ID
     DISCORD_TEAM_ROLES = IDs des rôles à afficher, du plus haut au plus bas
                          (ex : Fondateur,Admin,Modérateur,Support), séparés par ,
   Prérequis Discord : portail → Bot → activer « Server Members Intent ».
   ========================================================================== */
const { botApi } = require("../lib/discord");
const { avatarUrl } = require("../lib/session");

const hex = (n) => (n ? `#${n.toString(16).padStart(6, "0")}` : "#ef3340");

module.exports = async (req, res) => {
  const guild = process.env.DISCORD_GUILD_ID;
  const order = (process.env.DISCORD_TEAM_ROLES || process.env.DISCORD_STAFF_ROLE_ID || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (!process.env.DISCORD_BOT_TOKEN || !guild || !order.length) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ configured: false, groups: [] });
  }

  const rolesRes = await botApi(`/guilds/${guild}/roles`);
  if (!rolesRes.ok) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Impossible de lire les rôles du serveur Discord (le bot est-il sur le serveur ?)." });
  }
  const roles = Object.fromEntries(rolesRes.data.map((r) => [r.id, r]));

  // Membres (pagination par 1000)
  const members = [];
  let after = "0";
  for (let page = 0; page < 10; page++) {
    const r = await botApi(`/guilds/${guild}/members?limit=1000&after=${after}`);
    if (!r.ok) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(502).json({ error: r.status === 403
        ? "Le bot n'a pas accès à la liste des membres : activez « Server Members Intent » dans le portail Discord (onglet Bot)."
        : "Impossible de lire les membres du serveur Discord." });
    }
    members.push(...r.data);
    if (r.data.length < 1000) break;
    after = r.data[r.data.length - 1].user.id;
  }

  const groups = order.filter((id) => roles[id]).map((id) => ({
    id, name: roles[id].name, color: hex(roles[id].color), members: [],
  }));
  const byId = Object.fromEntries(groups.map((g) => [g.id, g]));

  for (const m of members) {
    if (m.user.bot) continue;
    const top = order.find((id) => m.roles.includes(id) && byId[id]);
    if (!top) continue;
    const u = m.user;
    byId[top].members.push({
      id: u.id,
      name: m.nick || u.global_name || u.username,
      username: u.username,
      avatar: m.avatar
        ? `https://cdn.discordapp.com/guilds/${guild}/users/${u.id}/avatars/${m.avatar}.${m.avatar.startsWith("a_") ? "gif" : "png"}?size=256`
        : avatarUrl(u),
      since: m.joined_at,
    });
  }
  groups.forEach((g) => g.members.sort((a, b) => a.name.localeCompare(b.name, "fr")));

  // Cache CDN 5 min : évite de solliciter Discord à chaque visite
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).json({ configured: true, groups: groups.filter((g) => g.members.length), updatedAt: Date.now() });
};
