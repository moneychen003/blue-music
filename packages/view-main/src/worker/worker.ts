import { type WorkerMainTypes, createMainWorker } from './utils'

let mainWorker: WorkerMainTypes
// let downloadWorker: AnyListen.WorkerDownloadTypes

export const workers = {
  get main() {
    return mainWorker
  },
  // get download() {
  //   return downloadWorker
  // },
}

export const createWorkers = () => {
  mainWorker = createMainWorker()
  // downloadWorker = createDownloadWorker()
}
