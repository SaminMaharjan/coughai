"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff } from "lucide-react"

interface AudioCaptureProps {
  isRecording: boolean
}

export default function AudioCapture({ isRecording }: AudioCaptureProps) {
  const [audioLevel, setAudioLevel] = useState(0)
  const [hasPermission, setHasPermission] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setHasPermission(true)

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 256
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)

          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
          setAudioLevel(Math.min(100, (average / 255) * 100 * 3)) // Amplify for better visualization
        }

        if (isRecording) {
          animationRef.current = requestAnimationFrame(updateAudioLevel)
        }
      }

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

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setAudioLevel(0)
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
          Audio Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center h-32">
          <div className="relative">
            {/* Microphone visualization */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                isRecording && hasPermission
                  ? "bg-green-100 border-2 border-green-500"
                  : "bg-gray-100 border-2 border-gray-300"
              }`}
              style={{
                transform: isRecording ? `scale(${1 + audioLevel / 200})` : "scale(1)",
              }}
            >
              {hasPermission && isRecording ? (
                <Mic className="h-8 w-8 text-green-600" />
              ) : (
                <MicOff className="h-8 w-8 text-gray-400" />
              )}
            </div>

            {/* Audio level rings */}
            {isRecording && hasPermission && (
              <>
                <div
                  className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"
                  style={{ opacity: audioLevel / 100 }}
                />
                <div
                  className="absolute inset-[-8px] rounded-full border border-green-300 animate-pulse"
                  style={{ opacity: audioLevel / 200 }}
                />
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Audio Level</span>
            <span>{Math.round(audioLevel)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {isRecording ? "Recording your cough for analysis..." : "Click 'Cough Now' to start recording"}
        </p>
      </CardContent>
    </Card>
  )
}
