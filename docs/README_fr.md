# Vault Dashboard X

[English](../README.md) · [中文](README_zh.md) · **Français** · [日本語](README_ja.md) · [한국어](README_ko.md) · [Español](README_es.md) · [Italiano](README_it.md)

Un tableau de bord pour votre coffre Obsidian : une carte de chaleur d'activité, une vue de répartition par dossier et des liens « accès rapide » configurables — le tout dans un seul panneau.

## Fonctionnalités

- **Carte de chaleur d'activité** — une grille de contributions façon GitHub montrant l'activité de votre coffre (ou d'un changelog) dans le temps, avec les plages `Tout / 30 jours / 7 jours`. Les semaines les plus récentes sont à gauche.
- **Répartition par dossier** — une ventilation de vos notes par dossier de premier niveau, avec lignes dépliables, barres de part du parent et compteurs « nouveau ce mois-ci ».
- **Accès rapide** — jusqu'à 5 blocs configurables. Chacun pointe vers un dossier, liste ses notes les plus récemment modifiées et affiche les sous-dossiers que vous cochez comme onglets de second niveau. Les noms de dossier sont affichés tels quels.
- **Deux sources de données** — une source générique « activité des notes » (fonctionne dans n'importe quel coffre) et un analyseur « changelog » facultatif pour les changelogs Markdown.
- **Cinq thèmes** — Tech minimaliste, Console Y2K, Maison du Café, Fast Food Pop et Scène noire.
- **Internationalisation** — anglais (par défaut), chinois simplifié, chinois traditionnel, japonais, coréen, français, espagnol et italien.

## Sources de données

### Activité des notes (par défaut)

Chaque note contribue à un « jour d'activité », résolu par cette chaîne de repli :

1. Le champ `updated` du frontmatter (le nom du champ est configurable).
2. `created` / `date` du frontmatter.
3. Un préfixe `YYYY-MM-DD` dans le nom du fichier.
4. L'heure de modification du fichier (`mtime`) — **activé par défaut**. Dans la plupart des coffres, les notes n'ont ni date dans le frontmatter ni date dans le nom de fichier ; sans ce recours, la carte de chaleur resterait presque vide. Si un service de synchronisation réécrit les dates en masse et crée un faux pic, désactivez-le dans les paramètres.

L'activité des notes fonctionne immédiatement dans n'importe quel coffre, sans configuration supplémentaire.

### Changelog

Compte les entrées d'un ou plusieurs fichiers de changelog. Un analyseur lit les sections `## YYYY-MM-DD` et compte les éléments de liste de premier niveau sous chaque date :

```markdown
## 2026-08-23

- Publier le rapport de juillet
- Corriger une coquille dans le guide de style

> Remarque : les citations sous une section de date sont ignorées.
```

Chaque fichier peut être une note unique ou un dossier (tous les fichiers `.md` qu'il contient, sans récursivité).

## Utilisation

Ouvrez le tableau de bord depuis l'icône du ruban ou la commande **« Ouvrir le tableau de bord »**.

- Onglet **Vue d'ensemble** — carte de chaleur et cartes de résumé.
- Onglet **Dossiers** — répartition par dossier.
- Cliquez sur une cellule de la carte de chaleur du changelog pour accéder à la section de ce jour (mode changelog uniquement).
- Cliquez sur une ligne de dossier pour déplier.

## Paramètres

| Paramètre | Description |
| --- | --- |
| Langue | Langue de l'interface pour la page des paramètres et le tableau de bord. |
| Apparence | Style visuel : Tech minimaliste, Console Y2K, Maison du Café, Fast Food Pop ou Scène noire. |
| Source de données d'activité | Activité des notes ou Changelog. |
| Champ de date d'activité | Champ du frontmatter utilisé en premier dans la chaîne de repli de l'activité des notes. |
| Repli sur l'heure de modification du fichier | Utiliser `mtime` comme dernier recours (activé par défaut). |
| Chemins de changelog | Fichiers/dossiers analysés en mode changelog. |
| Accès rapide | Jusqu'à 5 blocs ; chacun pointe vers un dossier et liste ses notes récentes. |
| Sous-dossiers à afficher | Par bloc : cochez les sous-dossiers qui deviennent des onglets de second niveau. Tout cocher fait apparaître automatiquement les sous-dossiers ajoutés plus tard. |

## Installation

### Depuis l'annuaire communautaire (une fois publié)

Installez « Vault Dashboard X » depuis **Paramètres → Plugins communautaires**, puis activez-le.

### Manuelle

1. Téléchargez `main.js`, `manifest.json` et `styles.css` depuis la dernière version.
2. Créez `.obsidian/plugins/vault-dashboard-x/` dans votre coffre.
3. Copiez les trois fichiers dans ce dossier.
4. Activez le plugin sous **Paramètres → Plugins communautaires**.

## Journal des modifications

[Journal complet](CHANGELOG_fr.md) — ce qui a changé à chaque version, et pourquoi.

## Licence

[GNU General Public License v3.0](../LICENSE)

## Développement

Il n'y a **aucune étape de build** — `main.js` est l'artefact du plugin. Après modification, désactivez puis réactivez le plugin (ou exécutez `Reload app`) dans Obsidian pour prendre en compte les changements.

- Incrémentez les versions avec `npm version <patch|minor|major>` ; cela synchronise automatiquement `manifest.json` et `versions.json`.
- Exécutez les vérifications de cohérence de la couche de données hors ligne avec `node test/harness.js`.

Le tag de version **doit être égal** à la `version` dans `manifest.json`, sans préfixe `v` ; `main.js`, `manifest.json` et `styles.css` sont attachés comme ressources de version séparées.
