import { settingEvent } from '@/modules/setting/store/event'

import { resetAllSorts } from './songlist/sorts/actions'
import { resetAllTags } from './songlist/tag/actions'

const resetData = () => {
  resetAllSorts()
  resetAllTags()
}

export const initResource = () => {
  settingEvent.on('updated', (keys, setting) => {
    if (!keys.includes('common.langId')) return
    resetData()
  })
}
