import { supabaseBrowser } from './browser';

const ESTENSIONI: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/svg+xml': 'svg'
};
export const TIPI_TILE = Object.keys(ESTENSIONI);
export const MAX_TILE = 1024 * 1024;

/**
 * Carica una tile nello storage e restituisce il nome del file: l'impronta SHA-256 del
 * contenuto più l'estensione. Se lo stesso file c'è già, va bene così. Solo amministratori.
 */
export async function caricaFileTile(file: File): Promise<string> {
	const ext = ESTENSIONI[file.type];
	if (!ext) throw new Error('Formato non accettato: PNG, JPG, WebP o SVG');
	if (file.size > MAX_TILE) throw new Error('File troppo grande: al massimo 1 MB');
	const dati = await file.arrayBuffer();
	const hash = await crypto.subtle.digest('SHA-256', dati);
	const nome = `${[...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')}.${ext}`;
	const { error } = await supabaseBrowser()
		.storage.from('tile')
		.upload(nome, new Blob([dati], { type: file.type }), { contentType: file.type, upsert: false });
	if (error && !/exists|duplicate/i.test(error.message)) throw new Error(error.message);
	return nome;
}
