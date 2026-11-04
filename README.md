# WaveSide Roleplay

Site vitrine + règlement wiki du serveur GTA V RP WaveSide.

Site statique (HTML / CSS / JS + Three.js via CDN), aucune build nécessaire.

## Déploiement Vercel
Importez le dépôt sur vercel.com → Framework Preset : **Other** → Deploy.

## Candidatures Staff → Discord
Le formulaire `#candidature` exige une **connexion Discord** (pseudo + avatar récupérés
automatiquement). Les réponses partent vers `api/candidature.js`, puis Discord reçoit
**un seul embed** avec un lien signé vers la fiche complète `/fiche?id=…`.
Les réponses sont stockées dans le message Discord lui-même (pièce jointe `.dat`) :
aucune base de données n'est nécessaire. Supprimer le message supprime la fiche.

### Sécurité
- Connexion Discord obligatoire (session signée, cookie HttpOnly, 7 jours).
- Requêtes acceptées uniquement depuis le site (contrôle d'origine).
- Formulaire refusé s'il est envoyé moins de 30 s après son ouverture.
- 1 candidature / 24 h par compte Discord (si Blob est connecté) + limite par IP.
- Champ piège anti-robots, mentions `@everyone` neutralisées, webhook jamais exposé.

### Configuration Vercel (Settings → Environment Variables)
| Variable | Valeur |
|---|---|
| `DISCORD_WEBHOOK_URL` | URL du webhook du salon |
| `DISCORD_CLIENT_ID` | ID de l'application Discord (OAuth2) |
| `DISCORD_CLIENT_SECRET` | Secret de l'application Discord |
| `SITE_URL` | `https://www.waveside.fr` |
| `BLOB_READ_WRITE_TOKEN` | *(facultatif)* via **Storage → Blob → Connect**, pour la limite de 24 h |

Application Discord : https://discord.com/developers/applications → *New Application* →
**OAuth2** → *Redirects* : `https://www.waveside.fr/api/auth/callback`.

Ne jamais écrire de secret dans le code : le dépôt est public.
