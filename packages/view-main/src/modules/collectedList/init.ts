import { onPlayerCreated } from '@/modules/player/shared'

import { initCollectedLists } from './store'

export const initCollectedList = () => {
  onPlayerCreated(() => {
    void initCollectedLists()
  })
}
