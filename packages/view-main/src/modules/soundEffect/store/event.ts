import _Event, { type EventType } from '@any-listen/web/Event'

class Event extends _Event {
  emitEvent<K extends keyof EventMethods>(eventName: K, ...args: any[]) {
    this.emit(eventName, ...args)
  }

  userEqPresetListUpdated(list: AnyListen.SoundEffect.EQPreset[]) {
    this.emitEvent('userEqPresetListUpdated', list)
  }

  userConvolutionPresetListUpdated(list: AnyListen.SoundEffect.ConvolutionPreset[]) {
    this.emitEvent('userConvolutionPresetListUpdated', list)
  }
}

type EventMethods = Omit<Event, keyof _Event | 'emitEvent'>

export const soundEffectEvent = new Event() as EventType<Event>
