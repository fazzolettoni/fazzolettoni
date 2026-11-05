# Fazzolettoni — Specifica

> Documento di lavoro. Raccoglie le decisioni prese e le questioni aperte.
> Ultimo aggiornamento: 2026-11-05.

## 1. Obiettivo

Un portale open, in stile wiki, per raccogliere e documentare i fazzolettoni dei gruppi scout italiani.

- Chiunque si registri può creare e modificare gruppi e fazzolettoni.
- Ogni modifica resta nello storico e si può annullare.
- I fazzolettoni sono descritti in modo **parametrico**, non disegnati a mano. Dalla descrizione il sistema genera **SVG** e **PNG** e, in futuro, un modello **3D**.
- Si parte da AGESCI, ma il modello dati è multi-associazione fin dall'inizio (AGESCI, CNGEI, FSE, ASCI/AGI storiche…).

### Fonti di riferimento

- **Raccolta AGESCI Sicilia**: <https://sicilia.agesci.it/fazzolettoni/>. Circa 60-80 gruppi, con foto e campi semi-strutturati. È il caso studio principale per lo schema.
- **ScoutWiki italiano**: oltre 500 pagine che usano `Template:Gruppo_AGESCI`. Il fazzolettone è descritto nel campo `colori` a testo libero (es. "Azzurro con banda bianca").

---

## 2. Principi

1. **Il fazzolettone è l'unità principale.** Il gruppo è il suo contenitore.
2. **"Non lo so" è una risposta valida.** Ogni campo descrittivo può valere _sconosciuto_, e il renderer usa valori di default marcando l'immagine come _approssimata_.
3. **Ogni dato ha una fonte.** Quando le fonti sono in conflitto, il conflitto si mostra invece di risolverlo in silenzio.
4. **Lo storico non si cancella.** Un rollback crea una nuova revisione, non riscrive il passato.
5. **Niente dati personali.** Non si importano né si chiedono nomi di capi, contatti privati o foto di persone.
6. **Costo zero all'inizio**, con una strada chiara per crescere.

---

## 3. Modello dati

### 3.1 Associazione

| Campo     | Note                                                     |
| --------- | -------------------------------------------------------- |
| `sigla`   | `agesci`, `cngei`, `fse`, `asci`, `agi`… Usata negli URL |
| `nome`    | Nome esteso                                              |
| `periodo` | Data di inizio e fine (es. ASCI → 1974)                  |

### 3.2 Gruppo

| Campo          | Note                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| `associazione` | Riferimento                                                                     |
| `nome`         | Es. "Rosolini 1". Si salvano anche `località` e `numero` separati, per ordinare |
| `regione`      |                                                                                 |
| `zona`         | Testo. _Aperta:_ le zone cambiano nel tempo, vedi §11                           |
| `stato`        | `attivo` / `non più attivo`                                                     |
| `link`         | Lista di `{tipo, url}`: `scoutwiki`, `sito`, `facebook`, `instagram`, `altro`   |
| `slug`         | Generato, es. `rosolini-1`                                                      |

L'**identità** di un gruppo è data da associazione + nome: "Giarre 1" AGESCI e "Giarre 1" CNGEI sono due gruppi diversi.

### 3.3 Fazzolettone

| Campo                      | Note                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `gruppo`                   | Riferimento                                                                              |
| `data_inizio`, `data_fine` | **Date parziali** (vedi sotto). Se `data_fine` è vuota, il fazzolettone è quello attuale |
| `design`                   | Descrizione parametrica (§4)                                                             |
| `significato`              | Testo libero: storia e significato dei colori                                            |
| `fonti`                    | Lista di fonti (§3.6)                                                                    |
| `foto`                     | Foto di riferimento (§3.5)                                                               |
| `affidabilità`             | `verificato` / `da verificare` / `importato`                                             |

**Date parziali:** `{ anno, mese?, giorno?, circa: bool }` oppure `null` (sconosciuta). Esempi: "1974", "circa 1980", "marzo 1996".

### 3.4 Asset (loghi, toppe, stemmi)

Caricati dagli utenti e riutilizzabili su più fazzolettoni.

| Campo                 | Note                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `file`                | SVG (preferito) o PNG con sfondo trasparente                                                        |
| `versione`            | **I file non si modificano mai.** Un nuovo upload crea una nuova versione collegata alla precedente |
| `caricato_da`, `data` |                                                                                                     |
| `autore_fonte`        | Chi l'ha disegnato o da dove viene                                                                  |
| `licenza`             | CC BY 4.0, obbligatoria (§7)                                                                        |
| `usato_da`            | Fazzolettoni che lo usano (calcolato)                                                               |

- Ogni revisione di un fazzolettone punta a una **versione precisa** dell'asset, così lo storico resta riproducibile.
- **Gli SVG caricati vanno sanitizzati** (rimozione di script, link esterni, `foreignObject`…).
- Non si accettano emblemi registrati delle associazioni (es. il logo AGESCI), solo loghi e toppe dei gruppi.
- _Proposto, da confermare:_ il versioning degli asset.

### 3.5 Foto di riferimento

- **Solo fazzolettoni aperti e stesi.** Niente persone, niente fazzolettoni indossati o arrotolati.
- Licenza CC BY 4.0, con dichiarazione di chi carica.
- Servono come fonte e per il contagocce dei colori. Non sono il contenuto principale.
- Pulsante "segnala" e rimozione da parte dei moderatori.

### 3.6 Fonte

`{ tipo, url?, nota? }`, dove `tipo` vale `scoutwiki`, `agesci-sicilia`, `conoscenza diretta`, `foto`, `documento`…

La **provenienza è tracciata per campo**: ogni campo del design può puntare alla sua fonte. Due fonti che danno valori diversi per lo stesso campo generano un **conflitto** visibile in pagina, finché un utente non lo risolve.

> Esempio reale, Rosolini 1: per la Sicilia la prima fettuccia è _blu_, per ScoutWiki è _azzurra_.

---

## 4. Descrizione parametrica (`design`)

Prima bozza, da validare su 8-10 casi reali (§10, fase 0). Ogni campo può essere `null`, cioè sconosciuto.

```jsonc
{
	"forma": "triangolo", // "triangolo" | "quadrato"
	"dimensioni_mm": null, // triangolo: { "cateto": 700 } — quadrato: { "lato": 700 }
	"fronte": {/* Faccia */},
	"retro": null // solo per "quadrato"; nel triangolo il retro è il solo colore di fondo
}
```

### Forme

- **Triangolo** (il caso di gran lunga più comune): triangolo isoscele. Il fronte è decorato e il **retro mostra solo il colore di fondo**. Lati: `corto_sx`, `corto_dx`, `lungo`.
- **Quadrato**: si piega in diagonale quando si indossa. **Fronte e retro sono indipendenti.** Lati: `alto`, `destra`, `basso`, `sinistra`.

### Faccia

```jsonc
{
	"fondo": {
		"tipo": "tinta_unita", // "tinta_unita" | "diviso" | "fantasia"
		"colori": [/* Colore */], // 1 per tinta unita, 2 per diviso (sx, dx)
		"fantasia": null // rimandato: riferimento a un asset/pattern
	},
	"fettucce": [/* Fettuccia */],
	"elementi": [/* Elemento */]
}
```

### Colore

```jsonc
{ "hex": "#4FA3D9", "nome": "azzurro", "approssimato": false }
```

- L'utente sceglie il colore esadecimale (con il color picker o il contagocce su una foto) e scrive **il nome che il gruppo usa davvero**, come stringa libera.
- Il sistema calcola in silenzio una **famiglia cromatica** dal colore esadecimale (blu, rosso, verde…), usata solo per la ricerca. Così "tutti i fazzolettoni blu" trova anche azzurro, celeste e blu notte.
- Per i dati importati che hanno solo il nome, un piccolo dizionario dà un colore esadecimale indicativo con `approssimato: true`.

### Fettuccia

```jsonc
{
	"colori": [/* Colore */], // più colori = fettuccia bicolore/tricolore a strisce longitudinali
	"larghezza_mm": 25,
	"distanza_bordo_mm": 0, // 0 = "bordato"; > 0 = "sarchiato"; "adiacente" = subito dentro la precedente
	"lati": ["corto_sx", "corto_dx"],
	"tratto": null, // fettuccia parziale: { "da_mm": 20, "a_mm": 100 } misurati dal vertice
	"incrocio": null // "angolo" (unghiatura a 45°) | "incrociato" (prosegue dritta e si sovrappone): da confermare (§11)
}
```

- **Ordine dell'array = ordine di disegno**: la prima fettuccia sta sotto, l'ultima sopra. Le posizioni sono assolute (`distanza_bordo_mm`) oppure `"adiacente"`, che serve quando le larghezze sono sconosciute ma si sa che le fettucce si toccano (Gibellina 1). Fettucce adiacenti, distanziate e sovrapposte sono tutte esprimibili.
- Una fettuccia multicolore è divisa in parti uguali, dall'esterno verso l'interno.
- Le fettucce funzionano come **livelli**: possono coprirsi a vicenda (es. Belpasso 2, la rossa copre la bianca agli angoli). Nell'editor andranno gestite come una lista di livelli riordinabili, come in un programma di grafica.
- Casi coperti dalla raccolta siciliana: una sola fettuccia; 2-5 fettucce adiacenti (Rosolini 1, Gibellina 1); fettucce sovrapposte (Catania 19); bordo su tutti e quattro i lati (Belpasso 2); fettucce tricolori (Catania 13); strisce parziali (Augusta 4).

### Resa dei valori sconosciuti

- Colore sconosciuto → **tratteggio grigio**, per non confonderlo con un grigio vero.
- Larghezza sconosciuta → 25 mm. Posizione sconosciuta → sul bordo la prima, adiacente le altre. Lati sconosciuti → i lati corti (triangolo) o tutti e quattro (quadrato).
- Il renderer restituisce, insieme all'SVG, l'elenco degli **avvisi**: tutto quello che ha dedotto o approssimato. Se la lista è vuota, il disegno è fedele alla descrizione.

### Elemento

```jsonc
{
	"tipo": "logo", // "logo" | "toppa" | "scritta"
	"asset": "asset-id@versione", // per logo/toppa
	"testo": null, // per scritta
	"posizione": { "x": 0.5, "y": 0.2 }, // coordinate normalizzate 0–1 sulla faccia
	"scala": 0.3,
	"rotazione": 0
}
```

---

## 5. URL

Gli URL devono essere **leggibili e stabili**, perché verranno linkati da ScoutWiki, dai siti dei gruppi e dai social.

| URL                                            | Contenuto                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/agesci/sicilia/rosolini-1`                   | Pagina del gruppo: **fazzolettone attuale** in evidenza, linea del tempo con i precedenti |
| `/agesci/sicilia/rosolini-1/1974-1996`         | Un fazzolettone storico                                                                   |
| `/agesci/sicilia/rosolini-1/1974-1996/storia`  | Storico delle revisioni                                                                   |
| `/agesci/sicilia/rosolini-1/1974-1996?rev=123` | Una revisione specifica                                                                   |
| `/agesci/sicilia/rosolini-1.svg`, `.png`       | Export del fazzolettone attuale                                                           |

Regole:

- Lo slug del periodo si deriva dalle date: `1974-1996`, `circa-1980-1996`. Se le date sono sconosciute si usa un progressivo (`/2`).
- **Il fazzolettone attuale non ha uno slug di periodo**, perché la sua data di fine non è ancora nota. Quando viene sostituito riceve il suo (`/1996-2031`).
- **Ogni slug usato in passato resta valido come redirect.** Correggere una data, rinominare un gruppo o cambiarne la regione non rompe i link. Serve una tabella `slug_storici`.
- Dietro ogni slug c'è un ID stabile, che è quello usato internamente.

---

## 6. Wiki: revisioni e moderazione

### Revisioni

Gruppi e fazzolettoni hanno una tabella di revisioni **append-only**:

| Campo                  | Note                   |
| ---------------------- | ---------------------- |
| `id`                   |                        |
| `entità`, `entità_id`  | gruppo / fazzolettone  |
| `dati`                 | Snapshot JSON completo |
| `autore`, `data`       |                        |
| `commento`             | Facoltativo, suggerito |
| `revisione_precedente` |                        |

- L'entità punta alla revisione corrente.
- **Diff** leggibile tra due revisioni (es. "fettuccia 1: colore da _blu_ ad _azzurro_").
- **Rollback** = una nuova revisione che copia una precedente.

### Ruoli

| Ruolo             | Può                                                                      |
| ----------------- | ------------------------------------------------------------------------ |
| Utente registrato | Creare e modificare gruppi, fazzolettoni, asset e foto                   |
| Moderatore        | Rollback, ban, rimozione di asset e foto, risoluzione delle segnalazioni |
| Amministratore    | Gestione dei ruoli e della configurazione                                |

### Anti-vandalismo

- Registrazione con verifica dell'email.
- Limite di modifiche e upload per i nuovi utenti.
- "Annulla tutte le modifiche di questo utente" per i moderatori.
- **Osservati speciali**: chi segue un gruppo riceve una notifica quando la sua pagina cambia. _(dopo il PoC)_

---

## 7. Licenze

| Cosa                           | Licenza                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Immagini generate (SVG/PNG/3D) | **CC BY 4.0**                                                                                                      |
| Dati strutturati               | CC BY 4.0                                                                                                          |
| Foto e asset caricati          | **CC BY 4.0 obbligatoria**, con dichiarazione di chi carica ("ho i diritti" oppure "il gruppo ne autorizza l'uso") |
| Codice                         | _Da decidere_ (MIT o AGPL)                                                                                         |

- Un fazzolettone senza asset è sempre interamente CC BY. Se un asset viene rimosso, il disegno resta valido senza di esso.
- **Import da fonti esterne:** si importano solo _fatti_ (colori, struttura, date) più il link alla fonte. I testi di ScoutWiki (probabilmente CC BY-SA) **non si copiano**, perché imporrebbero BY-SA. Si riscrivono o si linkano.

---

## 8. Import

### AGESCI Sicilia (proof of concept)

- Si importano i dati strutturati della tabella, **senza foto**.
- Il PoC resta **non pubblico** (in locale o con un deploy protetto da password) e viene mostrato al centro studi AGESCI Sicilia per chiedere il permesso.
- Se lo danno, il PoC si apre. Altrimenti i dati importati si cancellano.
- ✅ Fatto (`/sicilia`): `scripts/sicilia/estrai.py` legge la pagina e salva `data/sicilia/grezzi.json`; `src/lib/import/` unisce e converte. 101 fazzolettoni: 79 convertiti senza dubbi, 30 descrizioni libere interpretate a mano (`sicilia-manuali.ts`, con nota visibile), 22 da rivedere.
- **La pagina ha due tabelle** con gli stessi gruppi e valori a volte diversi: si uniscono campo per campo, "dettagli" come fonte principale, e i disaccordi diventano conflitti visibili (20 gruppi).
- Identità del gruppo = associazione + nome, confermato dai dati: "Palermo 6" esiste sia AGESCI sia FSE, "Messina 1" e "Giarre 1" sia AGESCI sia CNGEI.
- Domande da portare ad AGESCI Sicilia:
  - cosa significa "Presenza sui lati corti: No";
  - "destra/sinistra" sono viste da chi guarda o da chi indossa;
  - cosa si intende con "bordura doppia".

### ScoutWiki (dopo)

- Prima serve il **permesso degli amministratori** (il sito ha una protezione anti-bot). Va chiesto se si può usare l'API o un dump.
- Flusso: estrazione del campo `colori` e dei metadati del gruppo → conversione in `design` con un LLM, con i campi incerti a `null` → bozze con `affidabilità: importato` e il link alla pagina di origine.
- Campi del template da **non** importare: `capigruppo` (dati personali).

---

## 9. Stack e costi

| Pezzo             | Scelta                                                      | Costo         |
| ----------------- | ----------------------------------------------------------- | ------------- |
| Frontend + SSR    | **SvelteKit**                                               | —             |
| Hosting           | Cloudflare Pages o Vercel Hobby                             | gratis        |
| DB, auth, storage | **Supabase** free tier (Postgres 500 MB, storage 1 GB)      | gratis*       |
| Email di login    | Resend free tier, oppure login con Google                   | gratis        |
| Renderer          | Modulo TypeScript condiviso `design → SVG`                  | —             |
| PNG               | Nel browser (SVG → canvas); sul server con `resvg` se serve | gratis        |
| Dominio           |                                                             | ~10–15 €/anno |

\* Un progetto Supabase free va in pausa dopo 7 giorni senza attività. Si evita con un ping periodico (es. GitHub Actions).

**Come si cresce:** Supabase Pro (~25 $/mese) oppure un VPS (~5 €/mese) con lo stesso Postgres. Non c'è lock-in.

---

## 10. Roadmap

- **Fase 0: schema e renderer.** ✅ Prima versione fatta (`src/lib/design/`, galleria in `/`). Schema TypeScript/JSON del `design`, renderer SVG, pagina di prova con 8-10 casi reali: Venezia 2, Rosolini 1, Gibellina 1, Belpasso 2, Solarino 8, Vicari 1, Augusta 4, Catania 19, Siracusa 14 (quadrato), Castellammare 1.
- **Fase 1: PoC AGESCI Sicilia (privato).** Editor visuale ✅ prima versione (`/editor`). Import della tabella siciliana, pagine di gruppo e fazzolettone, editor con anteprima live, registrazione, revisioni e rollback, export SVG/PNG.
  Backend ✅ prima versione, in locale con Docker:
  - accesso via email (magic link), profili con nome pubblico, ruoli;
  - revisioni append-only, diff leggibili, ripristino, URL stabili con redirect;
  - moderazione: sospensione, "annulla tutte le modifiche di un utente", ruoli;
  - le 101 schede siciliane caricate come revisioni "import";
  - `npm run verifica:permessi` controlla le regole di accesso.
- **Fase 2: apertura.** Permesso da AGESCI Sicilia, deploy pubblico, asset e foto caricabili, ruoli di moderazione.
- **Fase 3: ScoutWiki.** Permesso, import AGESCI nazionale come bozze, gestione dei conflitti tra fonti.
- **Dopo:** fantasie (tartan ecc.), osservati speciali, dataset aperto scaricabile, altre associazioni, 3D.

---

## 11. Questioni aperte

- [ ] **Incrocio delle fettucce agli angoli**: cosa significa esattamente "incrociato" nella raccolta siciliana? Quali varianti esistono (sopra/sotto, intrecciato, tagliato a 45°)?
- [ ] **Fantasie**: come rappresentare tartan e motivi. Pattern parametrico o immagine caricata?
- [ ] **Zone nel tempo**: basta un campo testuale o serve uno storico delle zone?
- [ ] **Versioning degli asset**: proposto (file immutabili + versioni), da confermare.
- [x] **Dimensioni standard**: 70 cm di cateto (lato lungo ≈ 99 cm), confermato dalla raccolta siciliana, dove "70 cm" è il lato corto di gran lunga più frequente (valori tra 45 e 115 cm). Per il quadrato 70 cm di lato resta provvisorio. Il default conta perché le fettucce sono in misure assolute: una fettuccia da 2,5 cm su un fazzolettone più piccolo appare più spessa.
- [x] **Unità di misura**: tutto in **mm** nei dati, tutto in **cm** (con decimali) nell'interfaccia, perché le fonti usano i cm ("0,4 cm", "2,5 cm").
- [ ] **Bicolore diviso**: la divisione è sempre lungo l'altezza dal vertice (sinistra/destra) o ci sono altre varianti?
- [ ] **Posizione e livello sono accoppiati**: "adiacente" si riferisce alla fettuccia precedente _nella lista dei livelli_. Quando una fettuccia interna deve stare sopra una esterna (Siracusa 13, Palermo 6: "rossa su gialla"), bisogna usare distanze assolute. Valutare un riferimento esplicito ("adiacente a fettuccia X") o separare ordine di disegno e ordine dall'esterno.
- [ ] **Fettucce a fantasia** (Trapani 6: fettuccia "tema scozzese"): oggi non rappresentabili.
- [ ] **Chi può ripristinare**: oggi qualunque utente registrato (come in una wiki); sospensione e annullamento in blocco sono dei moderatori. Da confermare.
- [ ] **URL del fazzolettone attuale**: oggi ogni fazzolettone ha uno slug di periodo (`dal-1996`, oppure `1` se le date sono ignote) e la pagina del gruppo mostra quello in uso. Quando gli si aggiunge la data di fine, l'URL cambia e il vecchio resta come redirect.
- [ ] **Licenza del codice**: MIT o AGPL.
- [ ] **Nome e dominio del progetto.**
