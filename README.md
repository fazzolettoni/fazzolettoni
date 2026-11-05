# Fazzolettoni

Portale open, in stile wiki, per raccogliere i fazzolettoni dei gruppi scout italiani.
Specifica e decisioni: [SPEC.md](SPEC.md).

## Stato: fase 0 + editor visuale

Schema parametrico e renderer SVG, provati su 12 casi reali (AGESCI Sicilia e ScoutWiki).

- `src/lib/design/schema.ts`: tipi del design (forma, fondo, fettucce, elementi)
- `src/lib/design/geometria.ts`: sagome e calcoli geometrici (rientri, bande, tratti)
- `src/lib/design/render.ts`: `design → SVG` + elenco degli avvisi
- `src/lib/design/esempi.ts`: casi reali trascritti (da verificare sulle fonti)
- `src/lib/design/export.ts`: download SVG e PNG dal browser
- `src/routes/+page.svelte`: galleria con editor JSON live
- `src/routes/editor/`: editor visuale (`/editor`, oppure `/editor?da=<id-esempio>`), con anteprima live, fettucce come livelli riordinabili, bozza salvata nel browser
- `src/lib/components/editor/`: componenti dell'editor (colore, misura in cm, fettuccia, livelli, elementi, faccia)
- `scripts/sicilia/estrai.py` → `data/sicilia/grezzi.json` → `src/lib/import/`: import della raccolta AGESCI Sicilia, visibile in `/sicilia` (dati per il PoC privato, non pubblicare)

## Backend (Supabase)

- `supabase/migrations/`: tabelle, regole di accesso e funzioni. Lo storico è append-only: ogni modifica, compreso un ripristino, è una nuova riga in `revisioni`. Si scrive solo tramite funzioni (`salva_gruppo`, `salva_fazzolettone`, `ripristina`, `imposta_ban`, `annulla_utente`…), mai direttamente nelle tabelle.
- `src/hooks.server.ts`, `src/lib/supabase/`: client, tipi e letture comuni.
- Pagine: `/` gruppi, `/<associazione>/<regione>/<gruppo>` (fazzolettone attuale e precedenti), `…/<periodo>` (un fazzolettone, `?rev=` per una versione passata), `…/storia`, `…/modifica`, `/nuovo-gruppo`, `/modifiche`, `/moderazione`, `/accedi`, `/profilo`.
- Gli URL vecchi (gruppo rinominato, date corrette) restano validi come redirect (`slug_storici`).

## Sviluppo

Serve Docker Desktop avviato.

```sh
npm install
npm run db:avvia                 # database locale (il primo avvio scarica le immagini)
cp .env.example .env.local       # poi incolla i valori di: npx supabase status -o env
npm run seed:sicilia             # carica le schede siciliane (richiede data/sicilia/grezzi.json)
npm run dev                      # http://localhost:5173
```

Le email di accesso in locale non partono: si leggono su http://127.0.0.1:54324. Dopo il primo accesso:

```sh
npm run ruolo -- tua@email.it amministratore
```

Altri comandi:

```sh
npm run db:reset                 # ricrea il database da zero (cancella anche gli utenti)
npm run verifica:permessi        # controlla le regole di accesso sul database locale
npm test         # test unitari
npm run check    # controllo tipi
```

I dati siciliani (`data/sicilia/grezzi.json`) **non sono nel repository**, finché AGESCI Sicilia non dà il permesso. Senza quel file `/sicilia`, l'editor e i test non partono. Per generarlo:

```sh
curl -sL -o /tmp/sicilia.html https://sicilia.agesci.it/fazzolettoni/
python3 -I scripts/sicilia/estrai.py /tmp/sicilia.html data/sicilia/grezzi.json
```
