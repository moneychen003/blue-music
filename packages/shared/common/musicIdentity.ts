/** One conservative identity rule for both showing and removing a favorite. */
type MusicIdentity = Pick<AnyListen.Music.MusicInfo, 'id' | 'isLocal' | 'name' | 'singer' | 'interval' | 'meta'>
const normalize = (value?: string | null) => (value ?? '').normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g, ' ')
const seconds = (interval: string | null) => {
  if (!interval) return null
  const parts = interval.split(':').map(Number)
  return parts.length >= 2 && parts.every(Number.isFinite) ? parts.reduce((sum, n) => sum * 60 + n, 0) : null
}
export const matchingFavoriteIds = (list: MusicIdentity[], target: MusicIdentity): string[] => {
  const exact = list.filter((music) => music.id === target.id)
  if (exact.length) return exact.map((music) => music.id)
  if (target.isLocal || !normalize(target.name) || !normalize(target.singer)) return []
  return list.filter((music) => {
    if (music.isLocal || normalize(music.name) !== normalize(target.name) || normalize(music.singer) !== normalize(target.singer)) return false
    const album = normalize(music.meta.albumName)
    const targetAlbum = normalize(target.meta.albumName)
    if (album && targetAlbum && album !== targetAlbum) return false
    const duration = seconds(music.interval)
    const targetDuration = seconds(target.interval)
    return duration === null || targetDuration === null || Math.abs(duration - targetDuration) <= 5
  }).map((music) => music.id)
}
