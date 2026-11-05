// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Profilo } from '#lib/supabase/tipi.ts';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			utente: User | null;
			profilo: Profilo | null;
		}
		interface PageData {
			profilo: Profilo | null;
		}
	}
}

export {};
