import SingleEvent from '@any-listen/web/SimpleSingleEvent'

export const dislikeActionEvent = new SingleEvent<[action: AnyListen.IPCDislikeList.ActionList]>()
