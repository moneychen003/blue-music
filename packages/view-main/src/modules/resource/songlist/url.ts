type SourceLike = {
  id: string
  sId?: string
  name?: string
  extensionId: string
}

export type ParsedSonglistInput = {
  id: string
  platform: 'netease' | null
}

export const parseSonglistInput = (input: string): ParsedSonglistInput | null => {
  const text = input.trim()
  if (!text) return null
  const normalized = /^https?:\/\//i.test(text) ? text : text.includes('music.163.com') ? `https://${text}` : text
  try {
    const url = new URL(normalized)
    const host = url.hostname.toLowerCase()
    if (host.includes('music.163.com') || host.includes('163cn.tv')) {
      const id = url.searchParams.get('id') || url.pathname.match(/(?:playlist|songlist)\/(\d+)/)?.[1]
      if (id) return { id, platform: 'netease' }
    }
    const id = url.searchParams.get('id')
    if (id) return { id, platform: null }
  } catch {}

  const id = text.match(/(?:id=)?(\d{3,})/)?.[1]
  return id ? { id, platform: null } : null
}

export const guessSonglistSourceId = (platform: ParsedSonglistInput['platform'], sources: SourceLike[]) => {
  if (!sources.length) return ''
  if (platform == 'netease') {
    const source = sources.find((s) => {
      const text = `${s.sId ?? ''} ${s.id} ${s.name ?? ''} ${s.extensionId}`.toLowerCase()
      return text.includes('netease') || text.includes('wy') || text.includes('网易')
    })
    if (source) return source.sId ?? source.id
  }
  return sources[0].sId ?? sources[0].id
}
