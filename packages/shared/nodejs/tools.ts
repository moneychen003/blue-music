import { unlink } from 'node:fs/promises'
import path from 'node:path'

import { DB_NAME } from '@any-listen/common/constants'

export const removeDB = async (dataPath: string) => {
  const dbPath = path.join(dataPath, DB_NAME)
  try {
    await Promise.all([unlink(dbPath), unlink(`${dbPath}-wal`), unlink(`${dbPath}-shm`)])
  } catch {}
}
