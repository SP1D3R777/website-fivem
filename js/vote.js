/* ==========================================================================
   WAVESIDE — Page Vote (Top-Serveurs)
   Au clic sur « Voter », l'heure est mémorisée dans ce navigateur et un
   minuteur indique quand le prochain vote sera possible.
   ========================================================================== */
const COOLDOWN_H = 2;          // délai entre deux votes sur Top-Serveurs (heures) : modifiable ici
const KEY = "ws-last-vote";
const CIRC = 2 * Math.PI * 52; // circonférence de l'anneau (r = 52)

export function initVote({ store, toast, Sound }) {
  const btn = document.getElementById("vote-btn");
  if (!btn) return;
  const ring = document.getElementById("vote-ring"), arc = document.getElementById("vote-arc");
  const time = document.getElementById("vote-time"), sub = document.getElementById("vote-sub");
  const title = document.getElementById("vote-title"), text = document.getElementById("vote-text");
  const reset = document.getElementById("vote-reset");
  const total = COOLDOWN_H * 3600e3;
  arc.style.strokeDasharray = CIRC;

  const last = () => +store.get(KEY) || 0;

  function paint() {
    const left = Math.max(0, last() + total - Date.now());
    const ready = left === 0;
    ring.classList.toggle("is-ready", ready);
    btn.classList.toggle("is-wait", !ready);
    reset.hidden = ready;
    arc.style.strokeDashoffset = ready ? 0 : CIRC * (left / total);
    if (ready) {
      time.textContent = "Prêt"; sub.textContent = "à voter";
      title.textContent = "Votre vote est disponible";
      text.textContent = "Cliquez sur le bouton : la page Top-Serveurs s'ouvre dans un nouvel onglet.";
      btn.lastChild.textContent = "Voter sur Top-Serveurs";
    } else {
      const h = Math.floor(left / 3600e3), m = Math.floor((left % 3600e3) / 60e3), s = Math.floor((left % 60e3) / 1e3);
      time.textContent = h ? `${h} h ${String(m).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
      sub.textContent = "avant le prochain vote";
      title.textContent = "Merci pour votre vote !";
      text.textContent = `Prochain vote possible à ${new Date(last() + total).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`;
      btn.lastChild.textContent = "Ouvrir quand même Top-Serveurs";
    }
  }

  btn.addEventListener("click", () => {
    if (Date.now() - last() >= total) {
      store.set(KEY, String(Date.now()));
      Sound?.success();
      toast?.("Merci de soutenir WaveSide !", "Validez votre vote sur la page Top-Serveurs.", "ok", 5000);
    }
    setTimeout(paint, 50);
  });
  reset.addEventListener("click", () => { store.set(KEY, "0"); paint(); });

  paint();
  setInterval(() => { if (!document.hidden) paint(); }, 1000);
}
