# WaveSide Roleplay

Site vitrine + règlement wiki du serveur GTA V RP WaveSide.

Site statique (HTML / CSS / JS + Three.js via CDN), aucune build nécessaire.

## Déploiement Vercel
Importez le dépôt sur vercel.com → Framework Preset : **Other** → Deploy.

## Candidatures Staff → Discord
Le formulaire `#candidature` envoie les réponses à la fonction Vercel `api/candidature.js`,
qui les relaie dans un salon Discord via un webhook.

Configuration (une seule fois) : Vercel → Projet → **Settings → Environment Variables**
- Nom : `DISCORD_WEBHOOK_URL`
- Valeur : l'URL du webhook Discord
- Environnements : Production (+ Preview si besoin), puis **Redeploy**.

Ne jamais écrire l'URL du webhook dans le code : le dépôt est public.
