import { type workerDBSeriveTypes } from '@any-listen/app/modules/worker/dbService'

declare global {
  // interface WorkerDBSeriveTypes {
  //   list: typeof list
  // }
  namespace AnyListen {
    type WorkerDBSeriveListTypes = workerDBSeriveTypes
  }
}
