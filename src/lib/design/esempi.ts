import { STIMA_COLORI } from './colori';
import type { Colore, Design, Fettuccia } from './schema';

/**
 * Casi reali per la fase 0, ricavati dalla raccolta AGESCI Sicilia e da ScoutWiki.
 * ATTENZIONE: sono trascrizioni da verificare sulle fonti originali.
 * Gli hex sono stime a partire dal nome del colore (approssimato: true).
 */

export interface Esempio {
	id: string;
	gruppo: string;
	associazione: string;
	regione: string;
	fonte: { tipo: string; url: string };
	/** Descrizione originale (o sua sintesi) e scelte fatte nella trascrizione. */
	note: string;
	design: Design;
}

const col = (nome: string): Colore => ({
	nome,
	hex: STIMA_COLORI[nome] ?? null,
	approssimato: true
});
const ignoto = (nome: string | null = null): Colore => ({ nome, hex: null });

const SICILIA = { tipo: 'agesci-sicilia', url: 'https://sicilia.agesci.it/fazzolettoni/' };
const scoutwiki = (pagina: string) => ({
	tipo: 'scoutwiki',
	url: `https://it.scoutwiki.org/wiki/${encodeURIComponent(pagina.replace(/ /g, '_'))}`
});

const fet = (f: Partial<Fettuccia> & Pick<Fettuccia, 'colori'>): Fettuccia => ({
	larghezza_mm: null,
	distanza_bordo_mm: null,
	lati: null,
	incrocio: null,
	...f
});

const CORTI: Fettuccia['lati'] = ['corto_sx', 'corto_dx'];
const QUATTRO: Fettuccia['lati'] = ['alto_sx', 'alto_dx', 'basso_dx', 'basso_sx'];

const tri = (
	fondo: Design['fronte']['fondo'],
	fettucce: Fettuccia[],
	elementi: Design['fronte']['elementi'] = []
): Design => ({
	forma: 'triangolo',
	dimensioni_mm: null,
	fronte: { fondo, fettucce, elementi },
	retro: null
});
const quad = (fondo: Design['fronte']['fondo'], fettucce: Fettuccia[]): Design => ({
	forma: 'quadrato',
	dimensioni_mm: null,
	fronte: { fondo, fettucce, elementi: [] },
	retro: null
});
const unito = (c: Colore): Design['fronte']['fondo'] => ({ tipo: 'tinta_unita', colori: [c] });

export const ESEMPI: Esempio[] = [
	{
		id: 'castellammare-1',
		gruppo: 'Castellammare 1',
		associazione: 'AGESCI',
		regione: 'Sicilia',
		fonte: SICILIA,
		note: 'Celeste, una fettuccia bianca da 2,5 cm, non incrociata. Il caso più semplice.',
		design: tri(unito(col('celeste')), [
			fet({
				colori: [col('bianco')],
				larghezza_mm: 25,
				distanza_bordo_mm: 0,
				lati: CORTI,
				incrocio: 'angolo'
			})
		])
	},
	{
		id: 'venezia-2',
		gruppo: 'Venezia 2',
		associazione: 'AGESCI',
		regione: 'Veneto',
		fonte: scoutwiki('Venezia 2 AGESCI'),
		note: '"Azzurro con banda bianca". Tutto il resto è sconosciuto: caso tipico dell\'import da ScoutWiki.',
		design: tri(unito(col('azzurro')), [fet({ colori: [col('bianco')] })])
	},
	{
		id: 'rosolini-1',
		gruppo: 'Rosolini 1',
		associazione: 'AGESCI',
		regione: 'Sicilia',
		fonte: SICILIA,
		note: "Fondo blu, cinque fettucce contigue da 0,4 cm (i cinque continenti del Giubileo 2000). CONFLITTO: per la Sicilia la prima è blu, per ScoutWiki azzurra; qui azzurra. Ordine dall'esterno ipotizzato.",
		design: tri(
			unito(col('blu')),
			['azzurro', 'giallo', 'verde', 'rosso', 'bianco'].map((c, i) =>
				fet({
					colori: [col(c)],
					larghezza_mm: 4,
					distanza_bordo_mm: i === 0 ? 0 : 'adiacente',
					lati: CORTI,
					incrocio: 'angolo'
				})
			)
		)
	},
	{
		id: 'gibellina-1',
		gruppo: 'Gibellina 1',
		associazione: 'AGESCI',
		regione: 'Sicilia',
		fonte: SICILIA,
		note: 'Fondo nero, tre fettucce adiacenti (blu esterna, verde, gialla interna); la gialla è incrociata. Larghezze sconosciute.',
		design: tri(unito(col('nero')), [
			fet({ colori: [col('blu')], distanza_bordo_mm: 0, lati: CORTI }),
			fet({ colori: [col('verde')], distanza_bordo_mm: 'adiacente', lati: CORTI }),
			fet({
				colori: [col('giallo')],
				distanza_bordo_mm: 'adiacente',
				lati: CORTI,
				incrocio: 'incrociato'
			})
		])
	},
	{
		id: 'solarino-8',
		gruppo: 'Solarino 8',
		associazione: 'AGESCI',
		regione: 'Sicilia',
		fonte: SICILIA,
		note: 'Azzurro, due fettucce parallele non adiacenti (bianca sul bordo, blu incrociata), toppa stampata della Madonna delle Lacrime sulla punta. Distanze ipotizzate.',
		design: tri(
			unito(col('azzurro')),
			[
				fet({ colori: [col('bianco')], distanza_bordo_mm: 0, lati: CORTI }),
				fet({ colori: [col('blu')], distanza_bordo_mm: null, lati: CORTI, incrocio: 'incrociato' })
			],
			[
				{
					tipo: 'toppa',
					descrizione: 'Madonna delle Lacrime',
					posizione: { x: 0.5, y: 0.72 },
					scala: 0.28
				}
			]
		)
	},
	{
		id: 'vicari-1',
		gruppo: 'Vicari 1',
		associazione: 'AGESCI',
		regione: 'Sicilia',
		fonte: SICILIA,
		note: 'Fondo diviso: blu a sinistra, rosso a destra. Bordato con fettuccia tricolore.',
		design: tri({ tipo: 'diviso', colori: [col('blu'), col('rosso')] }, [
			fet({
				colori: [col('verde'), col('bianco'), col('rosso')],
				larghezza_mm: 30,
				distanza_bordo_mm: 0,
				lati: CORTI
			})
		])
	},
	{
		id: 'augusta-4',
		gruppo: 'Augusta 4',
		associazione: 'AGESCI',
		regione: 'Sicilia',
		fonte: SICILIA,
		note: 'Giallo, bordo blu sui lati corti; striscia verde parziale a 2 cm dal vertice, lunga 8 cm, parallela ai lati corti. Interpretazione da verificare.',
		design: tri(unito(col('giallo')), [
			fet({ colori: [col('blu')], distanza_bordo_mm: 0, lati: CORTI }),
			fet({
				colori: [col('verde')],
				larghezza_mm: 15,
				distanza_bordo_mm: 'adiacente',
				lati: CORTI,
				incrocio: 'angolo',
				tratto: { da_mm: 20, a_mm: 100 }
			})
		])
	},
	{
		id: 'catania-19',
		gruppo: 'Catania 19',
		associazione: 'AGESCI',
		regione: 'Sicilia',
		fonte: SICILIA,
		note: 'Fettuccia bianca da 2 cm e amaranto da 1 cm parzialmente sovrapposte. Colore di fondo non trascritto: resta sconosciuto.',
		design: tri(unito(ignoto()), [
			fet({
				colori: [col('bianco')],
				larghezza_mm: 20,
				distanza_bordo_mm: 0,
				lati: CORTI,
				incrocio: 'angolo'
			}),
			fet({
				colori: [col('amaranto')],
				larghezza_mm: 10,
				distanza_bordo_mm: 14,
				lati: CORTI,
				incrocio: 'angolo'
			})
		])
	},
	{
		id: 'trapani-6',
		gruppo: 'Trapani 6',
		associazione: 'AGESCI',
		regione: 'Sicilia',
		fonte: SICILIA,
		note: 'Tema scozzese, bordato. Le fantasie sono rimandate: resa indicativa, colori non trascritti.',
		design: tri(
			{ tipo: 'fantasia', colori: [ignoto(), ignoto()], fantasia: { descrizione: 'scozzese' } },
			[fet({ colori: [ignoto()], distanza_bordo_mm: 0, lati: CORTI })]
		)
	},
	{
		id: 'siracusa-14',
		gruppo: 'Siracusa 14',
		associazione: 'AGESCI',
		regione: 'Sicilia',
		fonte: SICILIA,
		note: 'Quadrato verde bandiera, fettuccia bianca su tutti e 4 i lati. Retro non descritto.',
		design: quad(unito(col('verde bandiera')), [
			fet({ colori: [col('bianco')], distanza_bordo_mm: 0, lati: QUATTRO, incrocio: 'angolo' })
		])
	},
	{
		id: 'siracusa-13',
		gruppo: 'Siracusa 13',
		associazione: 'AGESCI',
		regione: 'Sicilia',
		fonte: SICILIA,
		note: 'Quadrato grigio, fettuccia rossa esterna (incrociata) adiacente a una gialla.',
		design: quad(unito(col('grigio')), [
			fet({ colori: [col('rosso')], distanza_bordo_mm: 0, lati: QUATTRO, incrocio: 'incrociato' }),
			fet({
				colori: [col('giallo')],
				distanza_bordo_mm: 'adiacente',
				lati: QUATTRO,
				incrocio: 'angolo'
			})
		])
	},
	{
		id: 'belpasso-2',
		gruppo: 'Belpasso 2',
		associazione: 'AGESCI',
		regione: 'Sicilia',
		fonte: SICILIA,
		note: 'Blu. Fettuccia bianca da 0,5 cm a 1 cm dal bordo, incrociata, coperta dalla fettuccia rossa da 0,5 cm sul bordo. Quadrato, fettucce su tutti e 4 i lati.',
		design: quad(unito(col('blu')), [
			// La bianca va disegnata per prima: agli angoli la rossa la copre
			fet({
				colori: [col('bianco')],
				larghezza_mm: 5,
				distanza_bordo_mm: 10,
				lati: QUATTRO,
				incrocio: 'incrociato'
			}),
			fet({
				colori: [col('rosso')],
				larghezza_mm: 5,
				distanza_bordo_mm: 0,
				lati: QUATTRO,
				incrocio: 'angolo'
			})
		])
	}
];
