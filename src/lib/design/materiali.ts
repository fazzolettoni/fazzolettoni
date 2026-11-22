import { MATERIALI, type Design } from './schema';

/** "Tessuto: cotone · fettucce in raso", oppure null se non si sa niente. */
export function testoMateriali(d: Design): string | null {
	const nome = (m: string) => MATERIALI[m as keyof typeof MATERIALI]?.toLowerCase();
	const fondo = d.fronte.fondo.materiale ? nome(d.fronte.fondo.materiale) : null;
	const fet = [
		...new Set(
			[d.fronte, d.retro]
				.flatMap((f) => f?.fettucce ?? [])
				.flatMap((f) => (f.materiale ? [nome(f.materiale)] : []))
		)
	].filter(Boolean);
	const parti = [
		fondo && `Tessuto: ${fondo}`,
		fet.length && `${fondo ? 'fettucce' : 'Fettucce'} in ${fet.join(' e ')}`
	].filter(Boolean);
	return parti.length ? parti.join(' · ') : null;
}
