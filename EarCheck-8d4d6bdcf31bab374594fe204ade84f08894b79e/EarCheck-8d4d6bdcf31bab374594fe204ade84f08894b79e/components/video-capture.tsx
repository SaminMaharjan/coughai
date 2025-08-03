"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, CameraOff, Eye } from "lucide-react"

interface VideoCaptureProps {
  isRecording: boolean
}

export default function VideoCapture({ isRecording }: VideoCaptureProps) {
  const [hasPermission, setHasPermission] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [blinkCount, setBlinkCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isRecording) {
      startVideoCapture()
    } else {
      stopVideoCapture()
    }

    return () => {
      stopVideoCapture()
    }
  }, [isRecording])

  const startVideoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      })

      streamRef.current = stream
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Simulate face detection and blink counting
      setFaceDetected(true)
      let blinks = 0
      intervalRef.current = setInterval(() => {
        if (Math.random() > 0.7) {
          // Simulate blink detection
          blinks++
          setBlinkCount(blinks)
        }
      }, 800)
    } catch (error) {
      console.error("Error accessing camera:", error)
      setHasPermission(false)
    }
  }

  const stopVideoCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setFaceDetected(false)
    setBlinkCount(0)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {hasPermission && isRecording ? (
            <Camera className="h-5 w-5 text-blue-600" />
          ) : (
            <CameraOff className="h-5 w-5 text-gray-400" />
          )}
          Facial Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative bg-gray-900 rounded-lg overflow-hidden h-32">
          {hasPermission && isRecording ? (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {faceDetected && (
                <div className="absolute inset-4 border-2 border-green-400 rounded-lg">
                  <div className="absolute -top-6 left-0 bg-green-400 text-white text-xs px-2 py-1 rounded">
                    Face Detected
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CameraOff className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span>Blinks: {blinkCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${faceDetected ? "bg-green-500" : "bg-gray-400"}`} />
            <span>{faceDetected ? "Face OK" : "No Face"}</span>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {isRecording ? "Analyzing facial patterns and fatigue indicators..." : "Camera will activate during analysis"}
        </p>
      </CardContent>
    </Card>
  )
}
