/* GET /api/auth/callback → échange du code Discord, création de la session */
const { sign, cookies, cookie, siteUrl, avatarUrl, SESSION_COOKIE, STATE_COOKIE, SESSION_DAYS } = require("../../lib/session");

const back = (res, reason, extraCookies = [], nextUrl = "") => {
  res.statusCode = 302;
  res.setHeader("Set-Cookie", [cookie(STATE_COOKIE, "", 0), cookie("ws_oauth_next", "", 0), ...extraCookies]);
  res.setHeader("Location", reason ? `/?auth=${reason}#candidature` : nextUrl || "/#candidature");
  res.end();
};

module.exports = async (req, res) => {
  const { code, state, error } = req.query || {};
  const n = cookies(req).ws_oauth_next || "";
  const nextUrl = /^\/(?!\/)/.test(n) ? n : "";
  if (error) return back(res, "denied");
  if (!code || !state || state !== cookies(req)[STATE_COOKIE]) return back(res, "state");

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: `${siteUrl(req)}/api/auth/callback`,
      }),
    });
    if (!tokenRes.ok) { console.error("OAuth token", tokenRes.status, await tokenRes.text()); return back(res, "token"); }
    const { access_token } = await tokenRes.json();

    const meRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` } });
    if (!meRes.ok) return back(res, "token");
    const u = await meRes.json();

    const user = {
      id: u.id,
      username: u.username,
      name: u.global_name || u.username,
      avatar: avatarUrl(u),
    };
    const exp = Date.now() + SESSION_DAYS * 864e5;
    return back(res, null, [cookie(SESSION_COOKIE, sign({ kind: "session", user, exp }), SESSION_DAYS * 86400)], nextUrl);
  } catch (e) {
    console.error(e);
    return back(res, "token");
  }
};
