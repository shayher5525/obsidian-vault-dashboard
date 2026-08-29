# Vault Dashboard X

**English** · [中文](README_zh.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Français](README_fr.md) · [Español](README_es.md) · [Italiano](README_it.md)

A dashboard for your Obsidian vault: an activity heatmap, a folder-distribution
view, and configurable "visual folder" quick links — all in one pane.

## Features

- **Activity heatmap** — GitHub-style contribution grid showing how active your
  vault (or a changelog) is over time, with `All / 30 days / 7 days` ranges.
- **Folder distribution** — a breakdown of your notes by top-level folder, with
  drill-down rows, share-of-parent bars, and "new this month" counts.
- **Visual folders** — up to 5 configurable blocks that surface a chosen folder's
  subfolders as tabs and list its most recently modified notes.
- **Two data sources** — a generic "note activity" source (works in any vault)
  and an optional "changelog" parser for markdown changelogs.
- **Three themes** — Apple, Y2K Console, and Starbucks Café.
- **Internationalization** — English (default), Simplified Chinese, Traditional
  Chinese, Japanese, Korean, French, Spanish, and Italian.

## Data sources

### Note activity (default)

Each note contributes one "activity day", resolved with this fallback chain:

1. Frontmatter field `updated` (the field name is configurable).
2. Frontmatter `created` / `date`.
3. A `YYYY-MM-DD` prefix in the filename.
4. File modified time (`mtime`) — **off by default**; enabled via settings.

Note activity works out of the box in any vault with no extra configuration.

### Changelog

Counts entries in one or more changelog files. A parser reads `## YYYY-MM-DD`
sections and counts the top-level list items under each date:

```markdown
## 2026-08-23

- Publish the July report
- Fix a typo in the style guide

> Note: blockquotes under a date section are ignored.
```

Each file can be a single note or a folder (all `.md` files inside, non-recursive).

## Usage

Open the dashboard from the ribbon icon or the **"Open dashboard"** command.

- **Overview** tab — heatmap and summary cards.
- **Folders** tab — folder distribution.
- Click a changelog heatmap cell to jump to that day's section (changelog mode only).
- Click a folder row to drill down.

## Settings

| Setting | Description |
| --- | --- |
| Language | Interface language for the settings page and the dashboard. |
| Appearance | Visual style: Apple, Y2K Console, or Starbucks Café. |
| Activity data source | Note activity or Changelog. |
| Activity date field | Frontmatter field used first in the note-activity fallback chain. |
| Fall back to file modified time | Use `mtime` as the final fallback (off by default). |
| Changelog paths | Files/folders parsed in changelog mode. |
| Visual folders | Up to 5 blocks; each points to a folder and shows its subfolders and recent notes. |

## Installation

### From the community directory (once published)

Install "Vault Dashboard X" from **Settings → Community plugins**, then enable it.

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Create `.obsidian/plugins/vault-dashboard-x/` in your vault.
3. Copy the three files into that folder.
4. Enable the plugin under **Settings → Community plugins**.

## License

[GNU General Public License v3.0](LICENSE)

## Development

There is **no build step** — `main.js` is the plugin artifact. After editing,
disable and re-enable the plugin (or run `Reload app`) in Obsidian to pick up
changes.

- Bump versions with `npm version <patch|minor|major>`; it syncs `manifest.json`
  and `versions.json` automatically.
- Run the offline data-layer sanity checks with `node test/harness.js`.

The release tag **must equal** the `version` in `manifest.json` without a `v`
prefix; `main.js`, `manifest.json`, and `styles.css` are attached as separate
release assets.