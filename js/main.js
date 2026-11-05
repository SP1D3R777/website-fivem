/* ==========================================================================
   WAVESIDE ROLEPLAY — Logique de l'interface
   Loader • Sons UI • Router • Wiki du règlement • Connexion FiveM • Effets
   ========================================================================== */
import { RULES } from "./rules.js";
import { icon, hydrateIcons } from "./icons.js";
import { initCandidature } from "./candidature.js";
import { initStatus, loadMe, showTeam, showAdmin } from "./live.js";
import { initVote } from "./vote.js";

const CONFIG = {
  ip: "play.waveside.fr",
  fivemUrl: "fivem://connect/play.waveside.fr",
  discord: "https://discord.gg/wavesiderp",
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const VIEWS = ["accueil", "reglement", "candidature", "equipe", "vote", "admin", "connexion"];
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

hydrateIcons();

/* ==========================================================================
   Sons de l'interface (synthétisés en Web Audio : aucun fichier à charger)
   Les navigateurs n'autorisent le son qu'après une première interaction
   (clic / touche) : le moteur se débloque automatiquement à ce moment-là.
   ========================================================================== */
const Sound = (() => {
  let ctx = null, master = null;
  let enabled = store.get("ws-sound") !== "off";

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone({ f1, f2 = f1, dur = 0.08, type = "sine", vol = 0.05, delay = 0 }) {
    if (!enabled || !ctx || ctx.state !== "running") return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise({ dur = 0.05, vol = 0.03, freq = 2400 }) {
    if (!enabled || !ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.2;
    g.gain.value = vol;
    src.connect(f).connect(g).connect(master); src.start(t);
  }

  return {
    unlock: ensure,
    hover() { tone({ f1: 1500, f2: 1150, dur: 0.05, type: "triangle", vol: 0.03 }); tone({ f1: 2900, f2: 2600, dur: 0.03, vol: 0.008 }); },
    click() { tone({ f1: 520, f2: 170, dur: 0.13, vol: 0.09 }); noise({ dur: 0.04, vol: 0.035, freq: 2600 }); },
    success() { tone({ f1: 660, dur: 0.09, vol: 0.05, type: "triangle" }); tone({ f1: 990, dur: 0.14, vol: 0.05, type: "triangle", delay: 0.08 }); },
    whoosh() { noise({ dur: 0.18, vol: 0.025, freq: 900 }); },
    get enabled() { return enabled; },
    set enabled(v) { enabled = v; store.set("ws-sound", v ? "on" : "off"); },
  };
})();

const unlockOnce = () => Sound.unlock();
window.addEventListener("pointerdown", unlockOnce, { passive: true });
window.addEventListener("keydown", unlockOnce);

const SOUND_SEL = ".btn, .nav__link, .icon-btn, .tree__chap, .tree__subs a, .info, .faction__link, .pager a, .socials a, .footer__ip, .footer__col a, .sres, #wiki-toc a, .brand, .choice, .consent, .seg button, .arow a, .member";
let lastHover = 0, hoverEl = null;
document.addEventListener("pointerover", (e) => {
  if (e.pointerType && e.pointerType !== "mouse") return;
  const el = e.target.closest(SOUND_SEL);
  if (!el || el === hoverEl) return;
  hoverEl = el;
  const now = performance.now();
  if (now - lastHover > 45) { Sound.hover(); lastHover = now; }
});
document.addEventListener("pointerout", (e) => { if (hoverEl && !hoverEl.contains(e.relatedTarget)) hoverEl = null; });
document.addEventListener("click", (e) => { if (e.target.closest(SOUND_SEL)) Sound.click(); }, true);

const soundBtn = $("#sound-toggle");
function paintSound() {
  soundBtn.innerHTML = icon(Sound.enabled ? "volume" : "mute");
  soundBtn.classList.toggle("is-muted", !Sound.enabled);
  soundBtn.setAttribute("aria-pressed", String(Sound.enabled));
}
soundBtn.addEventListener("click", () => {
  Sound.enabled = !Sound.enabled; Sound.unlock(); paintSound();
  if (Sound.enabled) Sound.success();
  toast(Sound.enabled ? "Sons activés" : "Sons coupés", "Effets sonores de l'interface", "ok", 2200);
});
paintSound();

/* ==========================================================================
   Écran de chargement (vague qui monte + progression réelle)
   ========================================================================== */
(function loader() {
  const el = $("#loader"), bar = $("#loader-bar"), pct = $("#loader-pct"), liquid = $(".loader__liquid", el);
  let shown = 0, target = 8;
  const tasks = [];
  const track = (p) => tasks.push(Promise.resolve(p).catch(() => {}).then(() => { target = Math.min(100, target + 92 / total); }));

  const heroImg = $(".hero__bg img");
  const imgReady = new Promise((res) => { if (heroImg.complete) res(); else { heroImg.addEventListener("load", res); heroImg.addEventListener("error", res); } });
  const pageReady = new Promise((res) => (document.readyState === "complete" ? res() : window.addEventListener("load", res)));
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const minTime = new Promise((res) => setTimeout(res, 1200));
  const list = [imgReady, pageReady, fontsReady, minTime];
  const total = list.length;
  list.forEach(track);

  const tick = () => {
    shown += (target - shown) * 0.12 + 0.15;
    if (shown > target) shown = target;
    const v = Math.round(shown);
    bar.style.width = `${v}%`; pct.textContent = v; liquid.style.setProperty("--lv", (v / 100).toFixed(3));
    if (v < 100) requestAnimationFrame(tick); else finish();
  };
  let done = false;
  function finish() {
    if (done) return; done = true;
    setTimeout(() => {
      el.classList.add("is-done");
      document.body.classList.remove("is-loading");
      Sound.whoosh();
      observeReveals();
      setTimeout(() => el.remove(), 1000);
    }, 280);
  }
  Promise.all(tasks).then(() => (target = 100));
  setTimeout(() => (target = 100), 7000); // sécurité réseau lent
  requestAnimationFrame(tick);
})();

/* ==========================================================================
   Toasts
   ========================================================================== */
function toast(title, msg = "", type = "ok", ms = 4200) {
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.style.setProperty("--t", `${ms}ms`);
  el.innerHTML = `<div class="toast__ico">${icon(type === "ok" ? "check" : "alert")}</div><div><b></b><span></span></div>`;
  el.querySelector("b").textContent = title;
  el.querySelector("span").textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 420); }, ms);
}

/* ==========================================================================
   Copie & connexion FiveM
   ========================================================================== */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;left:-9999px";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch { return false; }
  }
}

async function connect() {
  const ok = await copyText(CONFIG.ip);
  Sound.success();
  toast(ok ? "IP copiée — lancement de FiveM…" : "Lancement de FiveM…", `Si rien ne s'ouvre : F8 → connect ${CONFIG.ip}`, "ok", 5200);
  setTimeout(() => {
    const a = document.createElement("a");
    a.href = CONFIG.fivemUrl; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  }, 450);
}

document.addEventListener("click", async (e) => {
  if (e.target.closest("[data-connect]")) { e.preventDefault(); connect(); return; }
  if (e.target.closest("[data-copy-ip]")) {
    e.preventDefault();
    const ok = await copyText(CONFIG.ip);
    if (ok) Sound.success();
    ok ? toast("Adresse copiée !", CONFIG.ip) : toast("Copie impossible", CONFIG.ip, "err");
    return;
  }
  const cp = e.target.closest("[data-copy]");
  if (cp) {
    e.preventDefault();
    const ok = await copyText(cp.dataset.copy);
    if (ok) Sound.success();
    ok ? toast("Commande copiée !", "Collez-la dans la console F8") : toast("Copie impossible", cp.dataset.copy, "err");
  }
});

/* Logo : repli SVG si l'image distante ne charge pas */
const LOGO_FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff2d42"/><stop offset=".6" stop-color="#ff5c6c"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><path d="M8 18l7 28 9-20 8 20 8-20 9 20 7-28" fill="none" stroke="url(#g)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 54c7-5 14-5 22 0s15 5 22 0" fill="none" stroke="#ef3340" stroke-width="3" stroke-linecap="round" opacity=".8"/></svg>`)}`;
$$(".logo-img").forEach((img) => {
  const fail = () => { if (img.dataset.fb) return; img.dataset.fb = "1"; img.src = LOGO_FALLBACK; };
  img.addEventListener("error", fail);
  if (img.complete && img.naturalWidth === 0) fail();
});
const heroBg = $(".hero__bg img");
heroBg.addEventListener("error", () => (heroBg.style.display = "none"));

/* ==========================================================================
   Topbar & menu mobile
   ========================================================================== */
const topbar = $("#topbar"), nav = $("#nav"), burger = $("#burger");
const onScroll = () => {
  topbar.classList.toggle("is-scrolled", window.scrollY > 20);
  if (currentView === "accueil") heroBg.style.setProperty("--hy", `${Math.min(window.scrollY, innerHeight) * 0.3}px`);
};
window.addEventListener("scroll", onScroll, { passive: true });
burger.addEventListener("click", () => {
  const open = burger.getAttribute("aria-expanded") !== "true";
  burger.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
});
nav.addEventListener("click", (e) => { if (e.target.closest("a")) { burger.setAttribute("aria-expanded", "false"); nav.classList.remove("is-open"); } });

/* ==========================================================================
   Router (#accueil, #reglement, #reglement-<chapitre>, #<section>, #connexion)
   ========================================================================== */
let scene3d = null, currentView = null;
const SEC_INDEX = {};
RULES.forEach((c) => c.sections.forEach((s) => (SEC_INDEX[s.id] = c.id)));

function parseHash() {
  const h = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  if (SEC_INDEX[h]) return { view: "reglement", chap: SEC_INDEX[h], sec: h };
  if (h.startsWith("reglement")) return { view: "reglement", chap: h.split("-").slice(1).join("-") || null };
  return { view: VIEWS.includes(h) ? h : "accueil" };
}

function route() {
  const { view, chap, sec } = parseHash();
  const changed = view !== currentView;
  if (changed) {
    $$(".view").forEach((v) => (v.hidden = v.dataset.view !== view));
    document.body.dataset.view = view;
    $$(".nav__link[data-route]").forEach((a) => a.classList.toggle("is-active", a.dataset.route === view));
    document.title = { accueil: "WaveSide Roleplay — Serveur GTA V RP", reglement: "Règlement — WaveSide Roleplay", candidature: "Candidature Staff — WaveSide Roleplay", equipe: "L'équipe — WaveSide Roleplay", vote: "Voter pour WaveSide — Top-Serveurs", admin: "Administration — WaveSide Roleplay", connexion: "Connexion — WaveSide Roleplay" }[view];
    const rb = $("#route-bar"); rb.classList.remove("is-run"); void rb.offsetWidth; rb.classList.add("is-run");
    if (currentView !== null) Sound.whoosh();
  }
  currentView = view;
  if (view === "reglement") Wiki.open(chap || Wiki.current || RULES[0].id, sec, !changed);
  else if (changed) window.scrollTo({ top: 0, behavior: "instant" });
  if (changed) observeReveals();
  if (view === "equipe") showTeam();
  if (view === "admin") showAdmin();
  scene3d?.setView(view);
}
window.addEventListener("hashchange", route);

/* ==========================================================================
   Wiki du règlement
   ========================================================================== */
const Wiki = (() => {
  const tree = $("#wiki-tree"), article = $("#wiki-article"), crumbs = $("#wiki-crumbs");
  const toc = $("#wiki-toc"), pager = $("#wiki-pager");
  const navToggle = $("#wiki-navtoggle"), navLabel = $("#wiki-navlabel");
  const input = $("#wiki-search"), results = $("#wiki-results");
  let current = null, spy = null, pendingQuery = "";

  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const strip = (html) => { const d = document.createElement("div"); d.innerHTML = html; return d.textContent.replace(/\s+/g, " ").trim(); };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Index de recherche
  const INDEX = RULES.flatMap((c) => c.sections.map((s) => {
    const text = strip(s.html);
    return { chap: c, sec: s, text, n: norm(`${s.title} ${text}`), nt: norm(s.title) };
  }));

  /* --- Arborescence --- */
  tree.innerHTML = RULES.map((c) => `
    <div class="tree__group">
      <a class="tree__chap" href="#reglement-${c.id}" data-chap="${c.id}">
        <span class="tree__ico">${icon(c.icon)}</span><span>${c.title}</span><span class="tree__num">${c.num}</span>
      </a>
      <ul class="tree__subs">${c.sections.map((s) => `<li><a href="#${s.id}" data-sec="${s.id}">${s.title}</a></li>`).join("")}</ul>
    </div>`).join("");

  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") !== "true";
    navToggle.setAttribute("aria-expanded", String(open));
    tree.classList.toggle("is-open", open);
  });
  tree.addEventListener("click", (e) => { if (e.target.closest("a")) { navToggle.setAttribute("aria-expanded", "false"); tree.classList.remove("is-open"); } });

  /* --- Rendu d'un chapitre --- */
  function render(id) {
    const i = RULES.findIndex((r) => r.id === id);
    const c = RULES[i];
    const words = c.sections.reduce((n, s) => n + strip(s.html).split(" ").length, 0);
    crumbs.innerHTML = `<a href="#accueil">${icon("home")}Accueil</a>${icon("chevronRight")}<a href="#reglement">Règlement</a>${icon("chevronRight")}<span>${c.title}</span>`;
    article.innerHTML = `
      <header class="art__head">
        <div class="art__badge">${icon(c.icon)}</div>
        <div>
          <div class="art__kicker">Chapitre ${c.num} / ${String(RULES.length).padStart(2, "0")}</div>
          <h2 class="art__title">${c.title}</h2>
          <p class="art__intro">${c.intro}</p>
          <div class="art__meta">
            <span>${icon("list")}${c.sections.length} sections</span>
            <span>${icon("clock")}${Math.max(1, Math.round(words / 200))} min de lecture</span>
            <span>${icon("shieldCheck")}Règlement officiel</span>
          </div>
        </div>
      </header>
      ${c.sections.map((s) => `
        <section class="wsec" id="${s.id}">
          <h3 class="wsec__h">${s.title}<button class="wsec__anchor" data-anchor="${s.id}" aria-label="Copier le lien de cette section">${icon("link")}</button></h3>
          <div class="wsec__body">${s.html}</div>
        </section>`).join("")}`;

    const prev = RULES[i - 1], next = RULES[i + 1];
    pager.innerHTML =
      (prev ? `<a href="#reglement-${prev.id}"><small>${icon("chevronLeft")}Précédent</small><b>${prev.title}</b></a>` : "") +
      (next ? `<a class="pager__next" href="#reglement-${next.id}"><small>Suivant${icon("chevronRight")}</small><b>${next.title}</b></a>` : "");

    toc.innerHTML = c.sections.map((s) => `<li><a href="#${s.id}" data-sec="${s.id}">${s.title}</a></li>`).join("");
    $$(".tree__chap", tree).forEach((a) => a.classList.toggle("is-active", a.dataset.chap === id));
    navLabel.textContent = `${c.num} · ${c.title}`;

    // Scrollspy
    spy?.disconnect();
    spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        $$("[data-sec]", tree).forEach((a) => a.classList.toggle("is-current", a.dataset.sec === en.target.id));
        $$("a", toc).forEach((a) => a.classList.toggle("is-current", a.dataset.sec === en.target.id));
      });
    }, { rootMargin: "-25% 0px -65% 0px" });
    $$(".wsec", article).forEach((s) => spy.observe(s));
  }

  function open(id, secId, sameView) {
    if (!RULES.some((r) => r.id === id)) id = RULES[0].id;
    const changed = id !== current;
    if (changed) { render(id); current = id; }
    requestAnimationFrame(() => {
      if (secId) {
        const el = document.getElementById(secId);
        if (!el) return;
        if (pendingQuery) { highlight($(".wsec__body", el), pendingQuery); pendingQuery = ""; }
        el.scrollIntoView({ behavior: sameView ? "smooth" : "auto", block: "start" });
        el.classList.remove("is-flash"); void el.offsetWidth; el.classList.add("is-flash");
      } else if (changed || !sameView) {
        const top = sameView ? $(".wiki").getBoundingClientRect().top + scrollY - 90 : 0;
        window.scrollTo({ top: Math.max(0, top), behavior: sameView ? "smooth" : "instant" });
      }
    });
  }

  // Copier le lien d'une section
  article.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-anchor]");
    if (!b) return;
    const url = `${location.href.split("#")[0]}#${b.dataset.anchor}`;
    if (await copyText(url)) { Sound.success(); toast("Lien copié", "Partagez cette section directement"); }
  });

  /* --- Surlignage --- */
  function highlight(root, q) {
    if (!root || !q) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      const txt = n.nodeValue, nt = norm(txt);
      let idx = nt.indexOf(q); if (idx < 0) return;
      const frag = document.createDocumentFragment(); let last = 0;
      while (idx >= 0) {
        frag.append(txt.slice(last, idx));
        const m = document.createElement("mark"); m.textContent = txt.slice(idx, idx + q.length); frag.append(m);
        last = idx + q.length; idx = nt.indexOf(q, last);
      }
      frag.append(txt.slice(last)); n.replaceWith(frag);
    });
  }
  const mark = (txt, q) => {
    const i = norm(txt).indexOf(q);
    if (i < 0) return esc(txt);
    return esc(txt.slice(0, i)) + "<mark>" + esc(txt.slice(i, i + q.length)) + "</mark>" + esc(txt.slice(i + q.length));
  };

  /* --- Recherche instantanée --- */
  let sel = -1, hits = [];
  function search() {
    const q = norm(input.value.trim());
    if (q.length < 2) { results.hidden = true; return; }
    hits = INDEX.filter((x) => x.n.includes(q))
      .sort((a, b) => (b.nt.includes(q) ? 1 : 0) - (a.nt.includes(q) ? 1 : 0))
      .slice(0, 10);
    sel = hits.length ? 0 : -1;
    results.innerHTML = hits.length
      ? hits.map((h, i) => {
          const at = norm(h.text).indexOf(q);
          const from = Math.max(0, at - 40);
          const snip = (from > 0 ? "…" : "") + h.text.slice(from, from + 130);
          return `<button class="sres${i === 0 ? " is-sel" : ""}" data-i="${i}">
            <span class="sres__path">${icon(h.chap.icon)}${esc(h.chap.title)}</span>
            <span class="sres__t">${mark(h.sec.title, q)}</span>
            <span class="sres__s">${at >= 0 ? mark(snip, q) : esc(h.text.slice(0, 120))}</span>
          </button>`;
        }).join("")
      : `<div class="sres__empty">Aucun résultat pour « ${esc(input.value.trim())} »</div>`;
    results.hidden = false;
  }
  function go(i) {
    const h = hits[i]; if (!h) return;
    pendingQuery = norm(input.value.trim());
    results.hidden = true; input.blur();
    if (location.hash === `#${h.sec.id}`) route(); else location.hash = h.sec.id;
  }
  let t;
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(search, 90); });
  input.addEventListener("focus", search);
  input.addEventListener("keydown", (e) => {
    const items = $$(".sres", results);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); if (!items.length) return;
      sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((b, i) => b.classList.toggle("is-sel", i === sel));
      items[sel].scrollIntoView({ block: "nearest" }); Sound.hover();
    } else if (e.key === "Enter") { e.preventDefault(); go(sel); }
    else if (e.key === "Escape") { results.hidden = true; input.blur(); }
  });
  results.addEventListener("click", (e) => { const b = e.target.closest(".sres"); if (b) go(+b.dataset.i); });
  document.addEventListener("click", (e) => { if (!e.target.closest("#wsearch")) results.hidden = true; });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && currentView === "reglement" && document.activeElement !== input && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault(); input.focus();
    }
  });

  return { open, get current() { return current; } };
})();

/* ==========================================================================
   Effet machine à écrire
   ========================================================================== */
(function typer() {
  const el = $("#typer"); if (!el) return;
  const words = ["un officier du LSPD", "un chef de gang", "un urgentiste EMS", "un entrepreneur", "un avocat redouté", "votre propre légende"];
  let w = 0, i = words[0].length, del = true;
  const tick = () => {
    const word = words[w];
    i += del ? -1 : 1;
    el.textContent = word.slice(0, i);
    let d = del ? 35 : 70;
    if (!del && i === word.length) { del = true; d = 1800; }
    else if (del && i === 0) { del = false; w = (w + 1) % words.length; d = 300; }
    setTimeout(tick, d);
  };
  setTimeout(tick, 3200);
})();

/* ==========================================================================
   Révélations au scroll + compteurs
   ========================================================================== */
function animateCount(el) {
  const target = +el.dataset.count, dur = 1600, t0 = performance.now();
  const step = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("is-in");
    $$("[data-count]", en.target).forEach((c) => { if (!c.dataset.done) { c.dataset.done = 1; animateCount(c); } });
    io.unobserve(en.target);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
function observeReveals() {
  if (document.body.classList.contains("is-loading")) return;
  $$(".view:not([hidden]) .reveal:not(.is-in)").forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 6, 5) * 70}ms`;
    io.observe(el);
  });
}

/* ==========================================================================
   Tilt 3D des cartes
   ========================================================================== */
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest("[data-tilt]");
    $$("[data-tilt].is-tilting").forEach((c) => { if (c !== card) resetTilt(c); });
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    card.classList.add("is-tilting");
    card.style.transition = "transform .08s linear, box-shadow .4s, border-color .4s";
    card.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateY(-3px)`;
    card.style.setProperty("--mx", `${px * 100}%`);
    card.style.setProperty("--my", `${py * 100}%`);
  }, { passive: true });
}
function resetTilt(c) {
  c.classList.remove("is-tilting");
  c.style.transition = "transform .6s cubic-bezier(.22,1,.36,1), box-shadow .4s, border-color .4s";
  c.style.transform = "";
}

/* ==========================================================================
   Modale (liens légaux)
   ========================================================================== */
const LEGAL = {
  mentions: ["Mentions légales", "<p>WaveSide Roleplay est un serveur communautaire et non commercial fonctionnant sur la plateforme FiveM.</p><p><em>À compléter par l'équipe : responsable de la publication, contact et hébergeur du site.</em></p><p>Grand Theft Auto V est une marque déposée de Rockstar Games / Take-Two Interactive. WaveSide n'est ni affilié ni approuvé par ces sociétés.</p>"],
  cgu: ["Conditions d'utilisation", "<p>L'accès au serveur implique l'acceptation intégrale du règlement WaveSide. Le staff se réserve le droit de refuser ou de retirer l'accès à tout joueur ne respectant pas ces règles.</p><p>Toute transaction impliquant de l'argent réel en échange d'avantages en jeu est interdite.</p>"],
  privacy: ["Confidentialité", "<p>Ce site ne dépose aucun cookie publicitaire. Seule votre préférence de son est mémorisée dans votre navigateur.</p><p><em>À compléter selon vos outils (analytics, panel, etc.).</em></p>"],
};
const modal = $("#modal");
document.addEventListener("click", (e) => {
  const m = e.target.closest("[data-modal]");
  if (m) { e.preventDefault(); const [t, b] = LEGAL[m.dataset.modal]; $("#modal-title").textContent = t; $("#modal-body").innerHTML = b; modal.hidden = false; return; }
  if (e.target === modal || e.target.closest("[data-close]")) modal.hidden = true;
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.hidden = true; });
$("#year").textContent = new Date().getFullYear();

/* ==========================================================================
   Démarrage
   ========================================================================== */
initCandidature({ toast, Sound, store });
initStatus();
loadMe();
initVote({ store, toast, Sound });
route();
onScroll();

import("./scene3d.js")
  .then(({ initScene }) => { scene3d = initScene($("#fx")); scene3d.setView(currentView); })
  .catch((err) => { console.warn("[WaveSide] Scène 3D indisponible :", err); $("#fx").style.display = "none"; });
