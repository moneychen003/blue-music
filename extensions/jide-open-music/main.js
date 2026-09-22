/* 技得开放音乐 — transparent local adapter; no remote scripts, accounts, or signature bypass. */
(function () {
  'use strict'
  const api = require('any-listen')
  const ARCHIVE = 'https://archive.org'
  const MUSOPEN = 'MusopenCollectionAsFlac'
  const cache = new Map()
  const text = (x) => Array.isArray(x) ? x.join(' / ') : String(x || '')
  const enc = encodeURIComponent
  const safeFile = (name) => String(name).split('/').map(enc).join('/')
  const publicLicense = (license) => /^https?:\/\/creativecommons\.org\/publicdomain\/(zero|mark)\/1\.0\/?$/.test(text(license))
  async function json(url, query) {
    const res = await api.request(url, { query, timeout: 12000, maxRedirect: 3 })
    if (res.statusCode !== 200) throw new Error(`开放音乐接口 HTTP ${res.statusCode || 'unknown'}`)
    return typeof res.body === 'string' ? JSON.parse(res.body) : res.body
  }
  async function item(id) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(id)) throw new Error('Invalid Archive item identifier')
    const prior = cache.get(id)
    if (prior && Date.now() - prior.time < 600000) return prior.data
    const data = await json(`${ARCHIVE}/metadata/${enc(id)}`)
    if (!publicLicense(data.metadata?.licenseurl)) throw new Error('仅允许明确标记 CC0 / Public Domain 的条目')
    if (cache.size >= 30) cache.delete(cache.keys().next().value)
    cache.set(id, { time: Date.now(), data })
    return data
  }
  function archiveTracks(id, data, source) {
    return (data.files || []).filter(f => /\.mp3$/i.test(f.name) && !f.private).map(f => {
      const original = (data.files || []).find(x => x.name === f.original && /\.flac$/i.test(x.name) && !x.private)
      const size = Number(f.size) > 0 ? `${(Number(f.size) / 1048576).toFixed(1)} MB` : null
      const qualitys = { '128k': { sizeStr: size } }
      if (original) qualitys.flac = { sizeStr: Number(original.size) > 0 ? `${(Number(original.size) / 1048576).toFixed(1)} MB` : null }
      return { id: `${source}:${id}:${f.name}`, name: text(f.title) || f.name.replace(/^.*\//, '').replace(/\.mp3$/i, ''),
        singer: text(f.creator || data.metadata.creator), interval: typeof f.length === 'string' && f.length.includes(':') ? f.length : null, isLocal: false,
        meta: { source, musicId: `${id}/${f.name}`, albumName: text(f.album || data.metadata.title), createTime: 0, updateTime: 0, posTime: 0,
          picUrl: `${ARCHIVE}/services/img/${enc(id)}`, qualitys, bitrateLabel: f.bitrate ? `VBR ${f.bitrate} kbps` : 'Original MP3',
          archiveItem: id, archiveFile: f.name, archiveFlac: original?.name || '', licenseUrl: text(data.metadata.licenseurl) } }
    })
  }
  api.registerResourceAction({
    async musicSearch({ source, name, artist, page = 1, limit = 20 }) {
      page = Math.max(1, Math.floor(page)); limit = Math.min(50, Math.max(1, Math.floor(limit)))
      if (source === 'musopen') {
        const all = archiveTracks(MUSOPEN, await item(MUSOPEN), source)
        const words = [name, artist].filter(Boolean).join(' ').toLowerCase().split(/\s+/).filter(Boolean)
        const matched = all.filter(t => words.every(w => `${t.name} ${t.singer} ${t.meta.albumName || ''}`.toLowerCase().includes(w)))
        return { list: matched.slice((page - 1) * limit, page * limit), total: matched.length, page, limit }
      }
      if (source !== 'archive_cc0') throw new Error('Unsupported open music source')
      // Escape user text as a literal search phrase: never let query syntax broaden the license filter.
      const keyword = [name, artist].filter(Boolean).join(' ').replace(/[\\"]/g, '\\$&')
      const q = `mediatype:audio AND format:"VBR MP3" AND licenseurl:"http://creativecommons.org/publicdomain/zero/1.0/"${keyword ? ` AND "${keyword}"` : ''}`
      // 5 item metadata requests per search at most. Results represent tracks from matching archive items.
      const found = await json(`${ARCHIVE}/advancedsearch.php`, { q, output: 'json', rows: 5, page })
      const list = []
      for (const doc of found.response?.docs || []) {
        try { const tracks = archiveTracks(doc.identifier, await item(doc.identifier), source); if (tracks[0]) list.push(tracks[0]) } catch (_) { /* restricted/deleted item: skip */ }
      }
      // This source is item-level discovery: one representative MP3 per Archive item.
      return { list, page, limit: 5, total: Number(found.response?.numFound) || 0 }
    },
    async musicUrl({ source, musicInfo, quality }) {
      if (!['musopen', 'archive_cc0'].includes(source)) throw new Error('Unsupported open music source')
      const id = String(musicInfo.meta.archiveItem || '')
      const data = await item(id) // Revalidate public license; never trust imported playlist metadata.
      const filename = quality === 'flac' && musicInfo.meta.archiveFlac ? musicInfo.meta.archiveFlac : musicInfo.meta.archiveFile
      if (!(data.files || []).some(f => f.name === filename && !f.private && /\.(mp3|flac)$/i.test(f.name))) throw new Error('Archive audio file unavailable')
      return { url: `${ARCHIVE}/download/${enc(id)}/${safeFile(filename)}`, quality: /\.flac$/i.test(filename) ? 'flac' : '128k' }
    },
    async musicPic({ musicInfo }) { return musicInfo.meta.picUrl || '' }
  })
})()
