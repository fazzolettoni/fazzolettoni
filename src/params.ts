import { defineParams } from '@sveltejs/kit/params';

export const params = defineParams({
	/** Sigla di associazione nell'URL: solo lettere minuscole (agesci, cngei, fse…). */
	sigla: (p) => (/^[a-z]+$/.test(p) ? p : undefined)
});
