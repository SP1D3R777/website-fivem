# WaveSide Roleplay

Site vitrine + règlement wiki du serveur GTA V RP WaveSide.

Site statique (HTML / CSS / JS + Three.js via CDN), aucune build nécessaire.

## Déploiement Vercel
Importez le dépôt sur vercel.com → Framework Preset : **Other** → Deploy.

## Candidatures Staff → Discord
Le formulaire `#candidature` envoie les réponses à `api/candidature.js` (fonction Vercel).
Discord reçoit **un seul embed** (pseudo, identité RP, âge, origine, aperçu des motivations)
avec un lien vers la **fiche complète** hébergée sur le site : `/fiche?id=…`.

Configuration (Vercel → Projet) :
1. **Settings → Environment Variables** : `DISCORD_WEBHOOK_URL` = URL du webhook Discord.
2. **Storage → Create → Blob** puis *Connect* au projet : ajoute `BLOB_READ_WRITE_TOKEN`
   automatiquement (stockage des fiches).
3. *(facultatif)* `SITE_URL` = `https://www.waveside.fr` pour forcer le domaine des liens.
4. **Redeploy**.

Sans Blob configuré, l'embed est envoyé avec un fichier `.txt` des réponses à la place du lien.
Ne jamais écrire l'URL du webhook dans le code : le dépôt est public.
