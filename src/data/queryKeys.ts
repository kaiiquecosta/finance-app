/** Chaves centralizadas do TanStack Query. */
export const queryKeys = {
  finance: (userId: string) => ['finance', userId] as const,
  plan: (userId: string) => ['plan', userId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  community: () => ['community', 'board'] as const,
  communityComments: (itemId: number) => ['community', 'comments', itemId] as const,
  investorFavorites: (userId: string) => ['investor', 'favorites', userId] as const,
}
