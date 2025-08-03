"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Play, Download, AudioWaveformIcon as Waveform } from "lucide-react"
import { AudioProcessor, type CoughAnalysis } from "@/lib/audio-processor"
import { CoughClassifier, type CoughClassification } from "@/lib/cough-classifier"

interface EnhancedAudioCaptureProps {
  isRecording: boolean
  onAnalysisComplete?: (analysis: CoughAnalysis, classification: CoughClassification) => void
}

export default function EnhancedAudioCapture({ isRecording, onAnalysisComplete }: EnhancedAudioCaptureProps) {
  const [audioLevel, setAudioLevel] = useState(0)
  const [hasPermission, setHasPermission] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const animationRef = useRef<number>()
  const audioChunksRef = useRef<Blob[]>([])

  const [audioProcessor] = useState(() => new AudioProcessor())
  const [coughClassifier] = useState(() => new CoughClassifier())

  useEffect(() => {
    if (isRecording) {
      startAudioCapture()
    } else {
      stopAudioCapture()
    }

    return () => {
      stopAudioCapture()
    }
  }, [isRecording])

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      streamRef.current = stream
      setHasPermission(true)

      // Set up audio analysis
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Set up recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setRecordedBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))

        // Analyze the recorded audio
        await analyzeRecordedAudio(blob)
      }

      mediaRecorder.start(100) // Collect data every 100ms

      // Start real-time audio level monitoring
      updateAudioLevel()
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setHasPermission(false)
    }
  }

  const stopAudioCapture = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setAudioLevel(0)
  }

  const updateAudioLevel = () => {
    if (analyserRef.current && isRecording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)

      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      setAudioLevel(Math.min(100, (average / 255) * 100 * 3))

      animationRef.current = requestAnimationFrame(updateAudioLevel)
    }
  }

  const analyzeRecordedAudio = async (blob: Blob) => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Convert blob to AudioBuffer
      setAnalysisProgress(20)
      const audioBuffer = await audioProcessor.processAudioBlob(blob)

      // Extract audio features
      setAnalysisProgress(50)
      const analysis = audioProcessor.analyzeCoughCharacteristics(audioBuffer)

      // Classify the cough
      setAnalysisProgress(80)
      const classification = await coughClassifier.classifyCough(analysis)

      setAnalysisProgress(100)

      // Call the callback with results
      onAnalysisComplete?.(analysis, classification)
    } catch (error) {
      console.error("Error analyzing audio:", error)
    } finally {
      setIsAnalyzing(false)
      setTimeout(() => setAnalysisProgress(0), 1000)
    }
  }

  const downloadRecording = () => {
    if (audioUrl) {
      const a = document.createElement("a")
      a.href = audioUrl
      a.download = `cough-recording-${Date.now()}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {hasPermission && isRecording ? (
            <Mic className="h-5 w-5 text-green-600" />
          ) : (
            <MicOff className="h-5 w-5 text-gray-400" />
          )}
          Enhanced Audio Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio Level Visualization */}
        <div className="flex items-center justify-center h-32">
          <div className="relative">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                isRecording && hasPermission
                  ? "bg-green-100 border-2 border-green-500"
                  : "bg-gray-100 border-2 border-gray-300"
              }`}
              style={{
                transform: isRecording ? `scale(${1 + audioLevel / 150})` : "scale(1)",
              }}
            >
              {hasPermission && isRecording ? (
                <Mic className="h-10 w-10 text-green-600" />
              ) : (
                <MicOff className="h-10 w-10 text-gray-400" />
              )}
            </div>

            {/* Animated rings for audio level */}
            {isRecording && hasPermission && audioLevel > 10 && (
              <>
                <div
                  className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"
                  style={{ opacity: audioLevel / 100 }}
                />
                <div
                  className="absolute inset-[-12px] rounded-full border border-green-300 animate-pulse"
                  style={{ opacity: audioLevel / 200 }}
                />
              </>
            )}
          </div>
        </div>

        {/* Audio Level Meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Audio Level</span>
            <span>{Math.round(audioLevel)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-100 ${
                audioLevel > 70 ? "bg-red-500" : audioLevel > 40 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>

        {/* Recording Controls */}
        {recordedBlob && !isRecording && (
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={playRecording}>
              <Play className="h-4 w-4 mr-2" />
              Play
            </Button>
            <Button variant="outline" size="sm" onClick={downloadRecording}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Analyzing Audio...</span>
              <span>{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        )}

        {/* Status Message */}
        <p className="text-xs text-center text-muted-foreground">
          {isRecording
            ? "Recording and analyzing your cough in real-time..."
            : isAnalyzing
              ? "Processing audio with advanced ML algorithms..."
              : recordedBlob
                ? "Recording complete. Analysis finished."
                : "Click 'Cough Now' to start recording"}
        </p>

        {/* Audio Waveform Placeholder */}
        {recordedBlob && (
          <div className="flex items-center justify-center h-16 bg-gray-50 rounded-lg">
            <Waveform className="h-8 w-8 text-gray-400" />
            <span className="ml-2 text-sm text-gray-600">Audio Waveform</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
