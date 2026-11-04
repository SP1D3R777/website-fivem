/* ==========================================================================
   WAVESIDE — Interactions Discord (boutons Accepter / Refuser)
   URL à renseigner dans le portail développeur Discord :
   General Information → Interactions Endpoint URL
   → https://www.waveside.fr/api/interactions

   Variables : DISCORD_PUBLIC_KEY, DISCORD_BOT_TOKEN,
               DISCORD_STAFF_ROLE_ID (facultatif, plusieurs IDs séparés par ,)
   ========================================================================== */
const crypto = require("crypto");
const { COLORS, components, decisionDM, sendDM, readDecision } = require("../lib/discord");
const { siteUrl } = require("../lib/session");

const json = (res, code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
const ephemeral = (res, content) => json(res, 200, { type: 4, data: { content, flags: 64 } });

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifySignature(req, body) {
  const sig = req.headers["x-signature-ed25519"], ts = req.headers["x-signature-timestamp"];
  const pub = process.env.DISCORD_PUBLIC_KEY;
  if (!sig || !ts || !pub) return false;
  try {
    const key = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pub, "hex")]), format: "der", type: "spki" });
    return crypto.verify(null, Buffer.concat([Buffer.from(ts), body]), key, Buffer.from(sig, "hex"));
  } catch { return false; }
}

/** Le membre a-t-il le droit de décider ? (rôle staff, admin ou gérer le serveur) */
function canDecide(member) {
  if (!member) return false;
  const perms = BigInt(member.permissions || "0");
  if ((perms & 0x8n) || (perms & 0x20n)) return true; // Administrateur / Gérer le serveur
  const roles = (process.env.DISCORD_STAFF_ROLE_ID || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!roles.length) return true; // pas de rôle configuré : quiconque voit le salon
  return (member.roles || []).some((r) => roles.includes(r));
}

async function decide(req, res, i, status, reason) {
  const msg = i.message;
  const embed = { ...(msg.embeds?.[0] || {}) };
  if (readDecision(embed)) return ephemeral(res, "Cette candidature a déjà été traitée.");

  const candidateId = ((embed.fields || [])[0]?.value.match(/<@(\d+)>/) || [])[1];
  const name = (embed.title || "").replace(/^Candidature — /, "") || "candidat";
  const staff = i.member.user;
  const staffName = i.member.nick || staff.global_name || staff.username;
  const ficheUrl = embed.url || msg.components?.[0]?.components?.find((c) => c.style === 5)?.url;

  // Message privé au candidat
  const dmOk = candidateId ? await sendDM(candidateId, decisionDM({ status, name, reason, site: siteUrl(req) })) : false;

  const ts = Math.floor(Date.now() / 1000);
  embed.color = status === "accepted" ? COLORS.accepted : COLORS.refused;
  embed.fields = [
    ...(embed.fields || []),
    {
      name: "Décision",
      value: [
        `**${status === "accepted" ? "Acceptée" : "Refusée"}** par <@${staff.id}> • <t:${ts}:f>`,
        reason ? `Raison : ${reason.replace(/\n+/g, " ").slice(0, 700)}` : null,
        dmOk ? "Message privé envoyé au candidat." : "Message privé non délivré (MP fermés ou candidat absent du serveur).",
      ].filter(Boolean).join("\n"),
    },
  ];

  return json(res, 200, {
    type: 7, // UPDATE_MESSAGE
    data: {
      embeds: [embed],
      components: components({ ficheUrl, decision: { status, byName: staffName } }),
      allowed_mentions: { parse: [] },
    },
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Méthode non autorisée" });
  const body = await rawBody(req);
  if (!verifySignature(req, body)) return json(res, 401, { error: "Signature invalide" });

  let i; try { i = JSON.parse(body.toString()); } catch { return json(res, 400, {}); }

  if (i.type === 1) return json(res, 200, { type: 1 }); // PING de vérification Discord

  const id = i.data?.custom_id;
  if (!canDecide(i.member)) return ephemeral(res, "Vous n'avez pas la permission de traiter les candidatures.");

  if (i.type === 3 && id === "ws_accept") return decide(req, res, i, "accepted", null);

  if (i.type === 3 && id === "ws_refuse") {
    if (readDecision(i.message?.embeds?.[0])) return ephemeral(res, "Cette candidature a déjà été traitée.");
    return json(res, 200, {
      type: 9, // MODAL
      data: {
        custom_id: "ws_refuse_modal",
        title: "Refuser la candidature",
        components: [{
          type: 1,
          components: [{
            type: 4, custom_id: "reason", style: 2, label: "Retour pour le candidat (envoyé en MP)",
            placeholder: "Ex : réponses trop courtes, manque d'expérience…", required: false, max_length: 700,
          }],
        }],
      },
    });
  }

  if (i.type === 5 && id === "ws_refuse_modal") {
    const reason = i.data.components?.[0]?.components?.[0]?.value?.trim() || null;
    return decide(req, res, i, "refused", reason);
  }

  return ephemeral(res, "Action inconnue.");
};
