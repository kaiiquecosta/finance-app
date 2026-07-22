/** Chaves centralizadas do TanStack Query. */
export const queryKeys = {
  finance: (userId: string) => ['finance', userId] as const,
  plan: (userId: string) => ['plan', userId] as const,
  profile: (userId: string) => ['profile', userId] as const,
}
