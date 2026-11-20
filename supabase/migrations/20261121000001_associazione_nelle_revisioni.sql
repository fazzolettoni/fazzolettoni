-- Fino alla migrazione precedente l'associazione di un gruppo non si poteva cambiare: in ogni
-- revisione di gruppo già esistente era quella attuale del gruppo. La si scrive una volta nei
-- dati di quelle revisioni, così anche ripristinarle riporta l'associazione giusta.
-- Si aggiunge solo il campo "associazione", e solo dove manca; nient'altro cambia.
-- Le revisioni sono immutabili: il blocco si sospende solo per questa operazione.
-- Va applicata insieme alla precedente, prima che il sito permetta di cambiare associazione:
-- così nessun gruppo può averla già cambiata.
alter table revisioni disable trigger revisioni_immutabili;

update revisioni r
set dati = jsonb_set(r.dati, '{associazione}', to_jsonb(g.associazione))
from gruppi g
where r.entita = 'gruppo' and r.entita_id = g.id and not (r.dati ? 'associazione');

alter table revisioni enable trigger revisioni_immutabili;
