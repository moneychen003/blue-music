// Session-only circuit breaker; empty search results are not source failures.
// Cool down only after repeated errors and retry automatically after one minute.
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

export const runSourceAction = async <T>(
  action: string,
  sourceId: string,
  timeout: number,
  operation: () => Promise<T>
): Promise<T> => {
  const key = keyOf(action, sourceId)
  if (isSourceCoolingDown(action, sourceId)) throw new Error('Music source cooling down')
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const result = await Promise.race([
      Promise.resolve().then(operation),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Music source ${action} timed out`))
        }, timeout)
      }),
    ])
    failures.delete(key)
    return result
  } catch (error) {
    const count = (failures.get(key)?.count ?? 0) + 1
    failures.set(key, { count, retryAt: count >= 2 ? Date.now() + 60_000 : 0 })
    throw error
  } finally {
    clearTimeout(timer)
  }
}
