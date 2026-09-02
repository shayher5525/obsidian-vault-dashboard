# Registro delle modifiche di Vault Dashboard X

[English](../CHANGELOG.md) · [中文](CHANGELOG_zh.md) · [日本語](CHANGELOG_ja.md) · [한국어](CHANGELOG_ko.md) · [Français](CHANGELOG_fr.md) · [Español](CHANGELOG_es.md) · **Italiano**

> Questa traduzione riassume l'essenziale di ogni versione. Per il dettaglio delle motivazioni, vedi la [versione inglese](../CHANGELOG.md).

## Versionamento

Il progetto segue il versionamento semantico (MAJOR.MINOR.PATCH).

| Parte | Quando sale | Esempio |
| --- | --- | --- |
| MAJOR | Modifica incompatibile: `data.json` o impostazioni non compatibili, migrazione manuale necessaria, funzione rimossa | Rinominare un'impostazione senza lettura di compatibilità |
| MINOR | Nuova funzione, nuovo pannello o scheda, revisione visibile di interazione o aspetto | Aggiunta dei blocchi di accesso rapido |
| PATCH | Correzione, modifica di testo, ritocco di stile — senza cambiare ciò che il plugin fa | Correggere un livello di colore sovrascritto; regolare le spaziature |

La fonte di verità della versione è `version` in `manifest.json`; il tag di rilascio è identico, senza prefisso `v`.

---

## [0.16.0] — 2026-09-02

### Aggiunto

- Nuovo aspetto **Cielo blu** (`nio`), costruito dalla spec visiva stile NIO `AA_WorkMaterial 工作资料/91_DesignFiles 设计文件/2026-09-02_蔚来风格视觉设计规范.md` v1.0 (tratta da una presentazione pubblica del manuale NIO Visual Identity System 1.4). Si prende in prestito solo la grammatica visiva: un unico accento turchese su un bianco di marca tinto di blu, tela scura Nocturnal Black, gradini di luminosità blu-verde della stessa famiglia. Nessun logo, nessun claim, nessun carattere su licenza: Blue Sky è sostituito da uno stack Montserrat / Inter / Source Han Sans. Un solo accento per schermata: Tonal Teal `#004B64` in modalità chiara (≈7,0:1 su bianco) e Teal `#00BEBE` in scura (≈8,3:1 su nero); il Teal vivo `#00BEBE` è riservato all'enfasi grafica: barre di avanzamento, picco della mappa di calore, sottolineatura scorrevole di 2px. Le grandi superfici usano Soft Blue e bianchi azzurrati, il grigio resta sul testo, gli angoli sono mediamente arrotondati (8–16px) con ombre morbide a bassa opacità, e la mappa di calore segue una sola rampa di luminosità Teal. La scheda attiva è una sottolineatura turchese di 2px; le schede di accesso rapido sono capsule bordate con stato attivo tinto di turchese.
- Il test offline guadagna quindici tutele per Cielo blu: tavolozza HEX chiusa, otto colori base dichiarati, alpha delle ombre primitive ≤ 0,30, sottolineatura della scheda principale conforme alla regola 2px, picco di calore sul Teal di marca, raggi ≤ 16px, e l'id `nio` più gli otto nomi localizzati registrati. 42/42 controlli passano.

### Modificato

- I sette README elencano ora sei temi.

## [0.15.1] — 2026-09-02

### Corretto

- Fast Food Pop, modalità chiara: i giorni senza attività erano invisibili nella mappa di calore. Il colore delle celle vuote e il fondo dietro di esse erano entrambi l'oro chiaro `#FFF4D6` — lo stesso valore, con un contrasto di 1,00:1. Le celle vuote passano al bianco: il fondo oro resta («l'oro fa la superficie») e la cella si legge come un'apertura al suo interno. La modalità scura era già distinguibile e non cambia.

## [0.15.0] — 2026-09-02

### Aggiunto

- Nuovo aspetto **Scena nera** (`sony`), costruito dalla spec visiva stile Sony `AA_WorkMaterial 工作资料/91_DesignFiles 设计文件/2026-09-02_索尼风格视觉设计规范.md` v1.0 (a sua volta tratta dal manuale d'identità Sony Electronics USA del 2007). Si prende in prestito solo la grammatica visiva: fondo nero, cornice aperta, sans-serif geometrico, un unico punto di luce colorata. Nessun logo, nessun claim, nessun carattere su licenza: ITC Avant Garde è sostituito da uno stack Poppins / Jost / Questrial / Source Han Sans. La base è nero puro `#000000`, non un nero addolcito; la profondità nasce da tre gradini di luminosità (`#000000` → `#0D0D0D` → `#1A1A1A`) e non da ombre, gli angoli sono retti (al massimo 2px sui controlli). Un solo colore d'accento per schermata: ocean `#00A4E8` in modalità scura (7,4:1 su nero) e slate `#165B65` in chiara. Il chiaro non riusa ocean perché su bianco scende a circa 2,7:1 e non regge il testo: la spec chiede di riverificare il contrasto, non di ribaltare la tavolozza scura. L'accento non riempie mai un blocco, quindi la scheda attiva è una sottolineatura scorrevole di 2px e non una pillola piena, i numeri delle schede restano neri o bianchi e i collegamenti sono l'unico testo colorato. La modalità scura è la forma canonica della spec; quella chiara segue la regola di inversione che la spec stessa detta per le pagine dense di testo.
- Il test offline guadagna cinque tutele per Scena nera, ciascuna presa da una regola vincolante della spec: tavolozza HEX chiusa, nessuna tinta con `rgba()` (i colori si usano al 100%), nessuna ombra, raggi ≤ 2px e gli otto colori base effettivamente dichiarati.

### Modificato

- I sette README elencano ora cinque temi.

## [0.14.0] — 2026-09-01

### Aggiunto

- Nuovo aspetto **Fast Food Pop** (`fastfood`), costruito dalla spec visiva stile McDonald's v1.0. Tavolozza limitata a Gold `#FFBC0D`, Red `#DB0007`, White e neutri adattati (`#1A1A1A`, `#5C5C5C`, `#E6E6E6`, `#242424`) — niente Speedee, archi né wordmark, solo la grammatica del colore. Light: White + barra Gold + testo nero, Red riservato agli stati attivi, ai dati chiave e ai picchi di calore (« l'oro fa la superficie, il rosso il punto »). Dark: `#1A1A1A` + `#242424` + Gold come accento e unica eccezione di testo oro. Gradiente di calore gold-tint → gold → red.

### Modificato

- L'aspetto `modern` rinominato **Apple → Tech minimalista** (ed equivalenti localizzati). L'id interno `modern` e la classe CSS `vdash-style-modern` non cambiano, le selezioni esistenti in `data.json` sono mantenute.
- L'aspetto `starbucks` rinominato **Starbucks Café → Casa del Caffè**. L'id interno e la classe CSS non cambiano.
- I sette README (inglese + zh/ja/ko/fr/es/it) aggiornati per elencare quattro temi e i nuovi nomi.

## [0.13.0] — 2026-09-01

### Aggiunto

- Il test offline ora protegge la gamma Starbucks: devono essere dichiarati tutti gli otto HEX standard, nessun altro HEX è ammesso e ogni colore traslucido deve derivare dall'RGB di uno degli otto colori.

### Modificato

- **L'aspetto «Starbucks Café» è stato ricostruito secondo lo standard visivo v2.0.** Le primitive sono limitate a `#006241`, `#00754A`, `#D4E9E2`, `#1E3932`, nero, `#F2F0EB`, `#F9F9F9` e bianco. Rimossi i vecchi verdi inventati, marroni caffè, beige e colori grafico estranei. I token semantici e di componente, la modalità scura, ombre e trasparenze derivano solo dalla stessa palette. Allineate anche la scala da 8px e l'altezza minima dei controlli a 44px; le celle della mappa di calore hanno nomi accessibili e supportano la tastiera quando interattive.

## [0.12.1] — 2026-09-01

### Modificato

- I testi delle impostazioni non fanno più riferimento al vault personale dell'autore. «Changelog» è ora descritto per destinatari e metodo di conteggio. Ripuliti anche tre commenti nel codice con lo stesso presupposto: il plugin non ha una fase di build, quindi `main.js` è ciò che gli utenti leggono.
- Aggiunti changelog tradotti in `docs/`, uno per ogni lingua dei README e collegati da ciascuno. Il `CHANGELOG.md` nella radice è ora in inglese.

## [0.12.0] — 2026-09-01

### Modificato

- **`useMtime` è ora attivo per impostazione predefinita.** Nella maggior parte dei vault le note non hanno né una data nel frontmatter né una nel nome file: disattivato, la mappa di calore resta quasi vuota e un'installazione nuova mostra una pagina bianca. Un falso picco dovuto alla sincronizzazione, invece, si vede, si spiega e si può disattivare. **Le configurazioni esistenti non cambiano.**
- Con un solo blocco configurato il titolo diventa «Accesso rapido · nome del blocco». Prima, con un blocco unico non venivano disegnate schede di primo livello e il nome di quella cartella non compariva da nessuna parte.

## [0.11.0] — 2026-09-01

### Aggiunto

- Pulsanti «Seleziona tutto» e «Deseleziona tutto» nel selettore delle sottocartelle.

### Modificato

- I README tradotti sono stati spostati in `docs/`; nella radice resta solo l'inglese. Tutti i README sono stati aggiornati.

## [0.10.0] — 2026-09-01

### Aggiunto

- Sotto il percorso di ogni blocco di accesso rapido vengono elencate le sue sottocartelle dirette con caselle che decidono quali diventano schede di secondo livello. Selezionandole tutte, quelle aggiunte in seguito compaiono automaticamente.
- Il selettore sta in un pannello `<details>` chiuso per impostazione predefinita, con un riepilogo che indica «Tutte (N)» oppure «n di N selezionate».

### Modificato

- **I nomi delle cartelle non vengono più privati del prefisso numerico: si mostra il nome completo.** Il trattamento precedente seguiva la convenzione di denominazione dell'autore; per gli altri, `2024_Q1 Reports` diventava `Reports` — spariva non solo il numero ma anche la prima parola. Per un nome breve, scrivilo in «Nome visualizzato».
- Pagina delle impostazioni: l'area di accesso rapido è allineata a sinistra con il titolo e con le righe di impostazione native.

## [0.9.0] — 2026-08-29

### Aggiunto

- Anche l'aspetto Starbucks usa l'evidenziazione scorrevole.
- La barra di navigazione superiore diventa vetro smerigliato (`backdrop-filter`). È sticky: il contenuto scorre sotto, ed è questo a dare senso alla sfocatura.

### Modificato

- **La mappa di calore è invertita: da sinistra a destra, dal più recente al più vecchio.** Quando è più larga del contenitore, la barra di scorrimento a sinistra mostra già i dati recenti.
- La parte superiore della barra di navigazione è sigillata: scorrendo non affiora più contenuto sopra di essa.

### Corretto

- Il colore del testo non cambia più prima che arrivi il cursore quando si cambia scheda. Prima il testo bianco restava circa 0,2 s su fondo bianco, illeggibile.

## [0.8.1] — 2026-08-29

### Modificato

- `column-gap` e `row-gap` della griglia uniti in `gap`, evitando un falso positivo del lint CSS della directory della community.

## [0.8.0] — 2026-08-29

### Aggiunto

- Lingue dell'interfaccia da 3 a 8 (aggiunti francese, italiano, giapponese, coreano e spagnolo; tutte e 63 le stringhe presenti in ogni lingua).
- Evidenziazione scorrevole su quattro gruppi di schede. Disattivata automaticamente con `prefers-reduced-motion: reduce`.

### Modificato

- «Cartelle visive» rinominato «Accesso rapido» in tutte e 8 le lingue.
- Aspetto Apple rivisto: mappa di calore e accesso rapido su fondo bianco con angoli arrotondati e bordo sottile; spaziature più compatte; schede senza contorno né anello di selezione.

### Corretto

- Lo sfondo proprio delle schede copriva il cursore durante lo spostamento.
- Modificare `excludedPrefixes` non aggiornava il totale delle note.

## [0.7.1] — 2026-08-26

### Corretto

- **Due regole di `styles.css` danneggiate da una riscrittura massiva con espressioni regolari.** Per questo le transizioni e gli stili `:hover` delle schede non avevano mai funzionato.

### Modificato

- Il flusso di rilascio produce attestazioni degli artefatti e note di rilascio automatiche; aggiunto `package-lock.json`.

## [0.7.0] — 2026-08-24

### Aggiunto

- Selettore di lingua nelle impostazioni (allora limitato alla pagina delle impostazioni).

### Modificato

- Il nome visualizzato del plugin diventa `Vault Dashboard`; l'area delle impostazioni dei blocchi passa a una griglia a tre colonne.

## [0.6.0] — 2026-08-24

### Aggiunto

- I blocchi diventano configurabili: fino a 5, ciascuno rivolto a una cartella qualsiasi con il proprio nome visualizzato. Il percorso viene convalidato durante la digitazione.

### Modificato

- L'elenco adotta una struttura unica: blocco selezionato → schede delle sue sottocartelle → elenco delle note.

## [0.5.0] — 2026-08-24

### Aggiunto

- Terzo aspetto, «Caffè Starbucks».

### Modificato

- Nomi degli aspetti abbreviati in «Apple» e «Console Y2K» (il valore predefinito non cambia).

### Corretto

- In Starbucks il testo della scheda selezionata era invisibile e le celle senza attività si confondevano con lo sfondo.

## [0.4.0] — 2026-08-24

### Aggiunto

- Selettore di aspetto nelle impostazioni e nuovo aspetto «Console Y2K»; anche l'aspetto originale è stato rielaborato.

### Modificato

- Una classe di aspetto viene applicata all'elemento radice; la vecchia impostazione `universal` migra automaticamente a `y2k`.

## [0.3.0] — 2026-08-24

### Aggiunto

- Blocco di accesso rapido in fondo alla panoramica. I collegamenti alle note si aprono sempre in una nuova scheda.

### Modificato

- Rifacimento completo dell'aspetto su un sistema di token; mappa di calore portata a una scala di cinque colori pieni.

### Corretto

- Alle cinque regole di livello della mappa di calore mancava il prefisso di ambito, così tutte le celle venivano disegnate con il colore del livello più alto.

## [0.2.1] e precedenti

Nessun registro conservato. Questo file parte dalla 0.3.0.
