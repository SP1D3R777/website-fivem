/* ==========================================================================
   WAVESIDE ROLEPLAY — Données du règlement
   Source : GitBook règlement (Notions de base, Légal, Illégal, Sanctions),
   réorganisé en 6 chapitres. Chaque chapitre = { id, num, icon, title,
   intro, sections: [{ id, title, html }] }.
   Pour modifier une règle : éditez simplement le HTML de la section.
   ========================================================================== */

import { icon } from "./icons.js";

const L = (items) => `<ol class="rl">${items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
const U = (items) => `<ul class="rl rl--dot">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const HINT = (type, txt) => `<div class="hint hint--${type}"><span class="hint__ico">${icon(type === "danger" ? "ban" : type === "warning" ? "alert" : "info")}</span><div><strong class="hint__t">${type === "danger" ? "Important" : type === "warning" ? "Attention" : "À savoir"}</strong><p>${txt}</p></div></div>`;
const DEF = (term, tag, txt) => `<div class="def"><div class="def__head"><span class="def__term">${term}</span>${tag ? `<span class="def__tag">${tag}</span>` : ""}</div><div class="def__body">${txt}</div></div>`;

export const RULES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: "lexique",
    num: "01",
    icon: "book",
    title: "Lexique & Règles générales",
    intro: "Les termes et règles indispensables à connaître avant de commencer votre aventure sur WaveSide. La méconnaissance du règlement ne constitue pas une excuse en cas de manquement.",
    sections: [
      {
        id: "lex-base",
        title: "Les fondamentaux",
        html: `
          ${DEF("RP / HRP", "Base", "<p><strong>RP (Roleplay)</strong> : tout ce qui appartient à l'univers de votre personnage et aux événements vécus en jeu.</p><p><strong>HRP (Hors Roleplay)</strong> : tout ce qui concerne le joueur, le jeu, Discord, un stream, un ticket staff ou une information extérieure à votre personnage. Une information obtenue HRP ne devient pas automatiquement une information connue par votre personnage.</p>")}
          ${DEF("Fair-play", "Esprit WaveSide", "<p>Rechercher une scène intéressante pour <strong>toutes les parties</strong>, y compris lorsque votre personnage perd. Laisser une porte de sortie, accepter les conséquences et éviter les comportements purement compétitifs font partie des attentes fondamentales.</p>")}
          ${DEF("Mass RP", null, "<p>La ville est considérée comme peuplée, même lorsque peu de joueurs sont visibles. Les lieux publics, commissariats, hôpitaux, quartiers résidentiels et axes majeurs ne sont jamais considérés comme totalement vides.</p>")}
        `,
      },
      {
        id: "lex-interdits",
        title: "Comportements interdits",
        html: `
          ${DEF("MetaGaming", "Interdit", "<p>Utiliser en RP une information obtenue hors jeu.</p>" + U(["reconnaître une personne grâce à son pseudo Discord ;", "utiliser un live pour localiser un joueur ;", "transmettre par Discord une position que votre personnage n'a pas pu communiquer ;", "rejoindre une scène parce qu'un ami vous a prévenu HRP."]))}
          ${DEF("Streamsniping", "Strictement interdit", "<p>Regarder ou exploiter le stream d'un joueur afin d'obtenir un avantage, une position ou une information RP.</p>")}
          ${DEF("PowerGaming", "Interdit", "<p>Effectuer une action irréaliste, physiquement incohérente ou rendue possible uniquement par les limites du jeu. Ex. : continuer comme si de rien n'était après un accident violent, traverser un obstacle via une animation, profiter d'un comportement physique anormal du jeu.</p>")}
          ${DEF("Force RP", "Interdit", "<p>Imposer un résultat à un autre joueur sans lui laisser de possibilité raisonnable de réaction (déclarer un joueur attaché sans le moyen prévu, imposer une blessure définitive, forcer une humiliation extrême…).</p>")}
          ${DEF("Win RP", "Interdit", "<p>Rechercher la victoire à tout prix au détriment du réalisme, du fair-play ou de l'intérêt de la scène.</p>")}
          ${DEF("Revenge RP", "Interdit", "<p>Revenir immédiatement se venger après avoir été neutralisé ou après une scène dont votre personnage ne devrait plus posséder tous les souvenirs.</p>")}
          ${DEF("Freekill / Freepunch", "Interdit", "<p><strong>Freekill</strong> : tuer ou neutraliser un joueur sans justification RP suffisante. <strong>Freepunch</strong> : frapper un joueur sans contexte ou raison RP construite.</p>")}
          ${DEF("Carkill", "Interdit", "<p>Utiliser volontairement un véhicule pour renverser ou tuer un joueur sans justification RP cohérente.</p>")}
          ${DEF("Combat logging", "Interdit", "<p>Se déconnecter pour échapper à une scène, une arrestation, une fouille, une poursuite, une dette ou une conséquence RP. En cas de crash réel, reconnectez-vous dès que possible.</p>")}
          ${DEF("Cop bait", "Interdit", "<p>Provoquer artificiellement les forces de l'ordre dans le seul but de déclencher une course-poursuite, un échange de tirs ou une intervention.</p>")}
          ${DEF("Bunny hop & Off-road abusif", "Interdit", "<p>Enchaîner des sauts pour gagner de la vitesse ou éviter des tirs est interdit. Un véhicule doit être utilisé selon ses capacités : une supersportive ne gravit pas une montagne.</p>")}
          ${DEF("Use bug / Exploit", "Strictement interdit", "<p>Exploiter volontairement un bug, une duplication, une désynchronisation ou une faiblesse technique. Tout bug important doit être signalé au staff.</p>")}
        `,
      },
      {
        id: "lex-ressenti",
        title: "Fear RP & NoPain RP",
        html: `
          ${DEF("Fear RP / No Fear", "Obligatoire", "<p>Votre personnage tient à sa vie, à son intégrité physique, à sa liberté et aux conséquences de ses actes. Une menace crédible doit provoquer une réaction cohérente. Un joueur braqué à bout portant, sans possibilité raisonnable de se défendre, ne peut pas agir comme si le danger n'existait pas.</p>")}
          ${DEF("Pain RP / NoPain RP", "Obligatoire", "<p>Les blessures doivent être jouées proportionnellement à leur gravité. Une chute, une collision, une balle ou un passage à tabac doit influencer le comportement du personnage. Ignorer ses blessures constitue du <strong>NoPain RP</strong>.</p>")}
        `,
      },
      {
        id: "gen-respect",
        title: "Respect & comportement",
        html: L([
          "Le respect entre joueurs est obligatoire, y compris après une scène tendue.",
          "Les insultes peuvent exister dans un contexte RP cohérent, mais le harcèlement, les attaques personnelles HRP, les propos discriminatoires ou les menaces réelles sont interdits.",
          "Un conflit RP doit rester RP. Utilisez les outils de support pour régler un problème de règlement.",
          "Il est interdit d'interrompre volontairement une scène par des débats HRP du type « admin », « ticket », « report » ou « règlement ».",
          "Les décisions du staff se discutent dans l'espace prévu à cet effet, jamais en pleine scène.",
        ]),
      },
      {
        id: "gen-comm",
        title: "Communication",
        html: L([
          "Le vocal en jeu est le moyen normal de communication RP.",
          "Discord, messages privés, streams ou appels externes ne doivent pas servir à transmettre des informations RP en direct.",
          "Un modificateur de voix peut être utilisé pour incarner un personnage ou masquer une identité lorsqu'il reste compréhensible et ne sert pas à troll.",
          "Reconnaître quelqu'un uniquement à sa voix lorsqu'il est masqué doit rester raisonnable et fondé sur un historique RP solide.",
        ]),
      },
      {
        id: "gen-scenes",
        title: "Scènes RP",
        html: L([
          "Privilégiez l'interaction avant la violence lorsque le contexte le permet.",
          "Toute escalade doit être proportionnée. Une simple provocation verbale ne justifie pas automatiquement une fusillade.",
          "Laissez aux autres joueurs un temps raisonnable pour comprendre et répondre à vos demandes.",
          "Les scènes humiliantes, sexuelles, dégradantes ou susceptibles de mettre un joueur mal à l'aise exigent un consentement clair hors scène lorsqu'elles dépassent le cadre RP habituel.",
          "Les scènes de torture lourde ou de mutilation définitive nécessitent une validation administrative préalable.",
        ]),
      },
      {
        id: "gen-reboot",
        title: "Déconnexion, crash & reboot",
        html:
          L([
            "Il est interdit de se déconnecter pour éviter une conséquence RP.",
            "Après un crash, le joueur doit revenir dès que raisonnablement possible.",
            "Aucune action majeure ne doit être lancée dans les <strong>30 minutes précédant un reboot annoncé</strong>, sauf événement encadré ou accord du staff.",
            "Après un reboot, une scène en cours reprend si les participants peuvent raisonnablement se retrouver.",
          ]),
      },
      {
        id: "gen-vehicules",
        title: "Véhicules",
        html: L([
          "La conduite doit rester cohérente avec le véhicule et la situation.",
          "Les collisions volontaires répétées pour immobiliser un véhicule sont interdites hors cadre prévu par les règles de poursuite.",
          "Un véhicule gravement accidenté doit être joué comme endommagé.",
          "Le vol de véhicule doit produire du RP et ne doit pas devenir une activité de nuisance répétitive.",
          "Il est interdit d'utiliser un véhicule ou son inventaire à travers un mur, une porte fermée ou une distance incohérente.",
        ]),
      },
      {
        id: "gen-biens",
        title: "Inventaires, preuves & contournement",
        html:
          L([
            "Un joueur ne peut prendre que ce que son personnage est réellement capable d'emporter.",
            "Les transferts massifs de biens avant une sanction, un wipe ou une perquisition annoncée sont interdits.",
            "Les bugs d'inventaire, duplications et exploitations économiques doivent être signalés immédiatement. Les biens obtenus via un bug peuvent être retirés sans compensation.",
            "Il est recommandé d'enregistrer les scènes importantes. Une preuve doit montrer le contexte avant et après l'incident ; une vidéo coupée pour masquer son propre comportement peut être rejetée.",
            "Une preuve HRP ne devient pas automatiquement une preuve RP utilisable par votre personnage.",
          ]) +
          HINT("warning", "Toute action visant à contourner une règle par une interprétation littérale est sanctionnable. Le staff peut intervenir lorsqu'un comportement respecte la lettre d'une règle mais en viole manifestement l'esprit."),
      },
    ],
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: "personnage",
    num: "02",
    icon: "user",
    title: "Personnage & Gestion",
    intro: "Votre personnage est le cœur de votre expérience. Identité, multi-personnages, mort RP et remises à zéro sont strictement encadrés.",
    sections: [
      {
        id: "perso-coherence",
        title: "Identité & cohérence",
        html: L([
          "Votre personnage doit disposer d'une identité crédible et d'un comportement cohérent avec son histoire.",
          "Les noms volontairement troll, insultants ou copiés sur des célébrités de manière caricaturale peuvent être refusés.",
          "Un personnage ne peut pas changer brutalement de personnalité, de voix, d'accent ou d'allégeance uniquement pour éviter des conséquences.",
        ]),
      },
      {
        id: "perso-double",
        title: "Double compte & multi-personnages",
        html:
          L([
            "Vos personnages ne se connaissent pas automatiquement et ne partagent pas leurs souvenirs.",
            "Le transfert d'informations ou de biens entre vos propres personnages afin de contourner une progression est interdit.",
            "Contourner une sanction avec un autre compte, ou faire utiliser son compte par une autre personne, peut aggraver la sanction initiale.",
          ]) + HINT("danger", "Un double compte utilisé pour échapper à un bannissement, cumuler des avantages ou espionner un groupe est traité comme une infraction lourde."),
      },
      {
        id: "perso-pk",
        title: "PK — Player Kill (New Life Rule)",
        html:
          `<p class="lead">Le PK correspond à la neutralisation de votre personnage suivie d'une réapparition ou d'une prise en charge avec perte de mémoire de la scène. Le personnage continue d'exister.</p>` +
          L([
            "Après un PK, votre personnage ne peut pas retourner immédiatement sur les lieux pour reprendre le conflit.",
            "Il ne peut exploiter que les informations qu'il est légitime de conserver selon l'issue de la scène.",
            "Revenir sur une scène après avoir été neutralisé est interdit (voir Revenge RP).",
          ]),
      },
      {
        id: "perso-ck",
        title: "CK — Character Kill (Mort RP)",
        html:
          `<p class="lead">Le CK, ou Mort RP, met <strong>définitivement fin</strong> au personnage concerné.</p>` +
          L([
            "Une Mort RP ne peut pas être improvisée pour contourner une situation et doit respecter la procédure en vigueur sur WaveSide.",
            "Une Mort RP ou une mutilation permanente ne peut être imposée sans respecter cette procédure.",
            "Un groupe ne peut pas imposer automatiquement une Mort RP à tout membre souhaitant le quitter.",
            "Une exécution ne doit jamais remplacer une résolution de conflit plus intéressante.",
          ]),
      },
      {
        id: "perso-wipe",
        title: "WIPE",
        html:
          `<p class="lead">Le wipe correspond à une remise à zéro importante ou totale de l'histoire et/ou des biens d'un personnage.</p>` +
          L([
            "Il peut être volontaire, lié à un changement majeur de projet ou décidé dans un cadre administratif spécifique.",
            "Les transferts massifs de biens avant un wipe annoncé, afin de soustraire artificiellement des possessions, sont interdits.",
          ]),
      },
    ],
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: "safezones",
    num: "03",
    icon: "shield",
    title: "Zones sécurisées",
    intro: "Certains lieux de Los Santos sont fortement protégés afin de garantir l'accueil, les soins et le fonctionnement des institutions.",
    sections: [
      {
        id: "safe-liste",
        title: "Liste des zones protégées",
        html:
          `<p class="lead">Sauf événement validé ou situation déjà engagée avant l'entrée dans la zone, les lieux suivants sont considérés comme fortement protégés :</p>
          <div class="zones">
            <div class="zone"><span class="zone__ico">${icon("heart")}</span><strong>Hôpitaux</strong><em>et zones de soins</em></div>
            <div class="zone"><span class="zone__ico">${icon("shieldCheck")}</span><strong>Commissariats</strong><em>et bâtiments des services publics</em></div>
            <div class="zone"><span class="zone__ico">${icon("pin")}</span><strong>Spawns</strong><em>zones d'accueil des nouveaux joueurs</em></div>
            <div class="zone"><span class="zone__ico">${icon("landmark")}</span><strong>Lieux administratifs</strong><em>explicitement signalés</em></div>
          </div>`,
      },
      {
        id: "safe-interdits",
        title: "Interdictions",
        html:
          L([
            "Toute agression, braquage, enlèvement ou ouverture du feu y est interdit en dehors d'un scénario validé.",
            "Il est interdit d'utiliser une zone protégée comme refuge opportuniste pour échapper à une scène déjà engagée.",
            "Les commissariats, hôpitaux et bâtiments institutionnels ne sont pas des cibles ordinaires et nécessitent un scénario adapté.",
            "Les nouveaux joueurs ne doivent pas être utilisés comme cibles faciles de manière répétée, en particulier à proximité des spawns.",
          ]) + HINT("info", "Le Mass RP s'applique pleinement : ces lieux sont toujours fréquentés, même si personne n'est visible à l'écran."),
      },
    ],
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: "illegal",
    num: "04",
    icon: "crosshair",
    title: "Monde illégal & Organisations",
    intro: "Une activité illégale doit toujours avoir une logique RP. L'objectif n'est pas de multiplier les scènes de violence mais de construire des interactions crédibles.",
    sections: [
      {
        id: "ill-construction",
        title: "Construction des actions",
        html: L([
          "Une action illégale doit avoir un objectif RP identifiable.",
          "La violence gratuite, les enlèvements aléatoires répétés et les braquages uniquement destinés à dépouiller des joueurs sont interdits.",
          "La négociation et l'interaction doivent être favorisées lorsqu'elles sont raisonnablement possibles.",
          "Aucune opération planifiée importante ne doit commencer dans les <strong>30 minutes précédant un reboot</strong>.",
        ]),
      },
      {
        id: "ill-vol",
        title: "Vol, racket & enlèvements",
        html:
          L([
            "Il est interdit de forcer un joueur à retirer de l'argent à une banque ou un distributeur, ou à transférer un bien enregistré (maison, entreprise, véhicule).",
            "Sauf guerre validée, au maximum <strong>50 % de l'argent liquide et des consommables transportés</strong> peuvent être pris.",
            "Papiers d'identité, téléphones et objets indispensables au gameplay ne doivent pas être volés dans le seul but de bloquer un joueur.",
            "Les coffres de propriétés ou véhicules ne peuvent pas être vidés intégralement après avoir forcé un joueur à les ouvrir.",
            "Un enlèvement doit avoir une raison RP ; le captif doit conserver une possibilité de jeu et ne pas rester immobilisé sans interaction.",
            "Les rançons doivent rester réalistes. Il est interdit d'obliger un otage à fournir une information HRP ou à effectuer un achat réel.",
          ]),
      },
      {
        id: "ill-braquages",
        title: "Braquages — barème",
        html:
          `<p class="lead">Barème WaveSide par défaut. Le staff peut l'adapter selon la population connectée ou un événement.</p>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>Activité</th><th>Criminels max</th><th>Otages conseillés</th><th>Police min.</th></tr></thead>
            <tbody>
              <tr><td>Supérette</td><td>4</td><td>0 à 1</td><td>2</td></tr>
              <tr><td>Petit commerce / caisse sécurisée</td><td>4</td><td>0 à 1</td><td>2</td></tr>
              <tr><td>Bijouterie</td><td>6</td><td>1 à 2</td><td>4</td></tr>
              <tr><td>Fleeca / petite banque</td><td>6</td><td>1 à 3</td><td>4</td></tr>
              <tr><td>Convoi / transfert de fonds</td><td>6</td><td>0 à 2</td><td>4</td></tr>
              <tr><td>Grande banque / Pacific</td><td>8</td><td>2 à 4</td><td>6</td></tr>
              <tr><td>Opération exceptionnelle</td><td colspan="3">Selon validation staff</td></tr>
            </tbody>
          </table></div>` +
          L([
            "Un braquage doit être préparé et joué comme une scène RP, pas comme une mécanique de farm.",
            "Les braqueurs doivent laisser une possibilité de négociation aux forces de l'ordre.",
            "Les occupants de véhicules cachés en retrait mais participant ensuite à l'action sont comptés dans le groupe d'assaillants.",
            "Les renforts criminels qui rejoignent la fuite sont comptés dans l'effectif initial.",
          ]),
      },
      {
        id: "ill-otages",
        title: "Prises d'otages & négociations",
        html:
          L([
            "Un otage doit être un véritable joueur participant à la scène. Un complice volontaire ne peut pas être présenté comme otage.",
            "Il est interdit de multiplier artificiellement les otages ou de kidnapper des civils en boucle près du lieu du braquage.",
            "Un otage doit recevoir des interactions régulières. Il est interdit de le tuer parce qu'une négociation prend du temps.",
            "Un otage libéré dans le cadre d'un accord ne peut pas être repris immédiatement.",
          ]) +
          `<div class="split">
            <div class="split__col split__col--ok"><h4>${icon("check")} Demandes recevables</h4>${U(["un passage de sortie raisonnablement dégagé ;", "l'absence d'un dispositif précis sur une courte phase de fuite ;", "un moyen de transport si la scène le justifie ;", "une libération progressive d'otages."])}</div>
            <div class="split__col split__col--ko"><h4>${icon("x")} Non recevables</h4>${U(["l'interdiction absolue de poursuivre ;", "obliger la police à déposer ses armes ;", "une somme démesurée sans justification ;", "toute exigence HRP ou administrative."])}</div>
          </div>`,
      },
      {
        id: "ill-feu",
        title: "Sommations & ouverture du feu",
        html:
          `<p class="lead">L'usage des armes doit rester la conséquence d'une escalade RP. Une poursuite ou un simple refus de s'arrêter ne suffit pas à autoriser l'ouverture du feu.</p>` +
          L([
            "Une sommation doit être claire, audible, réalisable et laisser un court délai de réaction. Ex. : « Descendez du véhicule, mains en l'air. »",
            "Une sommation donnée à distance, inaudible ou immédiatement suivie de tirs n'est pas valable.",
            "Il est interdit de donner une sommation uniquement pour créer un motif artificiel d'ouverture du feu.",
            "Dans une action organisée, un <strong>Lead OP</strong> doit être désigné. Une sommation n'est pas une autorisation automatique de tirer.",
            "Les négociations ne servent pas à gagner du temps pour positionner un nombre illimité de tireurs.",
          ]),
      },
      {
        id: "ill-groupes",
        title: "Groupes : Gang, Organisation, MC",
        html:
          `<div class="zones zones--3">
            <div class="zone"><span class="zone__ico">${icon("flame")}</span><strong>Gang</strong><em>Implanté localement, identité et territoire identifiables. 4 membres recommandés.</em></div>
            <div class="zone"><span class="zone__ico">${icon("briefcase")}</span><strong>Organisation</strong><em>Hiérarchie, moyens importants, objectifs long terme. 6 membres recommandés.</em></div>
            <div class="zone"><span class="zone__ico">${icon("bike")}</span><strong>Motorcycle Club</strong><em>Identité de club, exigences d'une organisation. 6 membres recommandés.</em></div>
          </div>` +
          L([
            "Un groupe doit disposer d'un nom, d'une identité, d'objectifs RP et d'un responsable ; il est soumis à un dossier de présentation en ticket.",
            "Les recrutements doivent être joués en RP et les grades correspondre à des responsabilités compréhensibles.",
            "Une alliance permanente entre groupes est interdite ; une coopération ponctuelle pour un objectif précis est possible.",
            "Une entreprise de façade doit produire réellement du RP légal et ne pas servir uniquement de coffre ou de blanchisserie automatique.",
            "Une dissolution administrative peut être prononcée en cas d'inactivité prolongée ou d'abus répétés.",
          ]),
      },
      {
        id: "ill-armement",
        title: "Armement",
        html:
          `<div class="tbl-wrap"><table class="tbl tbl--center">
            <thead><tr><th>Statut</th><th>A<br><small>Blanches</small></th><th>B<br><small>Poing</small></th><th>C<br><small>Compactes</small></th><th>D<br><small>Longues</small></th><th>E<br><small>Spéciales</small></th></tr></thead>
            <tbody>
              <tr><td>Civil / indépendant</td><td><span class="yes">${icon("check")}</span></td><td><span class="maybe">RP</span></td><td><span class="no">${icon("x")}</span></td><td><span class="no">${icon("x")}</span></td><td><span class="no">${icon("x")}</span></td></tr>
              <tr><td>Gang</td><td><span class="yes">${icon("check")}</span></td><td><span class="yes">${icon("check")}</span></td><td><span class="yes">${icon("check")}</span></td><td><span class="no">${icon("x")}</span></td><td><span class="no">${icon("x")}</span></td></tr>
              <tr><td>Organisation / MC</td><td><span class="yes">${icon("check")}</span></td><td><span class="yes">${icon("check")}</span></td><td><span class="yes">${icon("check")}</span></td><td><span class="yes">${icon("check")}</span></td><td>Validation</td></tr>
            </tbody>
          </table></div>` +
          L([
            "Sortir une arme constitue une escalade importante et doit être justifié. Une arme automatique ne règle pas un conflit mineur.",
            "Les armes longues transportées visiblement en pleine ville doivent provoquer des conséquences RP.",
            "Le free-loot d'armes est interdit. Si la victime coopère entièrement à un braquage classique, ses armes ne peuvent pas être volées.",
            "Une arme peut être récupérée si elle a été utilisée contre vous, si elle est l'objet du conflit, lors d'une guerre officielle ou si l'opération le prévoit — seule l'arme concernée.",
            "Les armes et équipements des forces de l'ordre ne peuvent jamais être volés, sauf autorisation explicite du staff.",
          ]),
      },
      {
        id: "ill-territoires",
        title: "Guerres & revendications de territoire",
        html:
          L([
            "Une guerre doit provenir d'un conflit RP construit et ne supprime pas les règles de fair-play, Fear RP et Pain RP. Les attaques répétées sans temps de respiration sont interdites.",
            "Une revendication donne un <strong>avantage RP et politique</strong>, pas un droit de tuer toute personne présente.",
            "La demande est ouverte auprès du pôle illégal et précise le point ciblé, la motivation et la manière dont le groupe compte l'animer.",
            "Un groupe ne peut détenir plus de <strong>deux revendications majeures</strong> simultanément, sauf projet validé.",
            "Camper un point, taxer chaque joueur sans interaction ou supprimer l'accès à l'activité pour les autres est interdit.",
            "Une contestation doit être annoncée ou construite en RP, avec objectif clair et conditions de sortie. Une revendication inactive peut être retirée.",
          ]) + HINT("info", "La perte d'un point doit être acceptée comme une conséquence RP et ne justifie pas un conflit HRP."),
      },
    ],
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: "services",
    num: "05",
    icon: "siren",
    title: "Métiers publics & Urgences",
    intro: "Forces de l'ordre, services médicaux, justice et entreprises : des institutions crédibles pour des interactions de qualité.",
    sections: [
      {
        id: "srv-lspd",
        title: "LSPD — Comportement & procédures",
        html:
          L([
            "Les forces de l'ordre doivent privilégier la désescalade lorsque la situation le permet. L'usage de la force doit être proportionné au danger.",
            "Un contrôle ne doit pas être lancé uniquement pour provoquer une scène.",
            "Les informations issues des outils de police ne sont utilisées que dans un cadre RP légitime.",
            "Une sommation doit être compréhensible et laisser un temps de réaction : une phrase criée au moment du tir n'est pas valable.",
            "Circuler masqué peut justifier un contrôle, mais le masque ne constitue pas à lui seul une preuve d'infraction.",
          ]),
      },
      {
        id: "srv-poursuites",
        title: "Poursuites, arrestations & fouilles",
        html:
          L([
            "<strong>Le PIT est interdit.</strong> Toute manœuvre de contact visant à faire pivoter un véhicule est interdite.",
            "Les tirs sur un véhicule ne sont justifiés qu'en présence d'une menace grave et immédiate.",
            "La poursuite ne justifie pas une conduite irréaliste ni de sacrifier la vie des civils.",
            "Une fouille repose sur un motif RP cohérent ; le joueur interpellé doit comprendre les faits reprochés.",
            "Les objets saisis correspondent à ce qui est réellement découvert. Une arrestation ne doit jamais être prolongée pour punir HRP.",
            "Armes, uniformes, véhicules et bases de données de service ne peuvent être vendus ou transmis hors procédure.",
          ]),
      },
      {
        id: "srv-ems",
        title: "EMS — Services médicaux",
        html: L([
          "Les EMS restent neutres pendant les conflits lorsqu'ils interviennent en tant que soignants.",
          "Un EMS ne communique jamais à un groupe adverse des informations obtenues pendant une intervention.",
          "Une personne gravement blessée doit être stabilisée avant de reprendre une activité physique ou violente.",
          "Un joueur soigné doit respecter les indications RP raisonnables liées à son état.",
          "Les véhicules médicaux ne servent pas aux activités criminelles ni aux déplacements personnels.",
        ]),
      },
      {
        id: "srv-gouv",
        title: "Gouvernement, justice & corruption",
        html: L([
          "Les décisions judiciaires reposent sur des éléments RP et respectent les procédures établies.",
          "Mandats, dossiers et casiers ne doivent jamais servir à régler un conflit HRP.",
          "Les sanctions judiciaires RP ne remplacent pas les sanctions administratives du serveur, et inversement.",
          "Toute corruption impliquant une armurerie, une base de données, une suppression de casier ou un détournement massif peut nécessiter une validation staff préalable.",
        ]),
      },
      {
        id: "srv-entreprises",
        title: "Métiers & entreprises",
        html: L([
          "Un métier sert à créer des interactions et non uniquement à générer de l'argent.",
          "Les véhicules, stocks et comptes d'une société ne sont pas des biens personnels. Les fausses factures sont interdites.",
          "Recrutements et licenciements se font en RP, avec une justification identifiable.",
          "Il est interdit de vider un compte d'entreprise avant de quitter un poste dans le but de nuire.",
          "Le cumul de métiers est autorisé s'il ne crée pas de conflit d'intérêts majeur.",
          "La vente d'une entreprise passe par les mécanismes prévus ; toute transaction HRP ou paiement réel est interdit.",
        ]),
      },
    ],
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: "sanctions",
    num: "06",
    icon: "scale",
    title: "Sanctions & Modération",
    intro: "Les sanctions sont adaptées à la gravité, à la récidive, à l'intention et à l'impact sur les autres joueurs.",
    sections: [
      {
        id: "sanc-echelle",
        title: "Échelle des sanctions",
        html:
          `<div class="scale">
            <div class="scale__lvl" style="--l:1"><span>Rappel</span><em>Explication, rappel de règle</em></div>
            <div class="scale__lvl" style="--l:2"><span>Léger</span><em>Avertissement, sanction courte</em></div>
            <div class="scale__lvl" style="--l:3"><span>Modéré</span><em>Ban temporaire, retrait de biens obtenus abusivement</em></div>
            <div class="scale__lvl" style="--l:4"><span>Lourd</span><em>Ban prolongé, retrait de responsabilité, dissolution de groupe</em></div>
            <div class="scale__lvl" style="--l:5"><span>Critique</span><em>Bannissement définitif</em></div>
          </div>` +
          HINT("warning", "Cette grille n'est pas automatique. Un exploit majeur, une triche ou une atteinte grave à la communauté peut entraîner directement une sanction lourde."),
      },
      {
        id: "sanc-triche",
        title: "Triche & logiciels interdits",
        html: U([
          "logiciels de triche et menus externes non autorisés ;",
          "injection ou modification offrant un avantage injuste ;",
          "macros destinées à automatiser une action compétitive ;",
          "contournement volontaire des systèmes anti-triche.",
        ]),
      },
      {
        id: "sanc-signalement",
        title: "Signaler un problème",
        html:
          L([
            "Terminez la scène si cela reste possible.",
            "Conservez une preuve complète : contexte avant, action contestée, suite immédiate, son si nécessaire.",
            "Ouvrez un ticket sur le Discord WaveSide.",
            "Expliquez les faits de manière chronologique et factuelle.",
            "Laissez le staff recueillir la version des autres personnes concernées.",
          ]) + `<p class="muted">Inutile de régler le problème en MP, de menacer d'un report ou d'appeler publiquement à sanctionner un joueur.</p>`,
      },
      {
        id: "sanc-contest",
        title: "Contestation & responsabilité collective",
        html: L([
          "Une sanction peut être contestée via le canal prévu. La contestation reste respectueuse et apporte des éléments nouveaux.",
          "Harceler un membre du staff en message privé ne constitue pas une contestation valable.",
          "Un groupe peut recevoir une sanction collective lorsqu'un abus est organisé, répété ou encouragé par sa hiérarchie. Une erreur isolée n'entraîne pas automatiquement une dissolution.",
        ]),
      },
    ],
  },
];
