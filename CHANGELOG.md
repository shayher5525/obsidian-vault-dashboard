# Vault Dashboard X Changelog

**English** · [中文](docs/CHANGELOG_zh.md) · [日本語](docs/CHANGELOG_ja.md) · [한국어](docs/CHANGELOG_ko.md) · [Français](docs/CHANGELOG_fr.md) · [Español](docs/CHANGELOG_es.md) · [Italiano](docs/CHANGELOG_it.md)

## Versioning

This project follows semantic versioning (MAJOR.MINOR.PATCH).

| Part | When it goes up | Example |
| --- | --- | --- |
| MAJOR | Breaking change: incompatible `data.json` or settings, manual migration required, a feature removed | A setting is renamed without a compatibility read |
| MINOR | New feature, new pane or tab, visible interaction or visual rework | Add the quick-access blocks; re-do the whole visual token set |
| PATCH | Bug fix, wording change, style tweak — no change to what the plugin does | Fix a colour step being overridden; adjust spacing |

The source of truth for the version is `version` in `manifest.json`; the release tag equals it, without a `v` prefix.

### Entry conventions

- Section headings are always `## [x.y.z] — YYYY-MM-DD`, dated by the day the change was made.
- Inside a section, entries are grouped under `### Added` / `### Changed` / `### Fixed`; only the groups that apply are written.
- **Several changes on the same day are merged into one version** — no separate number for intermediate states.
- **History is never back-filled.** Versions with no surviving record are marked as such rather than inferred from file timestamps or code.

---

## [0.13.0] — 2026-09-01

### Added

- The offline harness now guards the Starbucks appearance's colour gamut: all eight standard HEX values must be declared, no other HEX may appear in Starbucks rules, and every translucent colour must derive from one of those eight RGB values.

### Changed

- **The Starbucks Café appearance was rebuilt from the v2.0 visual standard.** Its primitive layer is now exactly Starbucks Green `#006241`, Accent Green `#00754A`, Light Green `#D4E9E2`, House Green `#1E3932`, Black, Warm Neutral `#F2F0EB`, Cool Neutral `#F9F9F9`, and White. The former invented greens, coffee browns, beige shades, and unrelated chart colours were removed. Semantic and component tokens now reference those primitives; shadows, muted text, dividers, hover fills, and dark-mode surfaces use opacity derived only from the same palette. The 8px spacing/radius scale and 44px control minimum were aligned with the new specification as well. Heatmap cells now expose accessible labels and support keyboard activation when clickable.

## [0.12.1] — 2026-09-01

### Changed

- Settings wording no longer refers to the author's own vault. "Changelog" is now described by who it is for and how it counts ("for people who keep a markdown changelog, counting entries under each date heading") instead of being called "this vault's original behavior", which meant nothing to anyone else. Three code comments carrying the same assumption were cleaned up as well — the plugin has no build step, so `main.js` is what users read.
- Translated changelogs added under `docs/`, one per README language, linked from every README. The root `CHANGELOG.md` is now English, matching `README.md`.

## [0.12.0] — 2026-09-01

### Changed

- **`useMtime` now defaults to on.** It defaulted to off to avoid false spikes when a sync drive bulk-refreshes `mtime`, but that is a specific environment's problem: most vaults have notes with neither a date in frontmatter nor one in the filename, so with it off the heatmap is nearly empty and a fresh install shows a blank page. A blank page drives people away faster than an occasional false spike, and a spike is visible, explainable, and switchable. The setting's description was rewritten in all eight languages to explain the trade-off rather than just state the default. **Existing configurations are unaffected** — `Object.assign` keeps stored values.
- With only one block configured, the quick-access heading becomes "Quick access · Block name". Previously a single block rendered no first-level tabs (a lone tab you cannot switch away from is useless), which left that folder's name nowhere to be seen. With two or more blocks, the heading and tab row are unchanged.
- The versioning section of this file was rewritten for public readers: material that only made sense in the author's own environment was removed.

## [0.11.0] — 2026-09-01

### Added

- The subfolder picker gained **Select all** and **Clear all** buttons. "Select all" writes `subs = null` (equivalent to ticking every box, so subfolders added later appear automatically); "Clear all" writes an empty array (that block shows no second-level tabs) — reusing the existing three-state semantics rather than inventing a fourth.

### Changed

- The six translated READMEs moved into `docs/`; only the English one stays in the repository root (GitHub needs a root README to render on the repository page). Language navigation, the `English` back-link, and the `LICENSE` link were repointed, and every local link was verified as reachable.
- All seven READMEs were brought up to date: "visual folders" renamed to "quick access" to match the UI; the subfolder picker documented and added to the settings table; folder names noted as shown exactly as they are on disk; the heatmap noted as having the newest weeks on the left.

## [0.10.0] — 2026-09-01

### Added

- Under each quick-access block's folder path, its **immediate subfolders** are listed with checkboxes that decide which become second-level tabs. `factoryTabs[i].subs` has three states: `null` shows everything and lets subfolders added later appear automatically; an array shows only what it lists; an empty array shows none. "Select all" stores `null` rather than the full list — storing the full list would mean newly created subfolders never appear, contradicting what the checked UI implies, while "none selected" and "show everything" must stay distinguishable, so an empty array cannot mean both. Older saved settings have no such field and are read as `null`, so behaviour is unchanged. Changing a block's folder path resets `subs` to `null`.
- The picker lives in a native `<details>` panel, collapsed by default, with a summary reading "All N" or "n of N selected". `<select multiple>` was rejected: on macOS it renders as a scrolling list box that needs Cmd-click for multi-select — neither obviously a dropdown nor easy to discover.

### Changed

- **Folder names are no longer stripped of a numeric prefix; the full name is shown.** The old regex `^[\d-]+_\S*\s+(.+)$` took the trailing segment, written for the author's `NN_EnglishName LocalName` convention. For anyone else it silently ate content: `2024_Q1 Reports` displayed as `Reports`, `01_Meeting Notes` as `Notes`, `01_Draft v2 final` as `v2 final` — what disappeared was not only the number but the first word after the underscore, with no toggle and no notice. A public plugin should not rewrite the user's folder names, so the function was removed. Anyone wanting a short name can still type one in "Display name". Settings text in all eight languages and the related code comments were corrected to match.
- Settings page: the quick-access rows now align on the left. The custom block rows and the description paragraph had no horizontal padding and sat 16px to the left of the `h3` heading and the native setting rows. With `padding: 0 16px` on both, heading, native rows, description, and block rows share the same left edge (measured identical), and the right edges line up too.

## [0.9.0] — 2026-08-29

### Added

- The Starbucks appearance now uses the sliding highlight too, on the same mechanism as the Apple appearance: the slider carries the selected state and the tab itself gives up its background. Colours come from that appearance's green tokens, and the three shadow levels reuse the values from its own `is-active` rules; second-level tabs use a soft fill with no shadow.
- The top navigation bar became frosted glass: `background-color: rgba(255,255,255,.62)` plus `backdrop-filter: blur(20px) saturate(180%)`. Only the navigation bar — it is sticky, so content scrolls beneath it and the blur has something to refract; behind a slider there is only a flat track, where the blur would amount to plain translucency.

### Changed

- **The heatmap now runs newest-to-oldest, left to right.** The grid is `grid-auto-flow: column` (one column per week), so columns are emitted in reverse while each column still runs Monday to Sunday. Month labels are reversed to match, with the month-change test applied in display order so a label lands on that month's leftmost column. Strip mode (ranges of 31 days or fewer) is reversed as well. A side benefit: when the heatmap is wider than its container, the horizontal scrollbar rests at the left on the most recent data instead of having to be dragged right.
- The navigation bar is sealed at the top, so no sliver of content shows above it while scrolling. The gap had two sources: the top padding of `.vdash-stage` (pulled up with a negative margin and given back as padding to keep the layout position) and the scroll container's own 12px top padding (zeroed — that strip scrolls along with the content).

### Fixed

- **Tab text no longer changes colour ahead of the slider.** A click gave the new tab `is-active` immediately, turning the text white while the slider still needed 0.22–0.28s to arrive, leaving white text on a white background; the outgoing tab dimmed at the same moment while the slider was still under it — the same problem mirrored. The incoming tab now carries `is-arriving` to keep the unselected colour and the outgoing one temporarily keeps `is-active`, both released once the slider lands. Both sides need `transition: none`, otherwise the first 120ms are still mid-fade and the problem is merely shortened. The y2k appearance has no slider, so the whole block is gated on `getComputedStyle(slider).display`.

## [0.8.1] — 2026-08-29

### Changed

- The heatmap grid's `column-gap` and `row-gap` were merged into the `gap` shorthand. They already held the same value, so nothing changes visually, and it sidesteps the community-directory CSS lint filing the property name `column-gap` under a false-positive "multicolumn partially supported" warning.

## [0.8.0] — 2026-08-29

### Added

- Interface languages went from 3 to 8: French, Italian, Japanese, Korean, and Spanish join English, Simplified Chinese, and Traditional Chinese, with all 63 strings present in every language. Language names now use each language's own word for itself (Français / 日本語 / 한국어 / Español) from a shared `LOCALE_NAMES` constant. `INTL_LOCALE` was extended to match, so numbers and month names format per the chosen language.
- Tab switching gained a sliding highlight across four tab groups (main tabs, range switcher, and the quick-access first- and second-level tabs): the selected state is carried by a slider that glides from the old position to the new one. Because every click rebuilds the DOM, `mountSlider()` remembers the previously selected index, drops the slider there without animation, and transitions it on the next frame. It is disabled automatically under `prefers-reduced-motion: reduce`.

### Changed

- "Visual folders" renamed to "Quick access" in all 8 languages (fr `Accès rapide` / it `Accesso rapido` / ja `クイックアクセス` / ko `바로가기` / es `Acceso rápido`).
- Apple appearance: the heatmap and quick-access containers changed from a pale blue square-cornered fill to a white surface with an 18px radius and a hairline border, matching the stat cards above; the summary line under the heatmap lost its fill; the navigation bar dropped its translucent grey and `backdrop-filter` in favour of the canvas colour with a single divider line.
- Apple appearance, tighter layout: the quick-access container's margin went from `clamp(48,7vw,80)` to `clamp(16,2vw,24)` and its padding from `clamp(40,7vw,80)` to `clamp(20,3vw,32)`, with heatmap padding, page margin, card height, and inter-group spacing reduced to match. The gap between the bottom of the heatmap and the quick-access heading fell from roughly 200px to 68px.
- Under the Apple appearance all tabs lost their outlines and selection rings, leaving the slider's fill to indicate selection; main tabs and range buttons are now weight 600.

### Fixed

- The slider was being hidden behind the tabs' own backgrounds: first-level block tabs carried a white pill (`--vd-canvas`) sitting above the slider, so passing under one looked like "a white rounded rectangle covering the selection". Unselected tabs are now transparent and `:hover` uses a translucent tint instead of a solid one.
- Changing `excludedPrefixes` did not refresh the note total: `invalidate()` cleared `_fileDates` but not the `_notes` cache.

## [0.7.1] — 2026-08-26

### Fixed

- **Two rules in `styles.css` damaged by an earlier bulk regex rewrite** (`styles.css:163` and `:506`). Adding the `.view-content.vdash-content` prefix to selectors in bulk had caught a multi-line `transition` declaration and collapsed a rule boundary, which meant the community directory's CSS lint reported `Unknown word transition`, and the transitions and `:hover` styles of `.vdash-tab` / `.vdash-range-btn` / `.vdash-factory-tab` **had never been in effect**.

### Changed

- The release workflow now produces GitHub artifact attestations (`actions/attest-build-provenance`), so `gh attestation verify` can confirm `main.js` / `manifest.json` / `styles.css` were built from this repository.
- The release workflow enables `generate_release_notes`, so releases are no longer published with an empty description.
- Added `package-lock.json` for reproducible builds (the community directory's build verification needs a lockfile).

## [0.7.0] — 2026-08-24

### Added

- A "settings language" dropdown (above "Appearance"): Simplified Chinese / Traditional Chinese / English, affecting the settings page's own text (headings, descriptions, placeholders, status hints) only; the dashboard body remained Simplified Chinese.

### Changed

- The plugin's display name changed to `Vault Dashboard` in `manifest.json`, which is what the community plugin list and the settings sidebar show; the plugin `id`, commands, and ribbon tooltip were untouched.
- The block settings area was renamed, and the matching heading in the dashboard body changed with it.
- Block rows became a three-column CSS grid (name 64px / folder path 3fr / display name 2fr), with the name and both inputs vertically centred on one row; the folder-exists hint moved from beside the input to its own line under the second input, left-aligned, so it no longer squeezes the row.

## [0.6.0] — 2026-08-24

### Added

- Blocks became configurable in settings: up to 5, each pointing at any folder path with its own display name; a block with an empty path does not appear. With two or more configured, first-level tabs appear on the dashboard for switching.
- The folder-path input validates live: a path not found in the vault shows a warning, so a typo cannot be mistaken for a working setting.

### Changed

- Blocks are no longer restricted to numbered directories under one particular folder and can point anywhere in the vault. Upgrading users kept block 1 pointed at the previous root, so nothing changed visually for them.
- The list dropped its two-level "summary / drill-down" structure for a single "selected block → that folder's subfolders as second-level tabs → note list" shape, still with an "All" tab alongside each subfolder.

## [0.5.0] — 2026-08-24

### Added

- A third appearance, "Starbucks Café": deep green primary, warm beige background, coffee-brown accents, rounded cards, soft shadows, and unhurried transitions, added as a third option in the settings dropdown.

### Changed

- Appearance names were shortened — the first became "Apple" and the second "Y2K Console". `DEFAULT_SETTINGS.appearance` remained `modern` (Apple), so existing choices were unaffected.

### Fixed

- Starbucks: the selected tab's text was invisible because a general tab-background rule of equal specificity overrode `.is-active`, turning the selected background white under pale text. The general rule was removed and the selected state now uses a solid primary fill with off-white text.
- Starbucks: heatmap cells with no activity (`level-0`) shared `#f5f1e8` with the canvas and vanished into it; `--vd-heat-0` became a deeper warm beige `#e6dac2`, keeping the flat-colour style of the rest of the scale.

## [0.4.0] — 2026-08-24

### Added

- An "Appearance" dropdown in settings, switching between the original look and a "Y2K Console" style; the choice persists and refreshes any open dashboard immediately.
- The Y2K Console style: cool plastic housing, dark control panel, orange signal controls, hard bevels, inset screens, and mechanical press states, with the same visual grammar preserved across responsive layouts.
- The Y2K Console uses a locally installed pixel font, falling back to a monospace stack when it is absent.
- The original appearance was refined into "Apple": an SF Pro Display/Text stack, 16px body text, a borderless main canvas, a frosted tab bar, light tool cards and heatmap area, generous block spacing, and a single blue interaction signal.
- Overview and Folders stayed as tabs within one main block, while the quick-access list became a separate always-visible block below, kept on screen when switching between Overview and Folders.

### Changed

- The dashboard mounts an appearance class on its root container; the default appearance was unchanged, and the old `universal` setting migrates to `y2k` automatically.

## [0.3.0] — 2026-08-24

### Added

- A quick-access block at the bottom of the Overview page, with first-level tabs for a set of category folders and second-level tabs for their subfolders (including "All").
- A "Home" tab listing the 20 most recently modified notes with their category and date.
- Note links always open in a new tab via `getLeaf("tab")` instead of taking over the dashboard pane.
- `create` / `delete` / `rename` / `modify` events inside the watched folders trigger a debounced refresh.

### Changed

- The whole visual layer was rebuilt on a token system — colour, typography, spacing, radius, and motion tokens — with dark mode given its own surface and text tokens rather than a blanket inversion.
- The heatmap moved from "primary colour plus opacity" to a five-step scale of solid colours, one set for light and one for dark.
- The selected main tab became a solid primary fill, the range switcher dropped to an outlined pill; stat cards moved to a raised surface with a hairline border and 12px radius; folder-distribution colours moved to `--vd-viz-*`, the first of which is the interface's primary colour.
- Added a unified `:focus-visible` ring, a `prefers-reduced-motion` fallback, and a 419px touch breakpoint.
- The panel background moved to a new `.vdash-stage` container — themes style `.view-content` strongly enough to override plugin rules, and mounting on a custom class avoids resorting to `!important`.

### Fixed

- The five `level-0`–`level-4` heatmap rules were missing their scope prefix, so their specificity fell below the base rule and every cell rendered at the highest level's colour.

## [0.2.1] and earlier

No records kept. This file starts at 0.3.0.
