"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Shield, Info, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface PrivacyNoticeProps {
  hasConsented: boolean
  onConsentChange: (consented: boolean) => void
}

export default function PrivacyNotice({ hasConsented, onConsentChange }: PrivacyNoticeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-blue-900">Privacy & Consent</h3>
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>
                      <strong>What we collect:</strong> 3-5 seconds of audio (your cough) and video (facial analysis)
                      for real-time processing.
                    </p>
                    <p>
                      <strong>How we use it:</strong> Audio and video are analyzed immediately using AI models to
                      provide health insights.
                    </p>
                    <p>
                      <strong>Data storage:</strong> Raw audio/video files are not stored. Only analysis results are
                      saved locally in your browser.
                    </p>
                    <p>
                      <strong>Your rights:</strong> You can delete your history anytime. No data is shared with third
                      parties.
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="consent" checked={hasConsented} onCheckedChange={onConsentChange} className="mt-0.5" />
              <label htmlFor="consent" className="text-sm text-blue-800 cursor-pointer">
                I consent to audio and video capture for health analysis. I understand this is for informational
                purposes only and not a substitute for medical advice.
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-blue-700">
          <Info className="h-3 w-3" />
          <span>Your privacy is protected. All processing happens securely in real-time.</span>
        </div>
      </CardContent>
    </Card>
  )
}
