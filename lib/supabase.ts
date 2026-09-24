import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Sin claves el build seguía adelante hasta reventar al prerenderizar
  // /admin. Mejor un aviso claro y un cliente inerte.
  console.warn(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY: ' +
      'las confirmaciones y las canciones no se guardarán.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://sin-configurar.supabase.co',
  supabaseAnonKey || 'sin-configurar'
);
