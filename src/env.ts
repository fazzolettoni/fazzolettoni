import { defineEnvVars } from '@sveltejs/kit/env';

const obbligatoria = (nome: string) => (v: string | undefined) => {
	if (!v) throw new Error(`Manca ${nome}: copia .env.example in .env.local (vedi README)`);
	return v;
};

export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		schema: obbligatoria('PUBLIC_SUPABASE_URL'),
		description: 'URL del progetto Supabase (locale: http://127.0.0.1:54321)'
	},
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
		public: true,
		schema: obbligatoria('PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
		description: 'Chiave pubblica di Supabase: i permessi li decidono le regole del database'
	},
	ALPHA_PASSWORD: {
		schema: (v) => v || undefined,
		description: 'Se impostata, tutto il sito chiede questa password (versione alpha privata)'
	}
});
