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

### Décision depuis la fiche (sans héberger de bot)
Sur `/fiche?id=…`, un membre du staff connecté avec Discord voit les boutons
**Accepter / Refuser** (avec message au candidat). Le message Discord est mis à jour
(couleur + décision) et, si `DISCORD_BOT_TOKEN` est défini, le candidat reçoit un MP.
Le staff est reconnu via `DISCORD_STAFF_IDS` (IDs Discord séparés par `,`) ou via
`DISCORD_GUILD_ID` + `DISCORD_STAFF_ROLE_ID` (nécessite le bot sur le serveur).
Le bot n'a **jamais** besoin d'être hébergé : le site utilise son jeton à la demande.

### Configuration Vercel (Settings → Environment Variables)
| Variable | Valeur |
|---|---|
| `DISCORD_CLIENT_ID` | ID de l'application Discord |
| `DISCORD_CLIENT_SECRET` | Secret OAuth2 de l'application |
| `DISCORD_BOT_TOKEN` | Onglet **Bot** → *Reset Token* |
| `DISCORD_PUBLIC_KEY` | **General Information** → *Public Key* |
| `DISCORD_CHANNEL_ID` | ID du salon des candidatures (clic droit → Copier l'identifiant) |
| `DISCORD_STAFF_IDS` | IDs Discord des membres du staff autorisés à décider, séparés par `,` |
| `DISCORD_GUILD_ID` | *(facultatif)* ID du serveur Discord (avec le rôle staff ci-dessous) |
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

## Statut en direct, Équipe, Administration, Boutique

### Statut du serveur (accueil, barre d'infos, page Connexion)
`/api/status` lit le serveur FiveM (cache 15 s). Variable : `FIVEM_ENDPOINT = http://IP:30120`.
Avec la ressource `waveside_status` ≥ 1.2 : joueurs, file d'attente, en ligne depuis, pic du jour.
Sans elle : joueurs uniquement (`dynamic.json`).

### Page Équipe (`#equipe`)
`/api/team` lit les membres et rôles du Discord (cache 5 min).
- `DISCORD_GUILD_ID` : ID du serveur Discord
- `DISCORD_TEAM_ROLES` : IDs des rôles à afficher, **du plus haut au plus bas**, séparés par `,`
- Portail Discord → Bot → activer **Server Members Intent**.

### Panneau d'administration (`#admin`)
Réservé au staff (`DISCORD_STAFF_IDS` ou rôle staff). Lit l'historique du salon des
candidatures via le bot : statistiques, graphique 30 jours, origines, filtres (statut, période,
type, recherche), export CSV, accès direct aux fiches et aux messages Discord.
Nécessite `DISCORD_BOT_TOKEN` + `DISCORD_CHANNEL_ID` (+ `DISCORD_GUILD_ID` pour les liens).

### Boutique
Le lien « Boutique » (barre + pied de page) pointe vers `https://boutique.waveside.fr` :
modifiez les attributs `href` portant `data-shop` dans `index.html` si l'adresse diffère.
