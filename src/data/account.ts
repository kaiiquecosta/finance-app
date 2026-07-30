/**
 * Exclusão de conta (LGPD, direito ao esquecimento). Chama a Edge Function
 * que apaga o usuário no servidor — todas as tabelas têm
 * `on delete cascade` a partir de `auth.users`, então uma única exclusão
 * remove profile, plans e todos os dados financeiros automaticamente.
 */
import { supabase } from './supabase'

export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ error?: string }>('delete-account')
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  await supabase.auth.signOut()
}
