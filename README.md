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

## Sviluppo

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # test unitari
npm run check    # controllo tipi
```
