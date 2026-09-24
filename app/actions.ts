'use server';

import { createClient } from '@supabase/supabase-js';

const serverSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sin-configurar.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sin-configurar'
);

export async function verifyAdminLogin(usernameInput: string, passwordInput: string) {
  const username = usernameInput.trim().toLowerCase();
  const password = passwordInput.trim();

  const { data, error } = await serverSupabase.rpc('verify_client_password', {
    input_username: username,
    input_password: password
  });

  if (error) {
    console.error('RPC login error in Server Action:', error);
    return { success: false, error: 'Error al iniciar sesión. Inténtalo de nuevo.' };
  }

  if (data && data.length > 0) {
    return {
      success: true,
      session: {
        role: data[0].role,
        clientId: data[0].client_id,
        displayName: data[0].display_name,
        passwordUsed: password
      }
    };
  }

  return { success: false, error: 'Usuario o contraseña incorrectos' };
}
