/* ==========================================================================
   WAVESIDE — Session Discord (une seule requête partagée par toute la page)
   /api/auth/me renvoie toujours 200 :
     { authenticated: false }                       → visiteur non connecté
     { authenticated: true, user, formToken, staff } → connecté
     { configured: false }                          → connexion Discord non configurée
   ========================================================================== */
let pending = null;

export function getMe(force = false) {
  if (!pending || force) {
    pending = fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json())
      .catch(() => ({ error: true }));
  }
  return pending;
}
