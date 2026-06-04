import { initWinMain } from './winMain'
import { initWinLyric } from './winLyric'

export const initRenderers = async () => {
  initWinMain()
  initWinLyric()
}
