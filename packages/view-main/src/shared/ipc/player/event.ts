import SingleEvent from '@any-listen/web/SimpleSingleEvent'

export const playerActionEvent = new SingleEvent<[action: AnyListen.IPCPlayer.ActionPlayer]>()

export const playListActionEvent = new SingleEvent<[action: AnyListen.IPCPlayer.PlayListAction]>()

export const playHistoryListActionEvent = new SingleEvent<[action: AnyListen.IPCPlayer.PlayHistoryListAction]>()
