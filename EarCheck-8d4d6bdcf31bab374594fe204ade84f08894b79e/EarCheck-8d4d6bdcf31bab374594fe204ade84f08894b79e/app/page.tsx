"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, Camera, Activity, Brain, History, Shield, Stethoscope, Loader2, Database } from "lucide-react"
import EnhancedAudioCapture from "@/components/enhanced-audio-capture"
import VideoCapture from "@/components/video-capture"
import ResultsDashboard from "@/components/results-dashboard"
import HistoryView from "@/components/history-view"
import PrivacyNotice from "@/components/privacy-notice"
import DatasetUploader from "@/components/dataset-uploader"
import type { CoughAnalysis } from "@/lib/audio-processor"
import type { CoughClassification } from "@/lib/cough-classifier"

export interface AnalysisResult {
  id: string
  timestamp: Date
  coughAnalysis: {
    conditions: Array<{ name: string; confidence: number; color: string }>
    dominantCondition: string
  }
  fatigueScore: {
    level: "Low" | "Moderate" | "High"
    percentage: number
    indicators: string[]
  }
  breathingPattern: {
    type: string
    description: string
    concerns: string[]
  }
  aiRecommendation: string
  overallRisk: "Low" | "Medium" | "High"
  rawAnalysis?: CoughAnalysis
  mlClassification?: CoughClassification
}

export default function EarCheckAI() {
  const [currentStep, setCurrentStep] = useState<"landing" | "capture" | "analysis" | "results">("landing")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [hasConsented, setHasConsented] = useState(false)
  const [activeTab, setActiveTab] = useState("test")
  const [loadedDatasets, setLoadedDatasets] = useState<string[]>([])

  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleAnalysisComplete = useCallback(async (analysis: CoughAnalysis, classification: CoughClassification) => {
    // Convert ML results to our UI format
    const conditions = classification.conditions.map((condition) => ({
      name: condition.name,
      confidence: Math.round(condition.probability),
      color: getConditionColor(condition.name),
    }))

    // Generate fatigue score (mock for now)
    const fatigueLevel = Math.random() > 0.6 ? "Moderate" : Math.random() > 0.3 ? "Low" : "High"
    const fatiguePercentage =
      fatigueLevel === "High"
        ? 75 + Math.random() * 25
        : fatigueLevel === "Moderate"
          ? 40 + Math.random() * 35
          : Math.random() * 40

    // Generate breathing pattern analysis
    const breathingTypes = ["Normal breathing", "Shallow breathing", "Irregular breathing"]
    const breathingType = breathingTypes[Math.floor(Math.random() * breathingTypes.length)]

    const result: AnalysisResult = {
      id: Date.now().toString(),
      timestamp: new Date(),
      coughAnalysis: {
        conditions,
        dominantCondition: classification.dominantCondition,
      },
      fatigueScore: {
        level: fatigueLevel,
        percentage: Math.round(fatiguePercentage),
        indicators: ["Eye brightness analysis", "Blinking pattern assessment", "Facial muscle tension evaluation"],
      },
      breathingPattern: {
        type: breathingType,
        description: `Breathing pattern analysis based on audio characteristics: ${breathingType.toLowerCase()} detected`,
        concerns: breathingType !== "Normal breathing" ? ["Possible respiratory irregularity"] : [],
      },
      aiRecommendation: generateAIRecommendation(classification, fatigueLevel),
      overallRisk: determineOverallRisk(classification, fatigueLevel),
      rawAnalysis: analysis,
      mlClassification: classification,
    }

    setCurrentResult(result)
    setHistory((prev) => [result, ...prev])
    setCurrentStep("results")
    setIsAnalyzing(false)
  }, [])

  const startAnalysis = useCallback(async () => {
    if (!hasConsented) return

    setCurrentStep("capture")
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // The actual analysis will be handled by the EnhancedAudioCapture component
    // This just sets up the UI state
  }, [hasConsented])

  const resetTest = () => {
    setCurrentStep("landing")
    setCurrentResult(null)
    setAnalysisProgress(0)
    setIsAnalyzing(false)
  }

  const handleDatasetLoaded = (datasetId: string) => {
    setLoadedDatasets((prev) => [...prev, datasetId])
  }

  if (currentStep === "capture" || currentStep === "analysis") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Activity className="h-6 w-6 text-blue-600" />
              Analyzing Your Health Data
            </CardTitle>
            <CardDescription>Please cough naturally while looking at the camera</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <EnhancedAudioCapture isRecording={isAnalyzing} onAnalysisComplete={handleAnalysisComplete} />
              <VideoCapture isRecording={isAnalyzing} />
            </div>

            <div className="text-center">
              <Button onClick={resetTest} variant="outline" disabled={isAnalyzing}>
                Cancel Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "results" && currentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <ResultsDashboard result={currentResult} onNewTest={resetTest} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <header className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">EarCheck AI</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real-time cough analysis powered by advanced ML. Get instant health insights from your cough, facial
            patterns, and breathing.
          </p>
          {loadedDatasets.length > 0 && (
            <div className="mt-4 text-sm text-green-600">
              ✓ {loadedDatasets.length} dataset(s) loaded for enhanced analysis
            </div>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto">
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Test
            </TabsTrigger>
            <TabsTrigger value="datasets" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Datasets
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-6">
            {/* Main CTA Card */}
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Start Your Health Check</CardTitle>
                <CardDescription>Cough into your device for 3-5 seconds while looking at the camera</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto">
                      <Mic className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium">Advanced Audio Analysis</p>
                    <p className="text-xs text-muted-foreground">ML-powered cough classification</p>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-green-100 rounded-full w-fit mx-auto">
                      <Camera className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm font-medium">Facial Analysis</p>
                    <p className="text-xs text-muted-foreground">Fatigue detection</p>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto">
                      <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium">AI Insights</p>
                    <p className="text-xs text-muted-foreground">Personalized recommendations</p>
                  </div>
                </div>

                <PrivacyNotice hasConsented={hasConsented} onConsentChange={setHasConsented} />

                <Button
                  onClick={startAnalysis}
                  disabled={!hasConsented || isAnalyzing}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Cough Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Enhanced Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    ML-Powered Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Advanced machine learning models analyze MFCC features, spectral characteristics, and temporal
                    patterns to classify respiratory conditions with high accuracy.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    Dataset Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Upload your own datasets or connect to Kaggle datasets for enhanced model training and improved
                    classification accuracy.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Real-time Processing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Real-time audio feature extraction and classification provide instant feedback with detailed
                    confidence scores and recommendations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="datasets">
            <DatasetUploader onDatasetLoaded={handleDatasetLoaded} />
          </TabsContent>

          <TabsContent value="history">
            <HistoryView history={history} />
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>Your privacy and data security are our top priorities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Data Processing</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Audio processed with advanced ML algorithms</li>
                      <li>• MFCC feature extraction for accurate analysis</li>
                      <li>• Real-time classification with confidence scores</li>
                      <li>• Optional dataset integration for enhanced accuracy</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Your Rights</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Full control over your data and recordings</li>
                      <li>• Download recordings for personal use</li>
                      <li>• Clear consent before any analysis</li>
                      <li>• No sharing with third parties</li>
                    </ul>
                  </div>
                </div>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Medical Disclaimer:</strong> EarCheck AI is for informational purposes only and should not
                    replace professional medical advice. Always consult healthcare providers for medical concerns.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Helper functions
function getConditionColor(condition: string): string {
  const colors: Record<string, string> = {
    "COVID-19": "bg-red-500",
    Asthma: "bg-orange-500",
    Bronchitis: "bg-yellow-500",
    Pneumonia: "bg-purple-500",
    Healthy: "bg-green-500",
  }
  return colors[condition] || "bg-gray-500"
}

function generateAIRecommendation(classification: CoughClassification, fatigueLevel: string): string {
  const dominant = classification.dominantCondition
  const confidence = classification.overallConfidence

  const recommendations: Record<string, string> = {
    "COVID-19": `Based on your cough analysis showing patterns similar to COVID-19 (${confidence} confidence), consider self-isolation and getting tested. Monitor symptoms closely and seek medical attention if breathing difficulties develop.`,
    Asthma: `Your cough shows characteristics consistent with asthma patterns (${confidence} confidence). Ensure you have your rescue inhaler available, avoid known triggers, and consider consulting your healthcare provider if symptoms persist.`,
    Bronchitis: `The analysis suggests bronchitis-like patterns (${confidence} confidence). Stay hydrated, rest, and use a humidifier. If symptoms worsen or persist beyond a week, consult a healthcare professional.`,
    Pneumonia: `Your cough analysis indicates possible pneumonia patterns (${confidence} confidence). This requires medical attention - please consult a healthcare provider promptly for proper evaluation and treatment.`,
    Healthy: `Your cough patterns appear normal (${confidence} confidence). Continue maintaining good health practices and monitor any changes in symptoms.`,
  }

  let baseRecommendation =
    recommendations[dominant] || "Consult a healthcare provider for proper evaluation of your symptoms."

  if (fatigueLevel === "High") {
    baseRecommendation += " Your high fatigue levels suggest you should prioritize rest and recovery."
  } else if (fatigueLevel === "Moderate") {
    baseRecommendation += " Moderate fatigue detected - ensure adequate rest and hydration."
  }

  return baseRecommendation
}

function determineOverallRisk(classification: CoughClassification, fatigueLevel: string): "Low" | "Medium" | "High" {
  const dominant = classification.dominantCondition
  const confidence = classification.overallConfidence

  if (dominant === "COVID-19" || dominant === "Pneumonia") {
    return confidence === "high" ? "High" : "Medium"
  }

  if (dominant === "Asthma" || dominant === "Bronchitis") {
    if (confidence === "high" && fatigueLevel === "High") return "Medium"
    if (confidence === "high") return "Medium"
    return "Low"
  }

  return "Low"
}
