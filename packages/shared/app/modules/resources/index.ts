import type { ExtensionSeriveTypes } from '../worker/utils'
import { initService } from './shared'

export const initResources = (_extensionSerive: ExtensionSeriveTypes) => {
  void initService(_extensionSerive)
}

export { hotSearch, tipSearch } from './searchMeta'
export { getMusicLyric, getMusicLyricByExtensionSource, getLyric, lyricSearch } from './lyric'
export { getMusicPic, getMusicPicByExtensionSource, musicPicSearch } from './musicPic'
export { getMusicUrl, getMusicUrlByExtensionSource } from './musicUrl'
export { findMusic, musicSearch } from './musicSearch'
export { songlist, songlistSearch, songlistDetail, songlistSorts, songlistTags, songlistDetailAll } from './songlist'
export { topSongs, topSongsDate, topSongsDetail, topSongsDetailAll } from './topSongs'
export { musicComment } from './comment'
