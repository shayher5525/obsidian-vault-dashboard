# Journal des modifications de Vault Dashboard X

[English](../CHANGELOG.md) · [中文](CHANGELOG_zh.md) · [日本語](CHANGELOG_ja.md) · [한국어](CHANGELOG_ko.md) · **Français** · [Español](CHANGELOG_es.md) · [Italiano](CHANGELOG_it.md)

> Cette traduction résume l'essentiel de chaque version. Pour le détail des raisonnements, voir la [version anglaise](../CHANGELOG.md).

## Versionnage

Ce projet suit le versionnage sémantique (MAJOR.MINOR.PATCH).

| Partie | Quand elle augmente | Exemple |
| --- | --- | --- |
| MAJOR | Rupture : `data.json` ou réglages incompatibles, migration manuelle nécessaire, fonctionnalité retirée | Un réglage renommé sans lecture de compatibilité |
| MINOR | Nouvelle fonctionnalité, nouveau panneau ou onglet, refonte visible de l'interaction ou du visuel | Ajout des blocs d'accès rapide |
| PATCH | Correction, reformulation, ajustement de style — sans changer ce que fait le plugin | Corriger un niveau de couleur écrasé ; ajuster un espacement |

La référence de version est `version` dans `manifest.json` ; le tag de publication lui est identique, sans préfixe `v`.

---

## [0.15.1] — 2026-09-02

### Corrigé

- Fast Food Pop, mode clair : les jours sans activité étaient invisibles sur la carte de chaleur. La couleur des cases vides et le fond derrière elles étaient tous deux le doré clair `#FFF4D6` — la même valeur, soit un contraste de 1,00:1. Les cases vides passent au blanc, ce qui conserve le fond doré (« l'or fait la surface ») tout en s'y lisant comme une ouverture. Le mode sombre était déjà distinguable et reste inchangé.

## [0.15.0] — 2026-09-02

### Ajouté

- Nouvelle apparence **Scène noire** (`sony`), construite d'après la spec visuelle style Sony `AA_WorkMaterial 工作资料/91_DesignFiles 设计文件/2026-09-02_索尼风格视觉设计规范.md` v1.0 (elle-même tirée du manuel d'identité Sony Electronics USA de 2007). Seule la grammaire visuelle est empruntée : fond noir, cadre ouvert, sans-serif géométrique, un seul point de lumière colorée. Ni logo, ni slogan, ni fonte sous licence — ITC Avant Garde est remplacée par une pile Poppins / Jost / Questrial / Source Han Sans. La base est un noir pur `#000000`, pas un noir adouci ; la profondeur vient de trois paliers de clarté (`#000000` → `#0D0D0D` → `#1A1A1A`) et non d'ombres, les angles sont droits (2px au maximum pour les contrôles). Une seule couleur d'accent par écran : ocean `#00A4E8` en mode sombre (7,4:1 sur noir) et slate `#165B65` en mode clair. Le clair ne reprend pas ocean, qui tombe à environ 2,7:1 sur blanc et ne peut porter du texte : la spec demande de revérifier le contraste plutôt que d'inverser la palette sombre. L'accent ne remplit jamais un bloc, si bien que l'onglet actif est un soulignement glissant de 2px et non une pastille pleine, les chiffres des cartes restent noirs ou blancs, et seuls les liens sont colorés. Le mode sombre est la forme canonique de la spec ; le mode clair suit sa propre règle d'inversion pour les pages denses en texte.
- Le test hors ligne gagne cinq gardes Scène noire, chacune reprise d'une règle stricte de la spec : palette HEX fermée, pas de teinte par `rgba()` (les couleurs s'emploient à 100%), aucune ombre portée, rayons ≤ 2px, et les huit couleurs de base réellement déclarées.

### Modifié

- Les sept README listent désormais cinq thèmes.

## [0.14.0] — 2026-09-01

### Ajouté

- Nouvelle apparence **Fast Food Pop** (`fastfood`), construite d'après la spec visuelle style McDonald's v1.0. Palette limitée à Gold `#FFBC0D`, Red `#DB0007`, White et neutres adaptés (`#1A1A1A`, `#5C5C5C`, `#E6E6E6`, `#242424`) — pas de Speedee, d'arches ni de wordmark, seulement la grammaire des couleurs. Light : White + barre Gold + texte noir, Red réservé aux états actifs, données clés et pics de chaleur (« l'or fait la surface, le rouge le point »). Dark : `#1A1A1A` + `#242424` + Gold comme accent et seule exception de couleur-or pour le texte. Dégradé de chaleur gold-tint → gold → red.

### Modifié

- L'apparence `modern` renommée **Apple → Tech minimaliste** (et équivalents localisés). L'id interne `modern` et la classe CSS `vdash-style-modern` ne changent pas, les sélections existantes dans `data.json` sont conservées.
- L'apparence `starbucks` renommée **Starbucks Café → Maison du Café**. L'id interne et la classe CSS ne changent pas.
- Les sept README (anglais + zh/ja/ko/fr/es/it) mis à jour pour lister quatre thèmes et les nouveaux noms.

## [0.13.0] — 2026-09-01

### Ajouté

- Le test hors ligne protège désormais la gamme Starbucks : les huit HEX standard doivent être déclarés, aucun autre HEX n'est admis et chaque couleur translucide doit dériver du RGB de l'une de ces huit couleurs.

### Modifié

- **L'apparence « Starbucks Café » a été reconstruite selon la norme visuelle v2.0.** Les primitives sont limitées à `#006241`, `#00754A`, `#D4E9E2`, `#1E3932`, noir, `#F2F0EB`, `#F9F9F9` et blanc. Les anciens verts inventés, bruns café, beiges et couleurs de graphique sans rapport ont été retirés. Les tokens sémantiques et de composants, le mode sombre, les ombres et les transparences dérivent uniquement de cette palette. L'échelle de 8px et la hauteur minimale de 44px ont aussi été alignées ; les cellules de la carte thermique ont des noms accessibles et sont utilisables au clavier lorsqu'elles sont interactives.

## [0.12.1] — 2026-09-01

### Modifié

- Les textes des réglages ne renvoient plus au coffre personnel de l'auteur. « Journal des modifications » est désormais décrit par son public et sa méthode de comptage. Trois commentaires de code portant la même hypothèse ont été nettoyés — le plugin n'a pas d'étape de compilation, `main.js` est donc lu tel quel par les utilisateurs.
- Des journaux traduits ont été ajoutés dans `docs/`, un par langue de README, avec un lien depuis chaque README. Le `CHANGELOG.md` racine est maintenant en anglais.

## [0.12.0] — 2026-09-01

### Modifié

- **`useMtime` est désormais activé par défaut.** Dans la plupart des coffres, les notes n'ont ni date dans le frontmatter ni date dans le nom de fichier : désactivé, la carte de chaleur reste presque vide et une installation neuve affiche une page blanche. Un faux pic dû à la synchronisation, lui, se voit, s'explique et se désactive. **Les configurations existantes ne changent pas.**
- Avec un seul bloc configuré, le titre devient « Accès rapide · nom du bloc ». Auparavant, un bloc unique n'affichait pas d'onglets de premier niveau, si bien que le nom du dossier n'apparaissait nulle part.

## [0.11.0] — 2026-09-01

### Ajouté

- Boutons « Tout sélectionner » et « Tout décocher » dans le sélecteur de sous-dossiers.

### Modifié

- Les README traduits ont été déplacés dans `docs/` ; seule la version anglaise reste à la racine. Tous les README ont été mis à jour.

## [0.10.0] — 2026-09-01

### Ajouté

- Sous le chemin de chaque bloc d'accès rapide, ses sous-dossiers immédiats sont listés avec des cases à cocher qui décident lesquels deviennent des onglets de second niveau. Si tout est coché, les sous-dossiers ajoutés plus tard apparaissent automatiquement.
- Le sélecteur est rangé dans un panneau `<details>`, replié par défaut, dont le résumé indique « Tous les N » ou « n sur N sélectionnés ».

### Modifié

- **Les noms de dossier ne sont plus amputés de leur préfixe numérique : le nom complet est affiché.** L'ancien traitement était calqué sur la convention de nommage de l'auteur ; pour les autres, `2024_Q1 Reports` devenait `Reports` — disparaissait non seulement le numéro mais aussi le premier mot. Pour un nom court, saisissez-le dans « Nom affiché ».
- Page de réglages : la zone d'accès rapide est alignée à gauche avec le titre et les lignes de réglages natives.

## [0.9.0] — 2026-08-29

### Ajouté

- L'apparence Starbucks utilise elle aussi la surbrillance glissante.
- La barre de navigation supérieure passe en verre dépoli (`backdrop-filter`). Elle est en position sticky : le contenu défile dessous, ce qui donne matière au flou.

### Modifié

- **La carte de chaleur est inversée : de gauche à droite, du plus récent au plus ancien.** Quand elle dépasse la largeur du conteneur, la barre de défilement laissée à gauche montre les données les plus récentes.
- Le haut de la barre de navigation est scellé : plus aucun filet de contenu n'apparaît au-dessus pendant le défilement.

### Corrigé

- La couleur du texte ne change plus avant l'arrivée du curseur lors d'un changement d'onglet. Auparavant, du texte blanc restait environ 0,2 s sur un fond blanc, donc illisible.

## [0.8.1] — 2026-08-29

### Modifié

- `column-gap` et `row-gap` de la grille fusionnés en `gap`, ce qui évite un faux positif du lint CSS de l'annuaire communautaire.

## [0.8.0] — 2026-08-29

### Ajouté

- Langues de l'interface portées de 3 à 8 (ajout du français, de l'italien, du japonais, du coréen et de l'espagnol ; les 63 chaînes sont présentes dans chaque langue).
- Surbrillance glissante sur quatre groupes d'onglets. Désactivée automatiquement sous `prefers-reduced-motion: reduce`.

### Modifié

- « Dossiers visuels » renommé « Accès rapide » dans les 8 langues.
- Apparence Apple revue : carte de chaleur et accès rapide sur fond blanc, coins arrondis et fine bordure ; espacements resserrés ; onglets sans contour ni anneau de sélection.

### Corrigé

- Le fond propre des onglets masquait le curseur pendant son déplacement.
- Modifier `excludedPrefixes` ne rafraîchissait pas le total de notes.

## [0.7.1] — 2026-08-26

### Corrigé

- **Deux règles de `styles.css` endommagées par une réécriture par expression régulière.** De ce fait, les transitions et les styles `:hover` des onglets n'avaient jamais fonctionné.

### Modifié

- Le workflow de publication produit des attestations d'artefacts et génère les notes de version ; ajout de `package-lock.json`.

## [0.7.0] — 2026-08-24

### Ajouté

- Sélecteur de langue dans les réglages (limité alors à la page des réglages).

### Modifié

- Nom d'affichage du plugin changé en `Vault Dashboard` ; la zone de réglage des blocs passe en grille à trois colonnes.

## [0.6.0] — 2026-08-24

### Ajouté

- Les blocs deviennent configurables : jusqu'à 5, chacun pointant vers n'importe quel dossier avec son nom d'affichage. Le chemin est validé à la saisie.

### Modifié

- La liste adopte une structure unique : bloc sélectionné → onglets de ses sous-dossiers → liste de notes.

## [0.5.0] — 2026-08-24

### Ajouté

- Troisième apparence, « Starbucks Café ».

### Modifié

- Noms d'apparence raccourcis en « Apple » et « Console Y2K » (valeur par défaut inchangée).

### Corrigé

- Sous Starbucks, le texte de l'onglet sélectionné était invisible, et les cases sans activité se confondaient avec le fond.

## [0.4.0] — 2026-08-24

### Ajouté

- Sélecteur d'apparence dans les réglages et nouvelle apparence « Console Y2K » ; l'apparence d'origine a été retravaillée.

### Modifié

- Une classe d'apparence est posée sur l'élément racine ; l'ancien réglage `universal` migre automatiquement vers `y2k`.

## [0.3.0] — 2026-08-24

### Ajouté

- Bloc d'accès rapide au bas de la vue d'ensemble. Les liens de notes s'ouvrent toujours dans un nouvel onglet.

### Modifié

- Refonte complète du visuel sur un système de jetons ; carte de chaleur passée à une échelle de cinq couleurs pleines.

### Corrigé

- Les cinq règles de niveau de la carte de chaleur n'avaient pas leur préfixe de portée : toutes les cases s'affichaient dans la couleur du niveau le plus élevé.

## [0.2.1] et antérieures

Aucun enregistrement conservé. Ce fichier commence à 0.3.0.
