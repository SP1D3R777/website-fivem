/* GET /api/auth/logout → supprime la session puis renvoie vers la candidature */
const { cookie, SESSION_COOKIE } = require("../../lib/session");

module.exports = (req, res) => {
  res.statusCode = 302;
  res.setHeader("Set-Cookie", cookie(SESSION_COOKIE, "", 0));
  res.setHeader("Location", "/#candidature");
  res.end();
};
