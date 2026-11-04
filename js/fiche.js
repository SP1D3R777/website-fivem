/* ==========================================================================
   WAVESIDE — Affichage d'une fiche de candidature (/fiche?id=…)
   ========================================================================== */
import { icon, hydrateIcons } from "./icons.js";

hydrateIcons();
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const para = (s) => (s ? esc(s).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("") : '<p class="muted">—</p>');
/* Liste courte (« patient, rigoureux, ponctuel ») → étiquettes ;
   vraies phrases → paragraphe intact (aucune coupure de phrase). */
const chips = (s) => {
  const txt = String(s || "").trim();
  const items = txt.split(/\n+|[•;]|,(?=\s)/).map((x) => x.replace(/^[-–\s]+/, "").trim()).filter(Boolean);
  const isList = items.length >= 2 && items.every((x) => x.length <= 32 && x.split(/\s+/).length <= 4 && !/[.!?]/.test(x.slice(0, -1)));
  return isList ? `<div class="chips">${items.map((x) => `<span class="chip">${esc(x.replace(/[.!]$/, ""))}</span>`).join("")}</div>` : para(txt);
};
const SRC_ICON = { Amis: "users", "Top-Serveur": "trophy", Discord: "discord" };

document.querySelectorAll(".logo-img").forEach((img) => img.addEventListener("error", () => (img.style.visibility = "hidden")));

function fail(msg) {
  $("#f-loading").hidden = true;
  $("#f-error").hidden = false;
  if (msg) $("#f-error-msg").textContent = msg;
}

/* Bloc « en attente » : boutons de décision pour le staff connecté */
function pendingBlock(c) {
  const v = c.viewer;
  if (v && v.staff) return `
    <section class="fdecide" id="fdecide">
      <div class="fdecide__head">
        <img src="${esc(v.avatar)}" alt="" />
        <div><b>Décision du staff</b><small>Connecté en tant que ${esc(v.name)}</small></div>
        <span class="fdecide__badge">${icon("clock")}En attente</span>
      </div>
      <label class="fdecide__label" for="fd-reason">Message au candidat <span>(facultatif, conseillé en cas de refus)</span></label>
      <textarea id="fd-reason" maxlength="700" rows="3" placeholder="Ex : réponses trop courtes, n'hésitez pas à développer vos motivations…"></textarea>
      <div class="fdecide__actions">
        <button class="btn fbtn fbtn--ok" data-decide="accepted"><span class="spin"></span>${icon("check")}<span class="lbl">Accepter</span></button>
        <button class="btn fbtn fbtn--ko" data-decide="refused"><span class="spin"></span>${icon("x")}<span class="lbl">Refuser</span></button>
      </div>
      <p class="fdecide__msg" id="fd-msg" hidden></p>
    </section>`;
  const login = `/api/auth/login?next=${encodeURIComponent(location.pathname + location.search)}`;
  return `
    <div class="fdecision fdecision--pending">
      <span class="fdecision__ico">${icon("clock")}</span>
      <div><b>En attente de décision</b>
        <small>${v ? "Seuls les membres du staff peuvent accepter ou refuser cette candidature." : `Membre du staff ? <a href="${login}">Connectez-vous avec Discord</a> pour accepter ou refuser.`}</small>
      </div>
    </div>`;
}

function bindDecision(c) {
  const box = document.getElementById("fdecide");
  if (!box) return;
  const msg = document.getElementById("fd-msg");
  box.querySelectorAll("[data-decide]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const status = btn.dataset.decide;
      // Double clic de confirmation
      if (!btn.classList.contains("is-confirm")) {
        box.querySelectorAll("[data-decide]").forEach((b) => { b.classList.remove("is-confirm"); b.querySelector(".lbl").textContent = b.dataset.decide === "accepted" ? "Accepter" : "Refuser"; });
        btn.classList.add("is-confirm");
        btn.querySelector(".lbl").textContent = status === "accepted" ? "Confirmer l'acceptation" : "Confirmer le refus";
        return;
      }
      box.querySelectorAll("[data-decide]").forEach((b) => (b.disabled = true));
      btn.classList.add("is-busy");
      msg.hidden = true;
      try {
        const r = await fetch("/api/decision", {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
          body: JSON.stringify({ id: c.ref, status, reason: document.getElementById("fd-reason").value }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
        c.decision = { ...(j.decision || { status }), at: Date.now() };
        c.dmNote = j.dmOk ? "Message privé envoyé au candidat." : "Le message privé n'a pas pu être envoyé : prévenez le candidat manuellement.";
        render(c);
      } catch (e) {
        msg.textContent = e.message; msg.hidden = false;
        box.querySelectorAll("[data-decide]").forEach((b) => (b.disabled = false));
        btn.classList.remove("is-busy");
      }
    });
  });
}

function render(c) {
  const u = c.user || { name: c.discord, username: c.discord };
  const date = new Date(c.date);
  const when = date.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });
  const words = ["presentation", "motivations", "pourquoi_waveside", "pourquoi_vous", "infos"].reduce((n, k) => n + String(c[k] || "").split(/\s+/).filter(Boolean).length, 0);
  document.title = `${u.name} — Candidature WaveSide`;

  const block = (ico, title, html, extra = "") => `
    <section class="fsec ${extra}">
      <h2 class="fsec__h"><span class="fsec__ico">${icon(ico)}</span>${title}</h2>
      <div class="fsec__body">${html}</div>
    </section>`;

  $("#f-content").innerHTML = `
    <header class="fhead">
      ${u.avatar ? `<img class="fhead__avatar fhead__avatar--img" src="${esc(u.avatar)}" alt="" />` : `<div class="fhead__avatar">${esc(String(u.name).slice(0, 1).toUpperCase())}</div>`}
      <div class="fhead__main">
        <p class="eyebrow">Candidature Staff</p>
        <h1 class="fhead__name">${esc(u.name)}</h1>
        <p class="fhead__user">${icon("discord")}@${esc(u.username)}${u.id ? ` <code>${esc(u.id)}</code>` : ""}</p>
        <p class="fhead__rp">${icon("idCard")}${esc(c.identite)}</p>
      </div>
      <div class="fhead__ref"><small>Référence</small><code>${esc(c.id)}</code></div>
    </header>

    ${c.decision ? `
    <div class="fdecision fdecision--${c.decision.status}">
      <span class="fdecision__ico">${icon(c.decision.status === "accepted" ? "check" : "x")}</span>
      <div>
        <b>Candidature ${c.decision.status === "accepted" ? "acceptée" : "refusée"}</b>
        <small>${c.decision.at ? new Date(c.decision.at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : ""}${c.decision.by ? ` • par le staff (ID ${esc(c.decision.by)})` : ""}</small>
        ${c.decision.reason ? `<p>${esc(c.decision.reason)}</p>` : ""}
        ${c.dmNote ? `<p class="fdecision__note">${esc(c.dmNote)}</p>` : ""}
      </div>
    </div>` : pendingBlock(c)}

    <div class="fstats">
      <div class="fstat"><span>${icon("user")}</span><div><small>Âge</small><b>${esc(c.age)} ans</b></div></div>
      <div class="fstat"><span>${icon(SRC_ICON[c.source] || "link")}</span><div><small>A rejoint via</small><b>${esc(c.source)}</b></div></div>
      <div class="fstat"><span>${icon("clock")}</span><div><small>Reçue le</small><b>${esc(when)}</b></div></div>
      <div class="fstat"><span>${icon("fileText")}</span><div><small>Longueur</small><b>${words} mots</b></div></div>
    </div>

    <div class="fgrid">
      ${block("check", "Qualités", chips(c.qualites), "fsec--ok")}
      ${block("alert", "Défauts", chips(c.defauts), "fsec--warn")}
    </div>
    ${block("user", "Présentation IRL", para(c.presentation))}
    ${block("sparkles", "Motivations", para(c.motivations), "fsec--accent")}
    <div class="fgrid">
      ${block("users", "Pourquoi rejoindre l'équipe WaveSide ?", para(c.pourquoi_waveside))}
      ${block("star", "Pourquoi lui et pas un autre ?", para(c.pourquoi_vous))}
    </div>
    ${c.infos ? block("info", "Informations complémentaires", para(c.infos)) : ""}

    <footer class="ffoot">
      <span>WaveSide Roleplay • Document interne au staff — ne pas partager publiquement.</span>
      <button class="btn btn--ghost btn--sm" id="act-discord" >${icon("discord")}Copier la mention</button>
    </footer>`;

  $("#f-loading").hidden = true;
  $("#f-content").hidden = false;
  $("#fbar-actions").hidden = false;

  const asText = () => [
    `CANDIDATURE STAFF — WAVESIDE`, `Réf. ${c.id} — ${when}`, ``,
    `Discord : @${u.username} (${u.name})${u.id ? ` — ID ${u.id}` : ""}`, `Identité RP : ${c.identite}`, `Âge : ${c.age}`, `A rejoint via : ${c.source}`, ``,
    `Qualités : ${c.qualites}`, `Défauts : ${c.defauts}`, ``, `Présentation IRL :`, c.presentation, ``,
    `Motivations :`, c.motivations, ``, `Pourquoi WaveSide :`, c.pourquoi_waveside, ``, `Pourquoi lui :`, c.pourquoi_vous,
    ...(c.infos ? [``, `Infos complémentaires :`, c.infos] : []),
  ].join("\n");

  const copy = async (txt, btn) => {
    try { await navigator.clipboard.writeText(txt); } catch { return; }
    const old = btn.innerHTML; btn.innerHTML = `${icon("check")}Copié`; setTimeout(() => (btn.innerHTML = old), 1600);
  };
  $("#act-copy").onclick = (e) => copy(asText(), e.currentTarget);
  $("#act-print").onclick = () => window.print();
  bindDecision(c);
  $("#act-discord").onclick = (e) => copy(u.id ? `<@${u.id}>` : `@${u.username}`, e.currentTarget);
}

const id = new URLSearchParams(location.search).get("id") || location.hash.slice(1);
if (!/^\d{17,20}\.[A-Za-z0-9_-]{22}$/.test(id || "")) fail("Ce lien de fiche est invalide.");
else {
  fetch(`/api/fiche?id=${encodeURIComponent(id)}`, { cache: "no-store" })
    .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error); return j; })
    .then((c) => { c.ref = id; render(c); })
    .catch((e) => fail(e.message || "Impossible de charger la candidature."));
}
