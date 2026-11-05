/* ==========================================================================
   WAVESIDE — Statut en direct, page Équipe, panneau d'administration
   ========================================================================== */
import { icon } from "./icons.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("fr-FR"));
const ago = (ms) => {
  const m = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ${String(m % 60).padStart(2, "0")}` : `${Math.floor(h / 24)} j ${h % 24} h`;
};
const STATE = (view) => `<div class="team__state">${view}</div>`;

/* ==========================================================================
   1) Statut du serveur (accueil, barre d'infos, page connexion)
   ========================================================================== */
let statusTimer = null;
async function refreshStatus() {
  let s;
  try { s = await (await fetch("/api/status", { cache: "no-store" })).json(); }
  catch { s = { configured: false, online: false, error: true }; }

  const on = s.online, unknown = !s.configured || s.error;
  const pct = on && s.max ? Math.min(100, (s.players / s.max) * 100) : 0;
  const label = unknown ? "Statut indisponible" : on ? "En ligne" : "Hors ligne";

  // Pastille du hero
  const pill = $("[data-live-pill]");
  if (pill) {
    pill.classList.toggle("is-off", !on && !unknown);
    pill.classList.toggle("is-wait", unknown);
    $("[data-live-text]", pill).textContent = unknown ? "Serveur FiveM • Whitelist ouverte"
      : on ? `En ligne • ${fmt(s.players)} / ${fmt(s.max)} joueurs` : "Serveur hors ligne";
  }
  // Barre d'infos
  const info = $("[data-live-info]");
  if (info) {
    info.classList.toggle("is-on", !!on); info.classList.toggle("is-off", !on && !unknown);
    $("[data-live-count]", info).textContent = on ? `${fmt(s.players)} / ${fmt(s.max)}` : label;
    $("[data-live-sub]", info).textContent = on ? (s.queue ? `${fmt(s.queue)} en file d'attente` : "Joueurs connectés") : unknown ? "Serveur FiveM" : "Revenez bientôt";
  }
  // Carte « en direct »
  const card = $("[data-live-card]");
  if (card) {
    card.classList.toggle("is-on", !!on); card.classList.toggle("is-off", !on && !unknown);
    $("[data-live-badge] span", card).textContent = label;
    $("[data-live-players]", card).textContent = on ? fmt(s.players) : "0";
    $("[data-live-max]", card).textContent = on ? fmt(s.max) : "—";
    $("[data-live-bar]", card).style.width = `${pct}%`;
    $("[data-live-queue]", card).textContent = on ? (s.queue == null ? "—" : s.queue ? `${fmt(s.queue)} joueur${s.queue > 1 ? "s" : ""}` : "Aucune") : "—";
    $("[data-live-uptime]", card).textContent = on && s.startedAt ? ago(s.startedAt) : "—";
    $("[data-live-peak]", card).textContent = on && s.peak ? `${fmt(s.peak)} joueurs` : "—";
    $("[data-live-hint]", card).textContent = unknown
      ? "Le statut en direct n'est pas encore configuré."
      : on ? `${Math.round(pct)} % de remplissage • actualisé à ${new Date(s.checkedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
      : "Le serveur est arrêté ou en redémarrage. Suivez les annonces sur le Discord.";
  }
  // Page connexion
  const inl = $("[data-live-inline]");
  if (inl) {
    inl.classList.toggle("is-on", !!on); inl.classList.toggle("is-off", !on && !unknown);
    inl.textContent = unknown ? "Serveur FiveM • Whitelist" : on ? `En ligne • ${fmt(s.players)} / ${fmt(s.max)} joueurs${s.queue ? ` • ${fmt(s.queue)} en file` : ""}` : "Serveur hors ligne pour le moment";
  }
}

export function initStatus() {
  refreshStatus();
  clearInterval(statusTimer);
  statusTimer = setInterval(() => { if (!document.hidden) refreshStatus(); }, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshStatus(); });
}

/* ==========================================================================
   2) Session : afficher le lien Admin au staff
   ========================================================================== */
let me = null;
export async function loadMe() {
  if (me !== null) return me;
  try {
    const r = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
    me = r.ok ? await r.json() : false;
  } catch { me = false; }
  $$("[data-staff-only]").forEach((el) => (el.hidden = !(me && me.staff)));
  return me;
}

/* ==========================================================================
   3) Page Équipe
   ========================================================================== */
let teamLoaded = false;
export async function showTeam() {
  if (teamLoaded) return;
  const box = $("#team");
  try {
    const r = await fetch("/api/team");
    const d = await r.json();
    if (!r.ok) throw new Error((d.error || "Erreur") + (d.detail ? ` [${d.detail}${d.botId ? ` • bot ${d.botId}` : ""}]` : ""));
    if (!d.configured) {
      box.innerHTML = STATE(`${icon("users")}<h3>Équipe bientôt affichée</h3><p>La synchronisation avec les rôles Discord n'est pas encore configurée.</p>`);
      return;
    }
    if (!d.groups.length) { box.innerHTML = STATE(`<h3>Aucun membre trouvé</h3><p>Vérifiez les rôles configurés.</p>`); return; }
    box.innerHTML = d.groups.map((g) => `
      <section class="team__group reveal" style="--rc:${esc(g.color)}">
        <div class="team__gh"><h2>${esc(g.name)}</h2><span>${g.members.length}</span></div>
        <div class="team__grid">
          ${g.members.map((m) => `
            <article class="member" data-tilt style="--rc:${esc(g.color)}">
              <img class="member__av" src="${esc(m.avatar)}" alt="" loading="lazy" />
              <b>${esc(m.name)}</b>
              <small>@${esc(m.username)}</small>
              <span class="member__role">${esc(g.name)}</span>
            </article>`).join("")}
        </div>
      </section>`).join("");
    teamLoaded = true;
    requestAnimationFrame(() => $$(".reveal", box).forEach((e) => e.classList.add("is-in")));
  } catch (e) {
    box.innerHTML = STATE(`${icon("alert")}<h3>Équipe indisponible</h3><p>${esc(e.message)}</p>`);
  }
}

/* ==========================================================================
   4) Panneau d'administration
   ========================================================================== */
const ST_LABEL = { pending: "En attente", accepted: "Acceptée", refused: "Refusée" };
let adm = { items: [], status: "all", period: 0, type: "", q: "", loaded: false };

function filtered() {
  const q = adm.q.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const since = adm.period ? Date.now() - adm.period * 864e5 : 0;
  return adm.items.filter((it) =>
    (adm.status === "all" || it.status === adm.status) &&
    (!adm.type || it.type === adm.type) &&
    (!since || new Date(it.date).getTime() >= since) &&
    (!q || `${it.name} ${it.username} ${it.identite}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(q)));
}

function renderStats() {
  const all = adm.items, n = all.length;
  const c = (s) => all.filter((i) => i.status === s).length;
  const acc = c("accepted"), ref = c("refused"), pen = c("pending");
  const rate = acc + ref ? Math.round((acc / (acc + ref)) * 100) : 0;
  const week = all.filter((i) => Date.now() - new Date(i.date) < 7 * 864e5).length;
  const kpi = (ico, label, val, sub, col) => `<div class="kpi" style="--kc:${col}"><small>${icon(ico)}${label}</small><b>${val}</b><em>${sub}</em></div>`;
  $("#adm-stats").innerHTML =
    kpi("inbox", "Total", fmt(n), `${fmt(week)} cette semaine`, "#ef3340") +
    kpi("hourglass", "En attente", fmt(pen), pen ? "à traiter" : "rien à traiter", "#f5a524") +
    kpi("check", "Acceptées", fmt(acc), `${n ? Math.round((acc / n) * 100) : 0} % du total`, "#22c55e") +
    kpi("x", "Refusées", fmt(ref), `${n ? Math.round((ref / n) * 100) : 0} % du total`, "#6b7280") +
    kpi("chart", "Taux d'acceptation", `${rate} %`, "sur les candidatures traitées", "#ff5c6c");

  // Graphique 30 jours
  const days = [...Array(30)].map((_, k) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (29 - k)); return d; });
  const counts = days.map((d) => all.filter((i) => { const t = new Date(i.date); return t >= d && t < new Date(d.getTime() + 864e5); }).length);
  const max = Math.max(1, ...counts);
  $("#adm-chart").innerHTML = counts.map((v, k) => `<span class="b${v ? "" : " z"}" style="--h:${(v / max) * 100}%" data-tip="${days[k].toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} : ${v}"></span>`).join("")
  ;
  const axis = $("#adm-axis") || Object.assign(document.createElement("div"), { id: "adm-axis", className: "adm__axis" });
  axis.innerHTML = `<span>${days[0].toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span><span>Aujourd'hui</span>`;
  $("#adm-chart").after(axis);

  // Sources
  const srcs = {};
  all.forEach((i) => (srcs[i.source] = (srcs[i.source] || 0) + 1));
  const entries = Object.entries(srcs).sort((a, b) => b[1] - a[1]);
  $("#adm-sources").innerHTML = entries.length ? entries.map(([k, v]) => `
    <div class="src"><div class="src__top"><span>${esc(k)}</span><b>${v} · ${Math.round((v / n) * 100)} %</b></div><div class="src__bar"><span style="width:${(v / n) * 100}%"></span></div></div>`).join("")
    : '<p class="muted">Aucune donnée.</p>';

  // Types
  const types = [...new Set(all.map((i) => i.type))];
  const sel = $("#adm-type");
  sel.innerHTML = `<option value="">Tous les types</option>${types.map((t) => `<option value="${esc(t)}"${t === adm.type ? " selected" : ""}>${esc(t)}</option>`).join("")}`;
}

function renderList() {
  const list = filtered();
  $("#adm-count").textContent = `${list.length} candidature${list.length > 1 ? "s" : ""} affichée${list.length > 1 ? "s" : ""} sur ${adm.items.length}`;
  $("#adm-list").innerHTML = list.length ? list.map((it) => {
    const d = new Date(it.date);
    return `<article class="arow">
      <img src="${esc(it.avatar)}" alt="" loading="lazy" />
      <div class="cell"><b>${esc(it.name)}</b><small>@${esc(it.username)} • ${esc(it.type)}</small></div>
      <div class="cell c-rp"><small>Identité RP</small>${esc(it.identite || "—")}</div>
      <div class="cell c-age"><small>Âge</small>${it.age ? `${it.age} ans` : "—"}</div>
      <div class="cell c-src"><small>Origine</small>${esc(it.source)}</div>
      <div class="cell c-date"><small>${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</small><span class="st st--${it.status}"><i></i>${ST_LABEL[it.status]}</span></div>
      <div class="arow__act">
        ${it.ref ? `<a class="btn btn--${it.status === "pending" ? "primary" : "ghost"} btn--sm" href="/fiche?id=${encodeURIComponent(it.ref)}" target="_blank" rel="noopener">${icon("fileText")}${it.status === "pending" ? "Traiter" : "Fiche"}</a>` : ""}
        ${it.jump ? `<a class="icon-btn icon-btn--sm" href="${esc(it.jump)}" target="_blank" rel="noopener" title="Voir sur Discord">${icon("discord")}</a>` : ""}
      </div>
    </article>`;
  }).join("") : '<div class="adm__empty">Aucune candidature ne correspond à ces filtres.</div>';
}

function exportCsv() {
  const rows = [["Date", "Pseudo", "Compte", "ID Discord", "Identité RP", "Âge", "Origine", "Type", "Statut", "Raison", "Fiche"]]
    .concat(filtered().map((i) => [new Date(i.date).toLocaleString("fr-FR"), i.name, i.username, i.userId, i.identite, i.age, i.source, i.type, ST_LABEL[i.status], i.reason || "", i.ref ? `${location.origin}/fiche?id=${i.ref}` : ""]));
  const csv = "﻿" + rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `candidatures-waveside-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function loadAdmin(force) {
  const state = $("#adm-state"), app = $("#adm-app");
  if (force) $("#adm-refresh").classList.add("is-busy");
  try {
    const r = await fetch("/api/admin", { cache: "no-store", credentials: "same-origin" });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) {
      const next = encodeURIComponent("/#admin");
      state.innerHTML = `${icon("lock")}<h3>Espace réservé au staff</h3><p>Connectez-vous avec Discord pour accéder au panneau.</p><a class="btn btn--discord" href="/api/auth/login?next=${next}">${icon("discord")}Se connecter avec Discord</a>`;
      state.hidden = false; app.hidden = true; return;
    }
    if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`);
    adm.items = d.items; adm.loaded = true;
    const meBox = $("#adm-me");
    meBox.innerHTML = `<img src="${esc(d.viewer.avatar)}" alt="" /><div><b>${esc(d.viewer.name)}</b><small>Staff connecté</small></div>`;
    meBox.hidden = false;
    state.hidden = true; app.hidden = false;
    renderStats(); renderList();
  } catch (e) {
    state.innerHTML = `${icon("alert")}<h3>Panneau indisponible</h3><p>${esc(e.message)}</p>`;
    state.hidden = false; app.hidden = true;
  } finally { $("#adm-refresh")?.classList.remove("is-busy"); }
}

let admBound = false;
export function showAdmin() {
  if (!admBound) {
    admBound = true;
    let t;
    $("#adm-q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { adm.q = e.target.value.trim(); renderList(); }, 120); });
    $("#adm-status").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      $$("#adm-status button").forEach((x) => x.classList.toggle("is-on", x === b));
      adm.status = b.dataset.v; renderList();
    });
    $("#adm-period").addEventListener("change", (e) => { adm.period = +e.target.value; renderList(); });
    $("#adm-type").addEventListener("change", (e) => { adm.type = e.target.value; renderList(); });
    $("#adm-refresh").addEventListener("click", () => loadAdmin(true));
    $("#adm-csv").addEventListener("click", exportCsv);
  }
  loadAdmin(false);
}
