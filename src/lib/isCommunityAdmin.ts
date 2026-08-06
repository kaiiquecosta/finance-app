import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/domain/entities'

const adminEmails = (): Set<string> => {
  const raw = import.meta.env.VITE_ADMIN_EMAILS ?? ''
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

/** UI de admin (mover colunas). RLS no Supabase usa profiles.is_admin. */
export function isCommunityAdmin(user: User | null | undefined, profile: Profile | null | undefined): boolean {
  if (profile?.isAdmin) return true
  const email = user?.email?.toLowerCase()
  if (!email) return false
  return adminEmails().has(email)
}
