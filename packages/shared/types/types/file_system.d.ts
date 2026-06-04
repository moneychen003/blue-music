declare namespace AnyListen {
  namespace FileSystem {
    // interface IPCActionBase<A> {
    //   action: A
    // }
    // interface IPCActionData<A, D> extends IPCActionBase<A> {
    //   data: D
    // }
    // type IPCAction<A, D = undefined> = D extends undefined ? IPCActionBase<A> : IPCActionData<A, D>

    type IPCReturnAction<A, R = undefined, P = undefined> = [IPCAction<A, P>, R]
    interface File {
      name: string
      isFile: boolean
      // size: number
      // lastModified: number
    }

    type ReadDir = [
      {
        path: string
        isDirOnly?: boolean
        fileFilter?: string[]
      },
      File[],
    ]
    type Move = [
      {
        path: string
        newPath: string
      },
      undefined,
    ]
    interface Actions {
      read_root_dir: IPCReturnAction<'read_root_dir', File[]>
      read_dir: IPCReturnAction<'read_dir', ReadDir[1], ReadDir[0]>
      rename: IPCReturnAction<'rename', Move[1], Move[0]>
    }
  }
}
