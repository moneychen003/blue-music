// AudioWorklet globals execute in AudioWorkletGlobalScope, not Window.
type WorkletAudioBuffer = Float32Array[][]
type WorkletParameters = Record<string, Float32Array>

interface WorkletProcessorOptions {
  numberOfInputs: number
  numberOfOutputs: number
  processorOptions: Record<string, number>
}

declare var AudioWorkletProcessor: {
  new (options: WorkletProcessorOptions): { readonly port: MessagePort }
}

declare var registerProcessor: (name: string, processorCtor: new (options: WorkletProcessorOptions) => object) => void
