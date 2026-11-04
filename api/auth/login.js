/* GET /api/auth/login → redirection vers l'autorisation Discord (scope identify) */
const crypto = require("crypto");
const { cookie, siteUrl, STATE_COOKIE } = require("../../lib/session");

module.exports = (req, res) => {
  const id = process.env.DISCORD_CLIENT_ID;
  if (!id || !process.env.DISCORD_CLIENT_SECRET) {
    res.statusCode = 302;
    res.setHeader("Location", "/?auth=config#candidature");
    return res.end();
  }
  const state = crypto.randomBytes(16).toString("base64url");
  const params = new URLSearchParams({
    client_id: id,
    response_type: "code",
    scope: "identify",
    redirect_uri: `${siteUrl(req)}/api/auth/callback`,
    state,
    prompt: "none",
  });
  res.setHeader("Set-Cookie", cookie(STATE_COOKIE, state, 600));
  res.statusCode = 302;
  res.setHeader("Location", `https://discord.com/oauth2/authorize?${params}`);
  res.end();
};
