/**
 * Import della raccolta AGESCI Sicilia (https://sicilia.agesci.it/fazzolettoni/).
 *
 * 1. `unisci`: la pagina ha due tabelle con gli stessi gruppi ("dettagli" e "supsystic").
 *    Le uniamo campo per campo: "dettagli" è la fonte principale, "supsystic" riempie i vuoti,
 *    e se i due valori sono diversi registriamo un conflitto.
 * 2. `converti`: dai campi testuali al design parametrico. Le regole coprono i casi ricorrenti;
 *    per le descrizioni libere esiste un'interpretazione manuale (sicilia-manuali.ts).
 *    Tutto ciò che non si riesce a interpretare finisce in `daRivedere`.
 */
import { normalizzaNomeColore, STIMA_COLORI } from '../design/colori';
import {
	DEFAULT,
	type Colore,
	type Design,
	type Fettuccia,
	type Forma,
	type Lato
} from '../design/schema';

export type Campo =
	| 'gruppo'
	| 'associazione'
	| 'colore_base'
	| 'colore_fettuccia'
	| 'distribuzione'
	| 'numero_fettucce'
	| 'bordatura'
	| 'incrociata'
	| 'logo'
	| 'stoffa'
	| 'forma'
	| 'lato_corto'
	| 'larghezza'
	| 'distanza'
	| 'lati_corti'
	| 'tipo_fettuccia'
	| 'esistenza'
	| 'precedenti'
	| 'note_storiche'
	| 'foto';

export const ETICHETTE_CAMPI: Record<Campo, string> = {
	gruppo: 'Gruppo',
	associazione: 'Associazione',
	colore_base: 'Colore base',
	colore_fettuccia: 'Colore fettuccia',
	distribuzione: 'Distribuzione colore base',
	numero_fettucce: 'Numero fettucce',
	bordatura: 'Bordatura/sarchiatura',
	incrociata: 'Fettuccia incrociata',
	logo: 'Logo',
	stoffa: 'Stoffa',
	forma: 'Forma',
	lato_corto: 'Lato corto',
	larghezza: 'Larghezza fettuccia',
	distanza: 'Distanza dal bordo',
	lati_corti: 'Lati corti',
	tipo_fettuccia: 'Tipo fettuccia',
	esistenza: 'Gruppo esistente',
	precedenti: 'Fazzolettoni precedenti',
	note_storiche: 'Note storiche',
	foto: 'Foto'
};

export interface RigaGrezza {
	fonte: 'dettagli' | 'supsystic';
	campi: Partial<Record<Campo, string>>;
}

export interface GruppoSicilia {
	id: string;
	nome: string;
	/** Valore scelto per ogni campo (null = sconosciuto o assente). */
	campi: Partial<Record<Campo, string>>;
	/** Campi in cui le due tabelle dicono cose diverse. */
	conflitti: { campo: Campo; dettagli: string; supsystic: string }[];
	fonti: RigaGrezza['fonte'][];
	/** Se lo stesso gruppo ha più righe (fazzolettoni diversi): 1, 2, … */
	variante?: number;
}

// ---------------------------------------------------------------- unione

/** Nomi scritti in modo diverso nelle due tabelle. */
const ALIAS: Record<string, string> = {
	'ZAFFERANA 1': 'ZAFFERANA ETNEA 1',
	'ALTAVILLA MILICIA': 'ALTAVILLA MILICIA 1'
};

/** Gruppi la cui associazione differisce tra le due tabelle: si uniscono comunque (conflitto). */
const ASSOCIAZIONE_INCERTA = new Set(['GIARRE I']);

const chiaveNome = (n: string) => {
	const k = n.toUpperCase().replace(/[’'`]/g, ' ').replace(/\s+/g, ' ').trim();
	return ALIAS[k] ?? k;
};

const VUOTI = new Set(['', '?', 'sconosciuto', 'sconosciuta']);
export const vuoto = (v: string | undefined | null) =>
	v == null || VUOTI.has(v.trim().toLowerCase());

/** Confronto "morbido": maiuscole, spazi, "70" = "70 cm", "Ambedue" = "Su ambedue". */
function equivalenti(a: string, b: string) {
	const n = (s: string) =>
		s
			.toLowerCase()
			.replace(/[’'`]/g, ' ')
			.replace(/\bcm\b/g, '')
			.replace(/\bsu\b/g, '')
			.replace(/\buna\b/g, '1')
			.replace(/[^a-z0-9,.]/g, '');
	return n(a) === n(b);
}

function slug(s: string) {
	return s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[’'`]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/** "ACI SANT'ANTONIO 1" → "Aci Sant'Antonio 1" */
function nomeLeggibile(s: string) {
	return s
		.toLowerCase()
		.replace(/(^|[\s'’-])(\p{L})/gu, (_, p, c) => p + c.toUpperCase())
		.replace(/\b(Di|Del|Della|Degli|Dei|De)\b/g, (m) => m.toLowerCase());
}

export function unisci(righe: RigaGrezza[]): GruppoSicilia[] {
	const perNome = new Map<string, RigaGrezza[]>();
	for (const r of righe) {
		if (!r.campi.gruppo) continue;
		// Identità = associazione + nome: "Palermo 6" AGESCI e "Palermo 6" FSE sono gruppi diversi
		const nome = chiaveNome(r.campi.gruppo);
		const assoc = ASSOCIAZIONE_INCERTA.has(nome)
			? 'AGESCI'
			: (r.campi.associazione ?? 'AGESCI').toUpperCase().trim();
		const k = `${assoc}|${nome}`;
		perNome.set(k, [...(perNome.get(k) ?? []), r]);
	}
	const gruppi: GruppoSicilia[] = [];
	for (const [k, rr] of perNome) {
		// Se lo stesso gruppo compare più volte nella stessa tabella (fazzolettoni diversi),
		// accoppiamo le righe delle due tabelle per colore base.
		const dets = rr.filter((r) => r.fonte === 'dettagli');
		const sups = rr.filter((r) => r.fonte === 'supsystic');
		const coppie: [RigaGrezza | undefined, RigaGrezza | undefined][] = [];
		const restanti = [...sups];
		for (const d of dets) {
			const i = restanti.findIndex(
				(x) =>
					(x.campi.colore_base ?? '').toLowerCase() === (d.campi.colore_base ?? '').toLowerCase()
			);
			coppie.push([d, i >= 0 ? restanti.splice(i, 1)[0] : undefined]);
		}
		for (const x of restanti) coppie.push([undefined, x]);
		coppie.forEach(([det, sup], n) =>
			gruppi.push(unisciCoppia(k, det, sup, coppie.length > 1 ? n + 1 : 0))
		);
	}
	return gruppi.sort(
		(a, b) => a.nome.localeCompare(b.nome, 'it', { numeric: true }) || a.id.localeCompare(b.id)
	);
}

function unisciCoppia(
	chiave: string,
	det: RigaGrezza | undefined,
	sup: RigaGrezza | undefined,
	variante: number
): GruppoSicilia {
	const campi: GruppoSicilia['campi'] = {};
	const conflitti: GruppoSicilia['conflitti'] = [];
	const tutti = new Set([
		...Object.keys(det?.campi ?? {}),
		...Object.keys(sup?.campi ?? {})
	]) as Set<Campo>;
	for (const c of tutti) {
		const a = det?.campi[c];
		const b = sup?.campi[c];
		const va = vuoto(a) ? null : a!;
		const vb = vuoto(b) ? null : b!;
		// Nei testi lunghi la tabella "dettagli" ha perso le lettere accentate: meglio l'altra
		const testoLibero = c === 'note_storiche' || c === 'precedenti';
		campi[c] = testoLibero ? (vb ?? va ?? b ?? a) : (va ?? vb ?? a ?? b);
		if (va && vb && !testoLibero && !equivalenti(va, vb) && c !== 'gruppo' && c !== 'foto')
			conflitti.push({ campo: c, dettagli: va, supsystic: vb });
	}
	// Il nome con l'apostrofo (supsystic) è più fedele
	const [associazione, k] = chiave.split('|');
	const nome = nomeLeggibile(sup?.campi.gruppo ?? det?.campi.gruppo ?? k);
	// AGESCI è il caso comune: le altre associazioni hanno il suffisso (es. palermo-6-fse)
	const id =
		slug(k) +
		(associazione !== 'AGESCI' ? `-${slug(associazione)}` : '') +
		(variante > 1 ? `-${variante}` : '');
	const fonti = [det, sup].filter((r): r is RigaGrezza => !!r).map((r) => r.fonte);
	return { id, nome, variante: variante || undefined, campi, conflitti, fonti };
}

// ---------------------------------------------------------------- utilità di parsing

export function colore(nome: string): Colore {
	const n = normalizzaNomeColore(nome);
	const hex = STIMA_COLORI[n] ?? null;
	return { nome: n, hex, approssimato: hex != null };
}

/** Tutte le misure presenti nel testo, in mm ("1,5 cm" → 15, "12 mm" → 12, "2" → 20). */
export function misure(testo: string | undefined): number[] {
	if (!testo) return [];
	return [...testo.matchAll(/(\d+(?:[.,]\d+)?)\s*(mm|cm)?/gi)].map((m) => {
		const v = parseFloat(m[1].replace(',', '.'));
		return m[2]?.toLowerCase() === 'mm' ? v : v * 10;
	});
}

const NUMERI: Record<string, number> = { una: 1, uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5 };

/** Testo "semplice" = interpretabile dalle regole senza ambiguità. */
const semplice = (v: string | undefined, re: RegExp) => vuoto(v) || re.test(v!.trim());

const RE_COLORE = /^[\p{L} ]+$/u;
const RE_MISURA = /^\d+(?:[.,]\d+)?\s*(cm|mm)?( circa| ciascuna| ognuno)?$/i;

// ---------------------------------------------------------------- conversione a regole

export interface Conversione {
	design: Design;
	/** Cose dedotte durante l'import (oltre agli avvisi del renderer). */
	note: string[];
	/** Motivi per cui serve una revisione umana. Vuoto = conversione automatica pulita. */
	daRivedere: string[];
	metodo: 'regole' | 'manuale';
}

export function forma(g: GruppoSicilia): Forma | null {
	const f = g.campi.forma?.toLowerCase();
	if (f?.startsWith('quadrat')) return 'quadrato';
	if (f?.startsWith('triangol')) return 'triangolo';
	if (/4 lati|tutti e 4/i.test(g.campi.lati_corti ?? '')) return 'quadrato';
	return null;
}

export function dimensioni(g: GruppoSicilia, f: Forma | null): Design['dimensioni_mm'] {
	const [mm] = misure(g.campi.lato_corto);
	if (!mm) return null;
	return f === 'quadrato' ? { lato: mm } : { cateto: mm };
}

export function lati(
	g: GruppoSicilia,
	f: Forma | null,
	note: string[],
	rivedi: string[]
): Lato[] | null {
	const t = (g.campi.lati_corti ?? '').toLowerCase();
	if (vuoto(t)) return null;
	if (/4 lati|tutti/.test(t)) {
		if (f === 'quadrato') return [...DEFAULT.lati.quadrato];
		note.push('"tutti i lati" su un triangolo: lati corti e lato lungo');
		return ['corto_sx', 'corto_dx', 'lungo'];
	}
	if (/lato lungo/.test(t)) return ['corto_sx', 'corto_dx', 'lungo'];
	if (/ambedue/.test(t)) {
		if (/bordura doppia/.test(t)) note.push('"bordura doppia": non rappresentata');
		if (/(dx|destra|sx|sinistra)/.test(t))
			rivedi.push(`Colori diversi per lato: "${g.campi.lati_corti}"`);
		return ['corto_sx', 'corto_dx'];
	}
	if (t === 'no') {
		rivedi.push('Lati corti: "No" (significato non chiaro)');
		return null;
	}
	rivedi.push(`Lati non interpretati: "${g.campi.lati_corti}"`);
	return null;
}

function fondo(g: GruppoSicilia, note: string[], rivedi: string[]): Design['fronte']['fondo'] {
	const t = g.campi.colore_base;
	if (vuoto(t)) return { tipo: 'tinta_unita', colori: [{ nome: null, hex: null }] };
	const parti = t!
		.split(/\s*[-/]\s*/)
		.map((p) => p.replace(/\((sinistra|destra)\)/i, '').trim())
		.filter(Boolean);
	if (parti.length === 1) return { tipo: 'tinta_unita', colori: [colore(parti[0])] };
	if (parti.length === 2) {
		if (!/sinistra/i.test(t!))
			note.push(`Fondo bicolore "${t}": assunto il primo colore a sinistra`);
		return { tipo: 'diviso', colori: parti.map(colore) };
	}
	rivedi.push(`Colore base non interpretato: "${t}"`);
	return { tipo: 'tinta_unita', colori: [colore(parti[0])] };
}

function incrocio(g: GruppoSicilia, i: number, n: number): Fettuccia['incrocio'] {
	const t = (g.campi.incrociata ?? '').toLowerCase().trim();
	if (vuoto(t)) return null;
	if (t === 'no') return 'angolo';
	if (/interna/.test(t)) return i === n - 1 ? 'incrociato' : 'angolo';
	if (t === 'si') return 'incrociato';
	return null;
}

export function convertiConRegole(g: GruppoSicilia): Conversione {
	const note: string[] = [];
	const rivedi: string[] = [];
	const c = g.campi;

	const f = forma(g);
	const lt = lati(g, f, note, rivedi);

	// Quanti nastri e come sono disposti
	const tnOrig = (c.numero_fettucce ?? '').toLowerCase().trim();
	// "(Rossa esterna)", "(Nero sul bordo)": quale fettuccia sta all'esterno
	const esterna = tnOrig.match(/\((\p{L}+)[, ]+(?:esterna|esterno|sul bordo)/u)?.[1];
	const tn = tnOrig
		.replace(/\([^)]*\)/g, ' ')
		.replace(/,/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	let n: number | null = null;
	const primo = tn.split(' ')[0];
	if (/^\d+$/.test(primo)) n = parseInt(primo);
	else if (primo in NUMERI) n = NUMERI[primo];
	if (
		!semplice(
			tn,
			/^(una|uno|due|tre|quattro|cinque|\d)( fettucce)?( parallele)?( (distanziate|distanziati|adiacenti|contigue|non adiacenti|unite))?( tra di loro e al bordo)?( fettuccia)?( tricolore( italiano)?)?$/i
		)
	)
		rivedi.push(`Numero fettucce descritto a parole: "${c.numero_fettucce}"`);
	const distanziate = /distanziat|non adiacent|a distanza/.test(tn);
	const sulBordo = /sul bordo|al bordo/.test(tnOrig);

	// Colori dei nastri
	const tc = c.colore_fettuccia ?? '';
	let coloriFet: Colore[] = [];
	if (!vuoto(tc)) {
		if (/tricolore/i.test(tc)) {
			// Il primo colore è il più esterno: "rosso all'esterno" → rosso, bianco, verde
			const ordine = /rosso all.esterno/i.test(tc)
				? ['rosso', 'bianco', 'verde']
				: ['verde', 'bianco', 'rosso'];
			if (!/all.esterno/i.test(tc)) note.push("Tricolore: assunto il verde all'esterno");
			coloriFet = ordine.map(colore);
		} else if (/scozzese|fantasia|quadri/i.test(tc)) {
			rivedi.push(`Fettuccia a fantasia ("${tc}"): non ancora rappresentabile`);
			coloriFet = [{ nome: tc.toLowerCase(), hex: null }];
		}
		if (!coloriFet.length)
			coloriFet = tc
				.split(/\s*(?:-|,|\be\b)\s*/i)
				.filter(Boolean)
				.map(colore);
		if (
			!/^tricolore|scozzese|fantasia|quadri/i.test(tc) &&
			!tc.split(/\s*(?:-|,|\be\b)\s*/i).every((p) => RE_COLORE.test(p))
		)
			rivedi.push(`Colore fettuccia con indicazioni aggiuntive: "${tc}"`);
		if (esterna) {
			const k = coloriFet.findIndex((x) => x.nome === normalizzaNomeColore(esterna));
			if (k > 0) coloriFet.unshift(...coloriFet.splice(k, 1));
			else if (k < 0) rivedi.push(`Fettuccia esterna "${esterna}" non trovata tra i colori`);
		}
	}
	if (vuoto(c.numero_fettucce) && vuoto(tc)) rivedi.push('Fettucce sconosciute');
	if (n == null) n = coloriFet.length || (vuoto(tc) ? 0 : 1);
	if (n === 0) {
		// Nessuna fettuccia dichiarata
		return {
			design: {
				forma: f,
				dimensioni_mm: dimensioni(g, f),
				fronte: { fondo: fondo(g, note, rivedi), fettucce: [], elementi: elementi(g, rivedi) },
				retro: null
			},
			note,
			daRivedere: rivedi,
			metodo: 'regole'
		};
	}

	// Una fettuccia ma più colori: un solo nastro a strisce (es. tricolore)
	let perNastro: Colore[][];
	if (n === 1) perNastro = [coloriFet.length ? coloriFet : [{ nome: null, hex: null }]];
	else if (coloriFet.length === n) perNastro = coloriFet.map((k) => [k]);
	else if (coloriFet.length === 1) perNastro = Array.from({ length: n }, () => [coloriFet[0]]);
	else {
		rivedi.push(`${n} fettucce ma ${coloriFet.length} colori`);
		perNastro = Array.from({ length: n }, (_, i) => [coloriFet[i] ?? { nome: null, hex: null }]);
	}
	if (n === 1 && coloriFet.length > 1 && !/tricolore/i.test(tc))
		note.push('Più colori su una fettuccia: resa come fettuccia a strisce');

	// Larghezze
	const ml = misure(c.larghezza);
	// Accettabile anche "1,5 cm, 1,5 cm" o "1 cm sia della bianca che della blu": una sola misura
	const tuttiUguali = new Set(ml).size === 1 && !/intern|estern|\(/i.test(c.larghezza ?? '');
	if (!semplice(c.larghezza, RE_MISURA) && !tuttiUguali)
		rivedi.push(`Larghezza descritta a parole: "${c.larghezza}"`);
	const larghezza = ml[0] && ml[0] > 0 ? ml[0] : null;

	// Distanze: dalla colonna "distanza" + "bordatura/sarchiatura"
	const md = misure(c.distanza);
	if (!semplice(c.distanza, /^(\d+(?:[.,]\d+)?\s*(cm|mm)?|sul bordo|no)$/i))
		rivedi.push(`Distanza descritta a parole: "${c.distanza}"`);
	const bord = (c.bordatura ?? '').toLowerCase();
	let d0: number | null = md.length ? md[0] : /sul bordo/i.test(c.distanza ?? '') ? 0 : null;
	if ((/bordato/.test(bord) || sulBordo) && d0 == null) d0 = 0;
	if (/sarchiato/.test(bord) && (d0 == null || d0 === 0)) {
		if (d0 === 0) rivedi.push('Indicato "sarchiato" ma con distanza 0');
		else note.push('Sarchiata, distanza dal bordo sconosciuta: ipotizzati 1 cm');
		d0 = 10;
	}

	const fettucce: Fettuccia[] = perNastro.map((cols, i) => {
		let d: Fettuccia['distanza_bordo_mm'];
		if (i === 0) d = d0;
		else if (/ambedue/.test(bord) && n === 2) {
			// una bordata e una sarchiata
			d = d0 != null && d0 > 0 ? d0 : 'adiacente';
			if (i === 1 && (d0 == null || d0 === 0)) {
				d = (larghezza ?? DEFAULT.larghezza_mm) + 10;
				note.push('Bordata + sarchiata: distanza della seconda ipotizzata');
			}
		} else if (distanziate) {
			d = null;
		} else d = 'adiacente';
		return {
			colori: cols,
			larghezza_mm: larghezza,
			distanza_bordo_mm: d,
			lati: lt ? [...lt] : null,
			incrocio: incrocio(g, i, perNastro.length),
			tratto: null
		};
	});
	// Distanziate senza misura della distanza tra le due: 1 cm di stacco ipotizzato
	if (distanziate) {
		let cur =
			(typeof fettucce[0].distanza_bordo_mm === 'number' ? fettucce[0].distanza_bordo_mm : 0) +
			(larghezza ?? DEFAULT.larghezza_mm);
		for (const fe of fettucce.slice(1)) {
			fe.distanza_bordo_mm = cur + 10;
			cur += 10 + (larghezza ?? DEFAULT.larghezza_mm);
		}
		note.push('Fettucce distanziate: stacco tra le fettucce ipotizzato 1 cm');
	}
	if (/^si,/.test((c.incrociata ?? '').toLowerCase()) && !/interna/i.test(c.incrociata ?? ''))
		rivedi.push(`Incrocio descritto a parole: "${c.incrociata}"`);

	return {
		design: {
			forma: f,
			dimensioni_mm: dimensioni(g, f),
			fronte: { fondo: fondo(g, note, rivedi), fettucce, elementi: elementi(g, rivedi) },
			retro: null
		},
		note,
		daRivedere: rivedi,
		metodo: 'regole'
	};
}

function elementi(g: GruppoSicilia, rivedi: string[]): Design['fronte']['elementi'] {
	const t = g.campi.logo;
	if (vuoto(t) || /^no$/i.test(t!.trim())) return [];
	rivedi.push('Logo presente: posizione e immagine da completare');
	return [
		{
			tipo: 'toppa',
			descrizione: /^si$/i.test(t!.trim()) ? 'logo' : t!.slice(0, 80),
			posizione: { x: 0.5, y: 0.72 },
			scala: 0.22
		}
	];
}
