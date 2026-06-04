export const queryType = ['list', 'detail'] as const
export type QueryType = (typeof queryType)[number]

export const topSongsUrlParamKeyMap = {
  date: 'dt',
}

export const buildTopSongsDetailUrl = (meta: { id: string; sid?: string; mid?: string; s?: string }) => {
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const query = new URLSearchParams(meta).toString()
  return {
    url: `/online/topSongs?${query}`,
    path: '/online/topSongs',
    meta,
  }
}
