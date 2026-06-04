import { exposeWorker } from '../utils/worker'
import { init, backupDB } from './db'
import {
  collected_list,
  dislike_list,
  download,
  lyric,
  metadata,
  music_library,
  music_other_source,
  music_url,
  play_count,
  play_list,
} from './modules/index'

const common = {
  init,
  backupDB,
}

void exposeWorker<{
  inited: () => void
}>({
  ...common,
  ...metadata,
  ...play_list,
  ...music_library,
  ...lyric,
  ...music_url,
  ...music_other_source,
  ...download,
  ...dislike_list,
  ...play_count,
  ...collected_list,
}).then(({ remote }) => {
  remote.inited()
})

export type workerDBSeriveTypes = typeof common &
  typeof metadata &
  typeof play_list &
  typeof music_library &
  typeof lyric &
  typeof music_url &
  typeof music_other_source &
  typeof download &
  typeof dislike_list &
  typeof play_count &
  typeof collected_list
