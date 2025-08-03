"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, Brain, Eye, Wind, AlertTriangle, CheckCircle, RefreshCw, Download, Share2 } from "lucide-react"
import type { AnalysisResult } from "@/app/page"

interface ResultsDashboardProps {
  result: AnalysisResult
  onNewTest: () => void
}

export default function ResultsDashboard({ result, onNewTest }: ResultsDashboardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-green-600 bg-green-50 border-green-200"
      case "Medium":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "High":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getFatigueColor = (level: string) => {
    switch (level) {
      case "Low":
        return "text-green-600"
      case "Moderate":
        return "text-orange-600"
      case "High":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
          <p className="text-muted-foreground">
            Completed on {result.timestamp.toLocaleDateString()} at {result.timestamp.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={onNewTest} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      {/* Overall Risk Alert */}
      <Alert className={`border-2 ${getRiskColor(result.overallRisk)}`}>
        {result.overallRisk === "Low" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        <AlertDescription className="font-medium">
          <strong>Overall Risk Level: {result.overallRisk}</strong>
          {result.overallRisk === "Low" && " - Your results appear normal with no immediate concerns."}
          {result.overallRisk === "Medium" && " - Some indicators suggest monitoring your symptoms."}
          {result.overallRisk === "High" && " - Multiple indicators suggest consulting a healthcare provider."}
        </AlertDescription>
      </Alert>

      {/* Main Results Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cough Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Cough Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {result.coughAnalysis.conditions.map((condition, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{condition.name}</span>
                    <span className="text-sm text-muted-foreground">{condition.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${condition.color}`}
                      style={{ width: `${condition.confidence}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t">
              <Badge variant="secondary" className="w-full justify-center py-2">
                Most Likely: {result.coughAnalysis.dominantCondition}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Fatigue Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Fatigue Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getFatigueColor(result.fatigueScore.level)}`}>
                {result.fatigueScore.percentage}%
              </div>
              <div className={`text-lg font-medium ${getFatigueColor(result.fatigueScore.level)}`}>
                {result.fatigueScore.level} Fatigue
              </div>
            </div>

            <Progress value={result.fatigueScore.percentage} className="h-3" />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Detected Indicators:</h4>
              <ul className="space-y-1">
                {result.fatigueScore.indicators.map((indicator, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Breathing Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-purple-600" />
              Breathing Pattern
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">{result.breathingPattern.type}</div>
              <p className="text-sm text-muted-foreground mt-2">{result.breathingPattern.description}</p>
            </div>

            {result.breathingPattern.concerns.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Potential Concerns:</h4>
                <ul className="space-y-1">
                  {result.breathingPattern.concerns.map((concern, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-orange-500" />
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-gray-800 leading-relaxed">{result.aiRecommendation}</p>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This analysis is for informational purposes only and should not replace
            professional medical advice. Always consult with healthcare providers for medical concerns.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
