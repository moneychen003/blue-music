import type { AbortSignal } from '@/event/AbortController'
import { hostContext } from '@/host/state'
import { generateId } from '@/utils'

/** requestKey is serialized to the host, whose matching controller aborts the actual network request. */
export const request: AnyListen_API.API['request'] = async <Resp = unknown>(url: string, { signal: rawSignal, ...options }: AnyListen_API.RequestOptions = {}): Promise<AnyListen_API.Response<Resp>> => {
  const signal = rawSignal as AbortSignal | undefined
  if (!signal) return hostContext.hostFuncs.request<Resp>(url, options)
  if (signal.aborted) throw Object.assign(new Error('Request cancelled'), { name: 'AbortError' })
  const requestKey = generateId()
  return new Promise((resolve, reject) => {
    let settled = false
    let unsubscribe = () => {}
    const cleanup = () => unsubscribe()
    const onAbort = () => {
      if (settled) return
      settled = true
      cleanup()
      void Promise.resolve(hostContext.hostFuncs.cancelRequest(requestKey)).catch(() => {})
      reject(Object.assign(new Error('Request cancelled'), { name: 'AbortError' }))
    }
    unsubscribe = signal.once('abort', onAbort)
    if (signal.aborted) { onAbort(); return }
    void hostContext.hostFuncs.request<Resp>(url, { ...options, requestKey })
      .then((response) => { if (!settled) { settled = true; cleanup(); resolve(response) } })
      .catch((error) => { if (!settled) { settled = true; cleanup(); reject(error) } })
  })
}
