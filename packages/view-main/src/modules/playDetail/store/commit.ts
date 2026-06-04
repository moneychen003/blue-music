import { playDetailEvent } from './event'
import { playDetailState } from './state'

// export const setInited = (init: boolean) => {
//   appState.inited = init
//   appEvent.inited()
// }

// export const setShowLogin = (show: boolean) => {
//   appState.showLogin = show
//   appEvent.showLogin()
// }

export const setShowPlayDetail = (visible: boolean) => {
  playDetailState.isShowPlayDetail = visible
  playDetailEvent.visible(visible)
}
