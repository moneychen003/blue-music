import SingleEvent from '@any-listen/web/SimpleSingleEvent'

export const extensionEvent = new SingleEvent<[action: AnyListen.IPCExtension.EventExtension]>()
