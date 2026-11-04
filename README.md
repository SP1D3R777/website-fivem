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

### Boutons Accepter / Refuser (bot Discord)
Le bot poste chaque candidature avec 3 boutons : **Accepter**, **Refuser** (fenêtre pour
écrire un retour) et **Ouvrir la fiche**. Le candidat reçoit un message privé en embed :
accepté → invitation à ouvrir un ticket ; refusé → retour du staff + possibilité de repostuler.
Le message du salon passe en vert / gris avec le nom du staff et la date.

### Configuration Vercel (Settings → Environment Variables)
| Variable | Valeur |
|---|---|
| `DISCORD_CLIENT_ID` | ID de l'application Discord |
| `DISCORD_CLIENT_SECRET` | Secret OAuth2 de l'application |
| `DISCORD_BOT_TOKEN` | Onglet **Bot** → *Reset Token* |
| `DISCORD_PUBLIC_KEY` | **General Information** → *Public Key* |
| `DISCORD_CHANNEL_ID` | ID du salon des candidatures (clic droit → Copier l'identifiant) |
| `DISCORD_STAFF_ROLE_ID` | *(facultatif)* rôle(s) autorisé(s) à décider, séparés par `,` |
| `DISCORD_TICKET_URL` | *(facultatif)* lien du salon ticket (sinon l'invitation Discord) |
| `SITE_URL` | `https://www.waveside.fr` |
| `DISCORD_WEBHOOK_URL` | *(repli)* utilisé seulement si le bot n'est pas configuré |
| `BLOB_READ_WRITE_TOKEN` | *(facultatif)* via **Storage → Blob → Connect**, pour la limite de 24 h |

Portail Discord (https://discord.com/developers/applications) :
- **OAuth2 → Redirects** : `https://www.waveside.fr/api/auth/callback`
- **General Information → Interactions Endpoint URL** : `https://www.waveside.fr/api/interactions`
- Inviter le bot : **OAuth2 → URL Generator** → scope `bot`, permissions *Voir les salons,
  Envoyer des messages, Intégrer des liens, Joindre des fichiers, Voir l'historique*.

Ne jamais écrire de secret dans le code : le dépôt est public.
