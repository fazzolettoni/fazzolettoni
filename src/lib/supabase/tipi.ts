/** Tipi delle tabelle Supabase (vedi supabase/migrations). */
import type { Design } from '../design/schema';

export type Ruolo = 'utente' | 'moderatore' | 'amministratore';

export interface Profilo {
	id: string;
	nome: string;
	ruolo: Ruolo;
	bannato: boolean;
}

/** Data parziale (SPEC §3.3): solo l'anno, eventualmente "circa". */
export interface DataParziale {
	anno: number;
	mese?: number | null;
	giorno?: number | null;
	circa?: boolean;
}

export interface Link {
	tipo: string;
	url: string;
}

export interface DatiGruppo {
	nome: string;
	regione: string;
	zona?: string | null;
	attivo?: boolean;
	link?: Link[];
}

export interface Fonte {
	tipo: string;
	url?: string;
	nota?: string;
}

export interface DatiFazzolettone {
	design: Design;
	data_inizio?: DataParziale | null;
	data_fine?: DataParziale | null;
	significato?: string | null;
	fonti?: Fonte[];
	affidabilita?: 'verificato' | 'da_verificare' | 'importato';
	/** Note dell'import o dell'autore. */
	note?: string[];
	da_rivedere?: string[];
	/** Campi originali della fonte importata, per confronto. */
	dati_originali?: Record<string, string | undefined>;
	conflitti?: { campo: string; dettagli: string; supsystic: string }[];
}

export interface Gruppo {
	id: string;
	associazione: string;
	nome: string;
	slug: string;
	regione: string;
	regione_slug: string;
	zona: string | null;
	attivo: boolean;
	revisione_corrente: number | null;
}

export interface Fazzolettone {
	id: string;
	gruppo_id: string;
	slug: string;
	data_inizio: DataParziale | null;
	data_fine: DataParziale | null;
	revisione_corrente: number | null;
}

export interface Revisione<D = unknown> {
	id: number;
	entita: 'gruppo' | 'fazzolettone';
	entita_id: string;
	dati: D;
	tipo: 'creazione' | 'modifica' | 'ripristino' | 'import';
	autore: string | null;
	autore_nome: string | null;
	commento: string | null;
	precedente: number | null;
	ripristina: number | null;
	creata_il: string;
}
