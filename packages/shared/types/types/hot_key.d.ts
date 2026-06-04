declare namespace AnyListen {
  namespace HotKey {
    interface HotKeyDownInfo {
      type: 'local' | 'global'
      key: string
    }

    interface HotKeyConfig<T extends string> {
      enable: boolean
      keys: Record<string, T>
    }
    interface HotKeyConfigAll<T extends string> {
      local: HotKeyConfig<T>
      global: HotKeyConfig<T>
    }
    interface RegisterKeyInfo<T extends string> {
      key: string
      info: T
    }
    type HotKeyState<T extends string> = Map<
      string,
      {
        status: boolean
        info: T
      }
    >
    interface HotKeyActionWrap<T, D> {
      action: T
      data: D
      source?: string
    }
    type HotKeyActions<T extends string> =
      | HotKeyActionWrap<'config', HotKeyConfigAll<T>>
      | HotKeyActionWrap<'enable', boolean>
      | HotKeyActionWrap<'tempDisable', boolean>
      | HotKeyActionWrap<'register', RegisterKeyInfo<T>>
      | HotKeyActionWrap<'unregister', string>
  }
}
