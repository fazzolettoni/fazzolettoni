export const COOKIE_ALPHA = 'alpha';

/** SHA-256 della password, in esadecimale: va nel cookie al posto della password. */
export async function impronta(password: string): Promise<string> {
	const dati = new TextEncoder().encode(`fazzolettoni-alpha:${password}`);
	const hash = await crypto.subtle.digest('SHA-256', dati);
	return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
