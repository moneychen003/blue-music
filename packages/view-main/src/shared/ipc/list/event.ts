import SingleEvent from '@any-listen/web/SimpleSingleEvent'

export const listActionEvent = new SingleEvent<[action: AnyListen.IPCList.ActionList]>()
