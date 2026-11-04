/* ==========================================================================
   WAVESIDE — Formulaire de candidature Staff
   Étapes, validation en direct, brouillon auto, envoi vers /api/candidature
   (fonction Vercel qui relaie au webhook Discord : l'URL du webhook
   n'est jamais exposée dans le navigateur).
   ========================================================================== */

const ENDPOINT = "/api/candidature";
const DRAFT_KEY = "ws-candidature-draft";

const RULES = {
  identite: { min: 3, label: "Indiquez votre ID unique et votre nom RP." },
  age: { age: true, label: "Indiquez un âge valide." },
  source: { radio: true, label: "Choisissez une option." },
  qualites: { min: 15, label: "Listez au moins 3 qualités." },
  defauts: { min: 15, label: "Listez au moins 3 défauts." },
  presentation: { min: 80, label: "Présentez-vous un peu plus (80 caractères min.)." },
  motivations: { min: 350, label: "7 lignes minimum (350 caractères)." },
  pourquoi_waveside: { min: 60, label: "Développez un peu plus (60 caractères min.)." },
  pourquoi_vous: { min: 60, label: "Développez un peu plus (60 caractères min.)." },
  infos: { min: 0 },
};
const STEPS = [["identite", "age", "source"], ["qualites", "defauts", "presentation"], ["motivations", "pourquoi_waveside", "pourquoi_vous", "infos"]];

export function initCandidature({ toast, Sound, store }) {
  const form = document.getElementById("apply-form");
  if (!form) return;
  const steps = [...form.querySelectorAll(".apply__step")];
  const dots = [...document.querySelectorAll("#stepper li")];
  const prev = document.getElementById("apply-prev");
  const next = document.getElementById("apply-next");
  const submit = document.getElementById("apply-submit");
  const info = document.getElementById("apply-stepinfo");
  const bar = document.getElementById("apply-bar");
  const done = document.getElementById("apply-done");
  const gate = document.getElementById("apply-gate");
  const checking = document.getElementById("apply-checking");
  let step = 0, me = null;

  /* --- Connexion Discord obligatoire --- */
  const AUTH_ERRORS = {
    denied: "Connexion annulée. Autorisez l'accès à votre compte pour postuler.",
    state: "La connexion a expiré, réessayez.",
    token: "Discord n'a pas pu valider la connexion, réessayez.",
    config: "La connexion Discord n'est pas encore configurée sur le serveur.",
  };
  const authErr = new URLSearchParams(location.search).get("auth");
  if (authErr) {
    const g = document.getElementById("gate-err");
    g.textContent = AUTH_ERRORS[authErr] || AUTH_ERRORS.token; g.hidden = false;
    history.replaceState(null, "", location.pathname + location.hash);
  }
  async function loadSession() {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
      if (r.status === 503) throw Object.assign(new Error("config"), { code: "config" });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      const g = document.getElementById("gate-err");
      g.textContent = e.code === "config" ? AUTH_ERRORS.config : "Service de connexion indisponible pour le moment.";
      g.hidden = false;
      return null;
    }
  }

  const fieldEl = (name) => form.querySelector(`[data-field="${name}"]`);
  const value = (name) => {
    if (RULES[name]?.radio) return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
    return (form.elements[name]?.value || "").trim();
  };

  /* --- Validation --- */
  function check(name, show = true) {
    const r = RULES[name], v = value(name), f = fieldEl(name);
    let ok = true;
    if (r.radio) ok = !!v;
    else if (r.age) ok = /^\d+$/.test(v) && +v >= 13 && +v <= 99;
    else ok = v.length >= r.min;
    if (f && show) {
      f.classList.toggle("is-invalid", !ok);
      f.classList.toggle("is-valid", ok && v.length > 0 && !r.radio);
      f.querySelector(".field__err").textContent = ok ? "" : r.label;
    }
    return ok;
  }

  function counter(el) {
    const f = el.closest(".field"), c = f?.querySelector(".field__count");
    if (!c) return;
    const min = +el.dataset.min || 0, len = el.value.trim().length;
    c.textContent = min && len < min ? `${len} / ${min} min.` : `${len} / ${el.maxLength}`;
    c.classList.toggle("is-ok", min > 0 && len >= min);
  }

  /* --- Brouillon (un par compte) --- */
  const draftKey = () => `${DRAFT_KEY}-${me?.user?.id || "anon"}`;
  const saveDraft = () => {
    const data = {};
    Object.keys(RULES).forEach((k) => (data[k] = value(k)));
    store.set(draftKey(), JSON.stringify(data));
  };
  const restoreDraft = () => { try {
    const d = JSON.parse(store.get(draftKey()) || "null");
    if (d) Object.entries(d).forEach(([k, v]) => {
      if (!v) return;
      if (RULES[k]?.radio) { const r = form.querySelector(`input[name="${k}"][value="${v}"]`); if (r) r.checked = true; }
      else if (form.elements[k]) form.elements[k].value = v;
    });
  } catch {}
  form.querySelectorAll("input[data-min], textarea").forEach(counter); };

  let saveT;
  form.addEventListener("input", (e) => {
    const el = e.target;
    if (el.matches("[data-min]")) counter(el);
    const f = el.closest("[data-field]");
    if (f && f.classList.contains("is-invalid")) check(f.dataset.field);
    clearTimeout(saveT); saveT = setTimeout(saveDraft, 400);
  });
  form.addEventListener("change", (e) => { if (e.target.name === "source") { check("source"); Sound.click(); } });
  form.addEventListener("focusout", (e) => {
    const f = e.target.closest("[data-field]");
    if (f && value(f.dataset.field)) check(f.dataset.field);
  });

  /* --- Navigation entre étapes --- */
  function show(i, back = false) {
    step = i;
    steps.forEach((s, k) => { s.classList.toggle("is-active", k === i); s.classList.toggle("is-back", k === i && back); });
    dots.forEach((d, k) => { d.classList.toggle("is-active", k === i); d.classList.toggle("is-done", k < i); });
    prev.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    submit.hidden = i !== steps.length - 1;
    info.textContent = `Étape ${i + 1} / ${steps.length}`;
    bar.style.width = `${((i + 1) / steps.length) * 100}%`;
    const top = form.getBoundingClientRect().top + window.scrollY - 100;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  }
  function validateStep(i) {
    const bad = STEPS[i].filter((n) => !check(n));
    if (bad.length) {
      const el = fieldEl(bad[0]);
      el?.querySelector("input, textarea")?.focus({ preventScroll: true });
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }
  next.addEventListener("click", () => { if (validateStep(step)) show(step + 1); });
  prev.addEventListener("click", () => show(step - 1, true));
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName === "INPUT" && step < steps.length - 1) { e.preventDefault(); next.click(); }
  });

  /* --- Envoi --- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    const consent = document.getElementById("f-consent");
    const cerr = document.getElementById("consent-err");
    if (!consent.checked) { cerr.textContent = "Merci de cocher cette case."; return; }
    cerr.textContent = "";

    const payload = { website: form.elements.website.value, formToken: me?.formToken };
    Object.keys(RULES).forEach((k) => (payload[k] = value(k)));

    submit.classList.add("is-busy");
    submit.querySelector(".btn__lbl").textContent = "Envoi en cours…";
    try {
      const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { form.hidden = true; gate.hidden = false; throw new Error(data.error); }
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      store.set(draftKey(), "");
      Sound.success();
      document.getElementById("done-name").textContent = me.user.name;
      form.hidden = true; done.hidden = false;
      dots.forEach((d) => { d.classList.remove("is-active"); d.classList.add("is-done"); });
      done.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      toast("Envoi impossible", err.message === "Failed to fetch" ? "Connexion au serveur impossible, réessayez." : err.message, "err", 6000);
    } finally {
      submit.classList.remove("is-busy");
      submit.querySelector(".btn__lbl").textContent = "Envoyer ma candidature";
    }
  });

  show(0);

  loadSession().then((s) => {
    checking.hidden = true;
    if (!s) { gate.hidden = false; return; }
    me = s;
    document.getElementById("acc-avatar").src = s.user.avatar;
    document.getElementById("acc-name").textContent = s.user.name;
    document.getElementById("acc-user").textContent = `@${s.user.username}`;
    restoreDraft();
    form.hidden = false;
  });
}
