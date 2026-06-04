import { createCache } from '@any-listen/common/cache'

const cache = createCache({
  max: 10000,
  ttl: 1000 * 60 * 60 * 24 * 2,
})

export default cache
