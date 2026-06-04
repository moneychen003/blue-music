import SingleEvent from './SimpleSingleEvent'

export const localeEvent = new SingleEvent<[AnyListen_API.Locale]>()
export const configurationEvent = new SingleEvent<[keys: string[], configuration: Record<string, unknown>]>()
export const musicListActionEvent = new SingleEvent<[AnyListen.IPCList.ActionList]>()
export const playerEvent = new SingleEvent<[AnyListen.IPCPlayer.PlayerEvent]>()
export const playListActionEvent = new SingleEvent<[AnyListen.IPCPlayer.PlayListAction]>()
export const playHistoryListActionEvent = new SingleEvent<[AnyListen.IPCPlayer.PlayHistoryListAction]>()
