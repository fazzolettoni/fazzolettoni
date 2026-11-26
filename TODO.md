# Cose da fare

Idee e lavori emersi finora, non ancora fatti. Le questioni di progetto ancora aperte sono in
[SPEC.md §11](SPEC.md#11-questioni-aperte). Per proporre altro: le
[Discussions](https://github.com/fazzolettoni/fazzolettoni/discussions).

## Per aprire il progetto a tutti

- [ ] **Email di accesso per tutti**: configurare un SMTP proprio in Supabase (es. Resend).
      Quello integrato manda le email solo agli indirizzi del team, quindi oggi chi viene da
      fuori non riesce a iscriversi.
- [ ] **Rendere pubblico il repository** e attivare le Discussions, a cui puntano il menù
      «Discuti» e la pagina «Il progetto».
- [ ] **Email dei commit**: per i commit futuri usare l'indirizzo «noreply» di GitHub, se non si
      vuole il proprio indirizzo visibile nel repository pubblico.
- [ ] **Nome e dominio** del progetto (oggi `fazzolettoni.vercel.app`).
- [ ] **Limiti per i nuovi utenti**: un tetto a modifiche e caricamenti nei primi giorni.

## Immagini: fantasie, loghi e toppe

- [ ] **Caricamento per tutti**, non solo per gli amministratori. Prima serve ripulire gli SVG
      caricati (togliere script, link esterni, handler di eventi) o convertirli in PNG, e un modo
      per i moderatori di rimuovere un'immagine.
- [ ] **Fantasia adattata alla fettuccia**: un'opzione per far coincidere la ripetizione con la
      larghezza della fettuccia, invece di indicarla in cm.
- [ ] **Motivi parametrici** (righe, quadri) generati da colori e misure, senza caricare
      un'immagine.

## 3D

- [ ] **Resa dei materiali**: usare il tessuto di fondo e fettucce (cotone, raso…) per dare
      lucentezza e trama al modello (bump map e reflection map).
- [ ] **Simbolo dell'associazione sul portafazzolettone**, dove l'associazione dà il permesso.
      Oggi c'è solo la sigla, perché i loghi sono marchi registrati.

## Dati

- [ ] **Tessuti non riconosciuti** nella raccolta siciliana: «Cotone e raso» e le descrizioni
      libere delle fettucce («Rifinitura filo cotone bianco») sono rimasti «non so». Il testo
      originale resta nei dati dell'import.
- [ ] **Altre fonti e regioni**: altre raccolte regionali, ScoutWiki (solo i fatti e il link,
      non i testi).
