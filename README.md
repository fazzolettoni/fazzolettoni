# Fazzolettoni

Archivio aperto dei fazzolettoni dei gruppi scout italiani: colori, fettucce, simboli e la loro
storia nel tempo. Progetto volontario e senza scopo di lucro.

**Sito: https://fazzolettoni.vercel.app** · Contatti: archiviofazzolettoni@gmail.com

Ogni fazzolettone è descritto con dei parametri (forma, fondo, fettucce, loghi e toppe), non
con una foto: da quella descrizione il sito disegna l'immagine, la scarica in SVG e PNG e la
mostra indossata in 3D. Chiunque si iscriva può aggiungere e correggere gruppi e fazzolettoni,
come in una wiki: ogni modifica resta nello storico e si può ripristinare.

## Come contribuire

Puoi contribuire al progetto in diversi modi:

- **Nuove informazioni** (gruppi, fazzolettoni, correzioni): collegati a
  https://fazzolettoni.vercel.app, e dopo la registrazione potrai creare nuove voci o modificare
  quelle esistenti.
- **Segnalazioni di bug o suggerimenti di nuove funzionalità**: usa le
  [Issues](https://github.com/fazzolettoni/fazzolettoni/issues) per segnalare cose che non funzionano o
  suggerire nuove funzionalità. Non usare le issue per domande tecniche o errori sui dati (colori
  dei fazzolettoni, date, eccetera): per quelli usa le discussioni, vedi il prossimo punto.
- **Segnalazioni sulle informazioni nella piattaforma, discussioni su come migliorarle,
  domande**: usa le [Discussions](https://github.com/fazzolettoni/fazzolettoni/discussions).
- **Codice**: le pull request sono benvenute. Le scelte di progetto sono in [SPEC.md](SPEC.md).

## Come è fatto

- [SvelteKit](https://svelte.dev) (Svelte 5, TypeScript), pubblicato su Vercel.
- [Supabase](https://supabase.com): database Postgres, accesso con link via email, storage
  delle immagini.
- [three.js](https://threejs.org) per la vista 3D.

| Cartella                      | Contenuto                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `src/lib/design/`             | schema parametrico, geometria, renderer `design → SVG` (con l'elenco degli avvisi), esempi |
| `src/lib/tre/`                | modello 3D e texture generate dal disegno                                                  |
| `src/lib/components/`         | componenti delle pagine e dell'editor visuale                                              |
| `src/routes/`                 | pagine: gruppi, fazzolettoni, storico, editor, moderazione                                 |
| `src/lib/import/`, `scripts/` | import della raccolta AGESCI Sicilia e script di manutenzione                              |
| `supabase/migrations/`        | tabelle, regole di accesso e funzioni                                                      |

Lo storico è _append-only_: ogni modifica, compreso un ripristino, è una nuova riga della tabella
`revisioni`, e si scrive solo tramite funzioni del database (`salva_gruppo`,
`salva_fazzolettone`, `ripristina`…), mai direttamente nelle tabelle. Gli indirizzi vecchi di
una pagina restano validi come redirect.

## Sviluppo

Servono Node 24 o più recente e Docker Desktop avviato.

```sh
npm install
npm run db:avvia                 # database locale (il primo avvio scarica le immagini Docker)
cp .env.example .env.local       # poi incolla i valori di: npx supabase status -o env
npm run dev                      # http://localhost:5173
```

In locale le email di accesso non partono: si leggono su http://127.0.0.1:54324. Dopo il primo
accesso, per avere tutti i permessi:

```sh
npm run ruolo -- tua@email.it amministratore
```

Altri comandi:

```sh
npm test                         # test
npm run check                    # controllo dei tipi
npm run verifica:permessi        # controlla le regole di accesso sul database locale
npm run db:reset                 # ricrea il database locale da zero (cancella anche gli utenti)
```

### Dati AGESCI Sicilia

I file sorgente della raccolta siciliana (`data/sicilia/grezzi.json`,
`data/sicilia/indirizzi.tsv`) **non sono nel repository**: AGESCI Sicilia ha dato il permesso di
pubblicare i dati nel sito, non di ridistribuire la loro tabella. Senza quei file alcuni test si
saltano. Chi ne ha bisogno per lo sviluppo può chiederli per email. Con i file al loro posto:

```sh
npm run seed:sicilia                                           # carica le schede siciliane
npx tsx --env-file=.env.local scripts/indirizzi-sicilia.ts     # sede e zona (--scrivi per salvare)
npx tsx --env-file=.env.local scripts/materiali-sicilia.ts     # tessuti di fondo e fettucce (idem)
```

## Messa online

1. **Supabase**: un progetto su supabase.com, poi
   `npx supabase login`, `npx supabase link --project-ref <ref>` e `npx supabase db push`.
2. **Vercel**: importa il repository e imposta `PUBLIC_SUPABASE_URL` e
   `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Ogni push su `main` pubblica una nuova versione.
   Facoltativa: `ALPHA_PASSWORD` fa chiedere una password per tutto il sito.
3. **Supabase → Authentication → URL Configuration**: _Site URL_ = l'indirizzo del sito, e tra
   i _Redirect URLs_ `https://<indirizzo>/**`. Per le email di accesso serve un SMTP proprio
   (Authentication → Emails): quello integrato scrive solo agli indirizzi del team.
4. **Amministratore**: dopo il primo accesso,
   `npx tsx --env-file=.env.produzione scripts/ruolo.ts <email> amministratore`
   (`.env.produzione` con URL e chiave di servizio del progetto, mai su git).

Una GitHub Action legge il database ogni 3 giorni, perché i progetti Supabase gratuiti vanno in
pausa dopo una settimana di inattività.

## Crediti

- Dati dei fazzolettoni siciliani: Tabella curata da A.F. Scalini (Centro regionale studi e
  documentazione - Agesci Sicilia), https://sicilia.agesci.it/fazzolettoni/, pubblicati con il
  loro permesso.
- Modello 3D del fazzolettone indossato: realizzato per il progetto
  (`static/modelli/fazzolettone.glb`).
- Il portafazzolettone porta solo la sigla dell'associazione del gruppo; nomi e simboli delle
  associazioni appartengono alle rispettive associazioni.
- Carattere Montserrat ExtraBold (`@fontsource/montserrat`), licenza SIL Open Font License 1.1.

## Licenze

- **Codice**: [EUPL 1.2](LICENSE) (European Union Public Licence), valida in tutte le lingue
  dell'Unione, [italiano compreso](https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12).
  Chi pubblica una versione modificata, anche solo come sito, ne deve condividere il codice.
- **Contenuti** del sito (disegni e descrizioni): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.it).
