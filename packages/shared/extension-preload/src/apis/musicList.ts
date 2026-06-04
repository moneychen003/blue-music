import { musicListActionEvent } from '@/event'
import { hostContext } from '@/host/state'

export const musicList: AnyListen_API.MusicList = {
  async getAllUserLists() {
    return hostContext.hostFuncs.getAllUserLists()
  },
  async getListMusics(id) {
    return hostContext.hostFuncs.getListMusics(id)
  },
  async listAction(action) {
    return hostContext.hostFuncs.listAction(action)
  },
  onListAction: musicListActionEvent.on.bind(musicListActionEvent),
}
