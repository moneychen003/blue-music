import { createClickHandle } from '@any-listen/web'

import { setShowPlayDetail } from '@/modules/playDetail/store/commit'

export const useHidePlayDtail = () => {
  const handleClick = createClickHandle(
    () => {},
    () => {
      setShowPlayDetail(false)
    }
  )
  const handleCtxMenu = (evt: MouseEvent) => {
    handleClick()
  }

  return handleCtxMenu
}
