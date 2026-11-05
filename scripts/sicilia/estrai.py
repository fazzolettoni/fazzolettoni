"""
Estrae i record grezzi dalla pagina https://sicilia.agesci.it/fazzolettoni/

La pagina contiene due tabelle con (quasi) gli stessi gruppi ma valori a volte diversi:
  - "dettagli":  tabella con il pannello "Mostra Dettagli" (campi chiave: valore)
  - "supsystic": tabella del plugin Supsystic (colonne)
Le teniamo entrambe come fonti distinte: la conversione segnalerà i conflitti.

Uso:  python3 -I scripts/sicilia/estrai.py <pagina.html> <uscita.json>
"""
import html
import json
import re
import sys

CAMPI_DETTAGLI = {
    'gruppo_scout': 'gruppo',
    'associazione': 'associazione',
    'colore_base': 'colore_base',
    'colore_fettuccia': 'colore_fettuccia',
    'distribuzione_colore_base': 'distribuzione',
    'numero_fettucce': 'numero_fettucce',
    'bordatura_sarchiatura': 'bordatura',
    'fettuccia_incrociata': 'incrociata',
    'Presenza logo': 'logo',
    'Tipo stoffa': 'stoffa',
    'Forma fazzolettone': 'forma',
    'Lunghezza lato corto': 'lato_corto',
    'Larghezza fettuccia': 'larghezza',
    'Distanza bordo': 'distanza',
    'Presenza lati corti': 'lati_corti',
    'Tipo fettuccia': 'tipo_fettuccia',
    'Esistenza gruppo': 'esistenza',
    'Precedenti fazzolettone': 'precedenti',
    'Info note storiche': 'note_storiche',
    'foto': 'foto',
}

COLONNE_SUPSYSTIC = [
    'gruppo', 'foto', 'associazione', 'colore_base', 'colore_fettuccia', 'distribuzione',
    'numero_fettucce', 'bordatura', 'incrociata', 'logo', 'stoffa', 'forma', 'lato_corto',
    'larghezza', 'distanza', 'lati_corti', 'tipo_fettuccia', 'esistenza', 'precedenti',
    'note_storiche',
]


def testo(frammento: str) -> str:
    t = re.sub(r'<br\s*/?>', '\n', frammento)
    t = re.sub(r'<[^>]+>', '', t)
    t = html.unescape(t).replace('\xa0', ' ')
    return re.sub(r'[ \t]+', ' ', t).strip()


def tabella_dettagli(s: str) -> list[dict]:
    i = s.index('<div id="fazzolettone-table">')
    j = s.index('</table>', i)
    righe = []
    for blocco in re.findall(r'<div class="list-group">(.*?)</div>', s[i:j], re.S):
        campi = {}
        for k, v in re.findall(r'<strong>([^<]+):</strong>(.*?)</p>', blocco, re.S):
            if k in CAMPI_DETTAGLI:
                campi[CAMPI_DETTAGLI[k]] = testo(v)
        righe.append({'fonte': 'dettagli', 'campi': campi})
    return righe


def tabella_supsystic(s: str) -> list[dict]:
    i = s.index('<table id="supsystic-table-1"')
    j = s.index('</table>', i)
    corpo = s[i:j].split('<tbody>', 1)[1]
    righe = []
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', corpo, re.S):
        celle = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)
        campi = {}
        for nome, cella in zip(COLONNE_SUPSYSTIC, celle):
            if nome == 'foto':
                m = re.search(r'(?:href|src)="([^"]+)"', cella)
                campi[nome] = m.group(1) if m else ''
            else:
                campi[nome] = testo(cella)
        if campi.get('gruppo'):
            righe.append({'fonte': 'supsystic', 'campi': campi})
    return righe


def main():
    sorgente, uscita = sys.argv[1], sys.argv[2]
    s = open(sorgente, encoding='utf-8').read()
    righe = tabella_dettagli(s) + tabella_supsystic(s)
    # I campi vuoti non portano informazione
    for r in righe:
        r['campi'] = {k: v for k, v in r['campi'].items() if v}
    m = re.search(r'Aggiornata al ([0-9/]+)', s)
    out = {
        'url': 'https://sicilia.agesci.it/fazzolettoni/',
        'aggiornata_al': m.group(1) if m else None,
        'curatore': 'A.F. Scalini (AGESCI Sicilia, Centro Studi)',
        'nota': 'Dati per il proof of concept privato. Non pubblicare senza il permesso di AGESCI Sicilia. Foto escluse.',
        'righe': righe,
    }
    with open(uscita, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"{len(righe)} righe ({sum(r['fonte'] == 'dettagli' for r in righe)} dettagli, "
          f"{sum(r['fonte'] == 'supsystic' for r in righe)} supsystic) -> {uscita}")


if __name__ == '__main__':
    main()
