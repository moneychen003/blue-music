import type { workerMainTypes } from '@/worker/main/main.worker'
// import { type workerDownloadTypes } from '@/worker/download/download.worker'

declare global {
  namespace AnyListen {
    type WorkerMainTypes = workerMainTypes
    // type WorkerDownloadTypes = workerDownloadTypes
  }
}
