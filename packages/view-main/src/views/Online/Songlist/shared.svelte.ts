export const queryType = ['list', 'detail'] as const
export type QueryType = (typeof queryType)[number]

export const songlistUrlParamKeyMap = {
  tag: 'tg',
  sort: 'st',
}

export const buildSonglistDetailUrl = (meta: { id: string; sid?: string; mid?: string; s?: string }) => {
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const query = new URLSearchParams(meta).toString()
  return {
    url: `/online/songlist?${query}`,
    path: `/online/songlist`,
    meta,
  }
}
