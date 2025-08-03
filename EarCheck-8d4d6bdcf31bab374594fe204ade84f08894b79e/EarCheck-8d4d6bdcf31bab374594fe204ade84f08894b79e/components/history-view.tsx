"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, Calendar, Activity, Eye, Wind, Trash2 } from "lucide-react"
import type { AnalysisResult } from "@/app/page"

interface HistoryViewProps {
  history: AnalysisResult[]
}

export default function HistoryView({ history }: HistoryViewProps) {
  if (history.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Test History
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tests yet</h3>
          <p className="text-muted-foreground">
            Your test history will appear here after you complete your first analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case "Low":
        return "default"
      case "Medium":
        return "secondary"
      case "High":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Test History ({history.length} tests)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.map((result, index) => (
              <div key={result.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {result.timestamp.toLocaleDateString()} at {result.timestamp.toLocaleTimeString()}
                    </span>
                    <Badge variant={getRiskBadgeVariant(result.overallRisk)}>{result.overallRisk} Risk</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Cough:</span>
                    <span>{result.coughAnalysis.dominantCondition}</span>
                    <span className="text-muted-foreground">({result.coughAnalysis.conditions[0]?.confidence}%)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Fatigue:</span>
                    <span>{result.fatigueScore.level}</span>
                    <span className="text-muted-foreground">({result.fatigueScore.percentage}%)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Breathing:</span>
                    <span>{result.breathingPattern.type}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    <strong>AI Recommendation:</strong> {result.aiRecommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
