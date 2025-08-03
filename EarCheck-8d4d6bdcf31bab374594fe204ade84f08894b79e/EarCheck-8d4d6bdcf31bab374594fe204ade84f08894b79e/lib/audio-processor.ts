// Audio processing utilities for cough analysis
export class AudioProcessor {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  // Extract MFCC features from audio data
  extractMFCCFeatures(audioBuffer: AudioBuffer): Float32Array {
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate

    // Pre-emphasis filter
    const preEmphasized = this.preEmphasis(channelData, 0.97)

    // Windowing and FFT
    const windowSize = 2048
    const hopSize = 512
    const numFrames = Math.floor((preEmphasized.length - windowSize) / hopSize) + 1

    const mfccFeatures = new Float32Array(numFrames * 13) // 13 MFCC coefficients

    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize
      const frameData = preEmphasized.slice(start, start + windowSize)

      // Apply Hamming window
      const windowed = this.applyHammingWindow(frameData)

      // Compute MFCC for this frame
      const mfcc = this.computeMFCC(windowed, sampleRate)

      // Store in feature array
      for (let i = 0; i < 13; i++) {
        mfccFeatures[frame * 13 + i] = mfcc[i]
      }
    }

    return mfccFeatures
  }

  private preEmphasis(signal: Float32Array, alpha: number): Float32Array {
    const result = new Float32Array(signal.length)
    result[0] = signal[0]

    for (let i = 1; i < signal.length; i++) {
      result[i] = signal[i] - alpha * signal[i - 1]
    }

    return result
  }

  private applyHammingWindow(frame: Float32Array): Float32Array {
    const windowed = new Float32Array(frame.length)
    const N = frame.length

    for (let n = 0; n < N; n++) {
      const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (N - 1))
      windowed[n] = frame[n] * window
    }

    return windowed
  }

  private computeMFCC(frame: Float32Array, sampleRate: number): Float32Array {
    // Simplified MFCC computation
    // In production, you'd use a proper MFCC library
    const mfcc = new Float32Array(13)

    // Compute power spectrum
    const fft = this.computeFFT(frame)
    const powerSpectrum = new Float32Array(fft.length / 2)

    for (let i = 0; i < powerSpectrum.length; i++) {
      const real = fft[i * 2]
      const imag = fft[i * 2 + 1]
      powerSpectrum[i] = real * real + imag * imag
    }

    // Apply mel filter bank and DCT (simplified)
    for (let i = 0; i < 13; i++) {
      let sum = 0
      for (let j = 0; j < powerSpectrum.length; j++) {
        sum += Math.log(powerSpectrum[j] + 1e-10) * Math.cos((Math.PI * i * (j + 0.5)) / powerSpectrum.length)
      }
      mfcc[i] = sum
    }

    return mfcc
  }

  private computeFFT(signal: Float32Array): Float32Array {
    // Simplified FFT - in production use a proper FFT library
    const N = signal.length
    const result = new Float32Array(N * 2) // Real and imaginary parts

    for (let k = 0; k < N; k++) {
      let realSum = 0
      let imagSum = 0

      for (let n = 0; n < N; n++) {
        const angle = (-2 * Math.PI * k * n) / N
        realSum += signal[n] * Math.cos(angle)
        imagSum += signal[n] * Math.sin(angle)
      }

      result[k * 2] = realSum
      result[k * 2 + 1] = imagSum
    }

    return result
  }

  // Convert audio blob to AudioBuffer
  async processAudioBlob(blob: Blob): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error("AudioContext not available")
    }

    const arrayBuffer = await blob.arrayBuffer()
    return await this.audioContext.decodeAudioData(arrayBuffer)
  }

  // Analyze cough characteristics
  analyzeCoughCharacteristics(audioBuffer: AudioBuffer): CoughAnalysis {
    const channelData = audioBuffer.getChannelData(0)

    // Extract basic features
    const duration = audioBuffer.duration
    const rms = this.calculateRMS(channelData)
    const zcr = this.calculateZeroCrossingRate(channelData)
    const spectralCentroid = this.calculateSpectralCentroid(channelData, audioBuffer.sampleRate)

    // Extract MFCC features
    const mfccFeatures = this.extractMFCCFeatures(audioBuffer)

    return {
      duration,
      rms,
      zeroCrossingRate: zcr,
      spectralCentroid,
      mfccFeatures,
      timestamp: Date.now(),
    }
  }

  private calculateRMS(signal: Float32Array): number {
    let sum = 0
    for (let i = 0; i < signal.length; i++) {
      sum += signal[i] * signal[i]
    }
    return Math.sqrt(sum / signal.length)
  }

  private calculateZeroCrossingRate(signal: Float32Array): number {
    let crossings = 0
    for (let i = 1; i < signal.length; i++) {
      if (signal[i] >= 0 !== signal[i - 1] >= 0) {
        crossings++
      }
    }
    return crossings / signal.length
  }

  private calculateSpectralCentroid(signal: Float32Array, sampleRate: number): number {
    const fft = this.computeFFT(signal)
    const powerSpectrum = new Float32Array(fft.length / 2)

    let weightedSum = 0
    let magnitudeSum = 0

    for (let i = 0; i < powerSpectrum.length; i++) {
      const real = fft[i * 2]
      const imag = fft[i * 2 + 1]
      const magnitude = Math.sqrt(real * real + imag * imag)
      const frequency = (i * sampleRate) / (2 * powerSpectrum.length)

      weightedSum += frequency * magnitude
      magnitudeSum += magnitude
    }

    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
  }
}

export interface CoughAnalysis {
  duration: number
  rms: number
  zeroCrossingRate: number
  spectralCentroid: number
  mfccFeatures: Float32Array
  timestamp: number
}
