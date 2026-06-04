import type Router from '@koa/router'

import { LIST_IDS } from '@any-listen/common/constants'

import { checkAllowPath } from '@/app/modules/fileSystem'
import { workers } from '@/app/worker'
import { sendFileStream } from '@/middleware/shared/stream-file'

import { requireApiPermission } from './apiAuth'

interface LibraryTrack {
  id: string
  listId: string
  listName: string
  musicInfo: AnyListen.Music.MusicInfo
}

const API_VERSION = '1.16.1'

const encodeId = (listId: string, musicId: string) => `${encodeURIComponent(listId)}~${encodeURIComponent(musicId)}`
const decodeId = (id: string) => {
  const [listId = '', musicId = ''] = id.split('~', 2)
  return {
    listId: decodeURIComponent(listId),
    musicId: decodeURIComponent(musicId),
  }
}
const queryValue = (ctx: AnyListen.RequestContext, key: string) => {
  const value = ctx.query[key]
  return Array.isArray(value) ? value[0] : value
}
const ok = (ctx: AnyListen.RequestContext, data: Record<string, unknown> = {}) => {
  ctx.body = {
    'subsonic-response': {
      status: 'ok',
      version: API_VERSION,
      type: 'any-listen',
      serverVersion: global.anylisten.config.serverName || 'Any Listen',
      ...data,
    },
  }
}
const fail = (ctx: AnyListen.RequestContext, code: number, message: string) => {
  ctx.body = {
    'subsonic-response': {
      status: 'failed',
      version: API_VERSION,
      error: {
        code,
        message,
      },
    },
  }
}
const getLibrary = async (): Promise<LibraryTrack[]> => {
  const listData = await workers.dbService.getAllUserLists()
  const lists = [listData.defaultList, listData.loveList, ...listData.userList].filter((listInfo) => listInfo.id != LIST_IDS.LAST_PLAYED)
  const rows = await Promise.all(
    lists.map(async (listInfo) => {
      const musics = await workers.dbService.getListMusics(listInfo.id)
      return musics.map((musicInfo) => ({
        id: encodeId(listInfo.id, musicInfo.id),
        listId: listInfo.id,
        listName: listInfo.name,
        musicInfo,
      }))
    })
  )
  return rows.flat()
}
const findTrack = async (id: string) => {
  const { listId, musicId } = decodeId(id)
  if (!listId || !musicId) return null
  const list = await workers.dbService.getListMusics(listId)
  const musicInfo = list.find((music) => music.id == musicId)
  if (!musicInfo) return null
  const listData = await workers.dbService.getAllUserLists()
  const listInfo = [listData.defaultList, listData.loveList, ...listData.userList].find((item) => item.id == listId)
  return {
    id,
    listId,
    listName: listInfo?.name ?? listId,
    musicInfo,
  } satisfies LibraryTrack
}
const toChild = (track: LibraryTrack) => {
  const musicInfo = track.musicInfo
  return {
    id: track.id,
    parent: track.listId,
    title: musicInfo.name,
    album: musicInfo.meta.albumName,
    artist: musicInfo.singer,
    isDir: false,
    duration: musicInfo.interval,
    suffix: musicInfo.isLocal ? musicInfo.meta.ext : musicInfo.meta.ext,
    contentType: musicInfo.isLocal ? `audio/${musicInfo.meta.ext}` : 'audio/mpeg',
    path: musicInfo.isLocal ? musicInfo.meta.filePath : undefined,
  }
}
const groupBy = <T>(items: T[], getKey: (item: T) => string) => {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = getKey(item).trim() || 'Unknown'
    const list = map.get(key)
    if (list) list.push(item)
    else map.set(key, [item])
  }
  return map
}
const getAction = (ctx: AnyListen.RequestContext) => String(ctx.params.action || '').replace(/\.view$/, '')

export const registerSubsonicRouter = (router: Router<unknown, AnyListen.RequestContext>) => {
  router.get('/rest/:action', async (ctx) => {
    const action = getAction(ctx)
    const streamActions = new Set(['stream', 'download'])
    if (!requireApiPermission(ctx, streamActions.has(action) ? 'library:stream' : 'library:read')) {
      fail(ctx, 40, 'Wrong username or password')
      return
    }

    switch (action) {
      case 'ping':
      case 'getLicense':
        ok(ctx)
        return
      case 'getMusicFolders': {
        const listData = await workers.dbService.getAllUserLists()
        const lists = [listData.defaultList, listData.loveList, ...listData.userList]
        ok(ctx, {
          musicFolders: {
            musicFolder: lists.map((listInfo) => ({
              id: listInfo.id,
              name: listInfo.name,
            })),
          },
        })
        return
      }
      case 'getArtists':
      case 'getIndexes': {
        const library = await getLibrary()
        const artists = Array.from(groupBy(library, (track) => track.musicInfo.singer).entries()).map(([name, items]) => ({
          id: `artist~${encodeURIComponent(name)}`,
          name,
          albumCount: groupBy(items, (track) => track.musicInfo.meta.albumName).size,
          songCount: items.length,
        }))
        artists.sort((a, b) => a.name.localeCompare(b.name))
        if (action == 'getArtists') {
          ok(ctx, {
            artists: {
              index: [
                {
                  name: '#',
                  artist: artists,
                },
              ],
            },
          })
        } else {
          ok(ctx, {
            indexes: {
              ignoredArticles: '',
              index: [
                {
                  name: '#',
                  artist: artists,
                },
              ],
            },
          })
        }
        return
      }
      case 'getAlbumList2': {
        const library = await getLibrary()
        const albums = Array.from(groupBy(library, (track) => track.musicInfo.meta.albumName).entries()).map(([name, items]) => ({
          id: `album~${encodeURIComponent(name)}`,
          name,
          artist: items[0].musicInfo.singer,
          songCount: items.length,
          duration: 0,
          created: new Date(Math.max(...items.map((item) => item.musicInfo.meta.createTime || 0))).toISOString(),
        }))
        ok(ctx, {
          albumList2: {
            album: albums,
          },
        })
        return
      }
      case 'getAlbum': {
        const id = String(queryValue(ctx, 'id') || '')
        const albumName = id.startsWith('album~') ? decodeURIComponent(id.substring(6)) : id
        const songs = (await getLibrary()).filter((track) => (track.musicInfo.meta.albumName || 'Unknown') == albumName)
        ok(ctx, {
          album: {
            id,
            name: albumName,
            artist: songs[0]?.musicInfo.singer ?? '',
            songCount: songs.length,
            song: songs.map(toChild),
          },
        })
        return
      }
      case 'getSong': {
        const id = String(queryValue(ctx, 'id') || '')
        const track = await findTrack(id)
        if (!track) {
          fail(ctx, 70, 'Song not found')
          return
        }
        ok(ctx, {
          song: toChild(track),
        })
        return
      }
      case 'search3': {
        const query = String(queryValue(ctx, 'query') || '').toLowerCase()
        const matches = (await getLibrary()).filter((track) => {
          const music = track.musicInfo
          return [music.name, music.singer, music.meta.albumName].some((value) => value.toLowerCase().includes(query))
        })
        ok(ctx, {
          searchResult3: {
            song: matches.slice(0, 100).map(toChild),
          },
        })
        return
      }
      case 'stream':
      case 'download': {
        const id = String(queryValue(ctx, 'id') || '')
        const track = await findTrack(id)
        if (!track || !track.musicInfo.isLocal || !checkAllowPath(track.musicInfo.meta.filePath)) {
          fail(ctx, 70, 'Song not found')
          return
        }
        await sendFileStream(ctx, track.musicInfo.meta.filePath, {
          hidden: false,
          maxAge: 0,
          public: false,
        })
        return
      }
      default:
        fail(ctx, 0, `Unsupported Subsonic action: ${action}`)
    }
  })
}

