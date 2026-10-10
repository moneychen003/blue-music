import { randomUUID } from 'node:crypto'

// Session-only circuit breaker; empty search results and user cancellation are not source failures.
const failures = new Map<string, { count: number; retryAt: number }>()
const keyOf = (action: string, sourceId: string) => `${action}:${sourceId}`

export const isSourceCoolingDown = (action: string, sourceId: string) => {
  const key = keyOf(action, sourceId)
  const state = failures.get(key)
  if (!state) return false
  if (state.retryAt && state.retryAt <= Date.now()) {
    failures.delete(key)
    return false
  }
  return state.retryAt > Date.now()
}

export const sourceAbortError = () => Object.assign(new Error('Music source request cancelled'), { name: 'AbortError' })

/** The serializable request ID crosses the worker boundary; AbortSignal itself never does. */
export const runSourceAction = async <T>(
  action: string,
  sourceId: string,
  timeout: number,
  operation: (signal: AbortSignal, requestId: string) => Promise<T>,
  options: { signal?: AbortSignal; cancel?: (requestId: string) => void | Promise<void> } = {}
): Promise<T> => {
  const key = keyOf(action, sourceId)
  if (options.signal?.aborted) throw sourceAbortError()
  if (isSourceCoolingDown(action, sourceId)) throw new Error('Music source cooling down')
  const controller = new AbortController()
  const requestId = randomUUID()
  let timedOut = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let rejectAbort!: (error: Error) => void
  const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject })
  const onAbort = () => {
    if (controller.signal.aborted) return
    controller.abort()
    if (options.cancel) void Promise.resolve(options.cancel(requestId)).catch(() => {})
    rejectAbort(timedOut ? new Error(`Music source ${action} timed out`) : sourceAbortError())
  }
  const onExternalAbort = () => onAbort()
  options.signal?.addEventListener('abort', onExternalAbort, { once: true })
  timer = setTimeout(() => { timedOut = true; onAbort() }, timeout)
  if (options.signal?.aborted) onAbort()
  try {
    const result = await Promise.race([Promise.resolve().then(() => {
      if (controller.signal.aborted) throw sourceAbortError()
      return operation(controller.signal, requestId)
    }), aborted])
    if (controller.signal.aborted) throw timedOut ? new Error(`Music source ${action} timed out`) : sourceAbortError()
    failures.delete(key)
    return result
  } catch (error) {
    if (!controller.signal.aborted || timedOut) {
      const count = (failures.get(key)?.count ?? 0) + 1
      failures.set(key, { count, retryAt: count >= 2 ? Date.now() + 60_000 : 0 })
    }
    throw error
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', onExternalAbort)
  }
}
