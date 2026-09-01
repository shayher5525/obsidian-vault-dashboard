# Vault Dashboard X

[English](../README.md) · [中文](README_zh.md) · **Italiano** · [日本語](README_ja.md) · [한국어](README_ko.md) · [Français](README_fr.md) · [Español](README_es.md)

Una dashboard per il tuo vault di Obsidian: una mappa di calore dell'attività, una vista della distribuzione per cartelle e collegamenti di accesso rapido configurabili — tutto in un unico pannello.

## Funzionalità

- **Mappa di calore dell'attività** — una griglia di contributi in stile GitHub che mostra quanto è attivo il tuo vault (o un changelog) nel tempo, con gli intervalli `Tutto / 30 giorni / 7 giorni`. Le settimane più recenti sono a sinistra.
- **Distribuzione per cartelle** — una ripartizione delle tue note per cartella di primo livello, con righe espandibili, barre della quota rispetto alla cartella padre e conteggi «nuove questo mese».
- **Accesso rapido** — fino a 5 blocchi configurabili. Ognuno punta a una cartella, ne elenca le note modificate più di recente e mostra come schede di secondo livello le sottocartelle che selezioni. I nomi delle cartelle sono mostrati così come sono.
- **Due fonti di dati** — una fonte generica «attività delle note» (funziona in qualsiasi vault) e un parser «changelog» opzionale per i changelog Markdown.
- **Quattro temi** — Tech minimalista, Console Y2K, Casa del Caffè e Fast Food Pop.
- **Internazionalizzazione** — inglese (predefinito), cinese semplificato, cinese tradizionale, giapponese, coreano, francese, spagnolo e italiano.

## Fonti di dati

### Attività delle note (predefinita)

Ogni nota contribuisce con un «giorno di attività», risolto con questa catena di fallback:

1. Il campo `updated` del frontmatter (il nome del campo è configurabile).
2. `created` / `date` del frontmatter.
3. Un prefisso `YYYY-MM-DD` nel nome del file.
4. L'ora di modifica del file (`mtime`) — **attiva per impostazione predefinita**. Nella maggior parte dei vault le note non hanno né una data nel frontmatter né una nel nome file; senza questo ripiego la mappa di calore resterebbe quasi vuota. Se un servizio di sincronizzazione aggiorna in blocco le date e crea un falso picco, disattivala nelle impostazioni.

L'attività delle note funziona subito in qualsiasi vault, senza configurazione aggiuntiva.

### Changelog

Conta le voci di uno o più file di changelog. Un parser legge le sezioni `## YYYY-MM-DD` e conta gli elementi di elenco di primo livello sotto ogni data:

```markdown
## 2026-08-23

- Pubblicare il rapporto di luglio
- Correggere un refuso nella guida di stile

> Nota: le citazioni sotto una sezione di data vengono ignorate.
```

Ogni file può essere una singola nota o una cartella (tutti i file `.md` al suo interno, non ricorsivo).

## Utilizzo

Apri la dashboard dall'icona della barra multifunzione o dal comando **«Apri dashboard»**.

- Scheda **Panoramica** — mappa di calore e schede di riepilogo.
- Scheda **Cartelle** — distribuzione per cartelle.
- Fai clic su una cella della mappa di calore del changelog per passare alla sezione di quel giorno (solo in modalità changelog).
- Fai clic su una riga di cartella per approfondire.

## Impostazioni

| Impostazione | Descrizione |
| --- | --- |
| Lingua | Lingua dell'interfaccia per la pagina delle impostazioni e la dashboard. |
| Aspetto | Stile visivo: Tech minimalista, Console Y2K, Casa del Caffè o Fast Food Pop. |
| Fonte dati attività | Attività delle note o Changelog. |
| Campo data attività | Campo del frontmatter usato per primo nella catena di fallback dell'attività delle note. |
| Ripiega sull'ora di modifica del file | Usare `mtime` come ultimo fallback (attivo per impostazione predefinita). |
| Percorsi changelog | File/cartelle analizzati in modalità changelog. |
| Accesso rapido | Fino a 5 blocchi; ognuno punta a una cartella ed elenca le sue note recenti. |
| Sottocartelle da mostrare | Per blocco: seleziona quali sottocartelle diventano schede di secondo livello. Selezionandole tutte, quelle aggiunte in seguito compaiono automaticamente. |

## Installazione

### Dalla directory della community (una volta pubblicato)

Installa «Vault Dashboard X» da **Impostazioni → Plugin della community**, quindi attivalo.

### Manuale

1. Scarica `main.js`, `manifest.json` e `styles.css` dall'ultima versione.
2. Crea `.obsidian/plugins/vault-dashboard-x/` nel tuo vault.
3. Copia i tre file in quella cartella.
4. Attiva il plugin in **Impostazioni → Plugin della community**.

## Registro delle modifiche

[Registro completo](CHANGELOG_it.md) — cosa è cambiato in ogni versione e perché.

## Licenza

[GNU General Public License v3.0](../LICENSE)

## Sviluppo

**Non c'è alcun passaggio di build** — `main.js` è l'artefatto del plugin. Dopo la modifica, disattiva e riattiva il plugin (o esegui `Reload app`) in Obsidian per applicare le modifiche.

- Incrementa le versioni con `npm version <patch|minor|major>`; sincronizza automaticamente `manifest.json` e `versions.json`.
- Esegui i controlli di integrità del livello dati offline con `node test/harness.js`.

Il tag di rilascio **deve essere uguale** alla `version` in `manifest.json`, senza prefisso `v`; `main.js`, `manifest.json` e `styles.css` vengono allegati come asset di rilascio separati.
