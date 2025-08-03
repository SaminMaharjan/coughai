"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Database, Link, FileAudio, CheckCircle, AlertCircle } from "lucide-react"
import { DatasetManager, type DatasetSource } from "@/lib/dataset-manager"

interface DatasetUploaderProps {
  onDatasetLoaded?: (datasetId: string) => void
}

export default function DatasetUploader({ onDatasetLoaded }: DatasetUploaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [datasetManager] = useState(() => new DatasetManager())

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      setIsLoading(true)
      setStatus("loading")
      setProgress(0)
      setMessage("Processing audio files...")

      try {
        const audioFiles = Array.from(files).filter((file) => file.type.startsWith("audio/"))

        if (audioFiles.length === 0) {
          throw new Error("No audio files found. Please upload WAV, MP3, or other audio files.")
        }

        const source: DatasetSource = {
          type: "local",
          files: audioFiles,
        }

        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90))
        }, 200)

        const datasetId = await datasetManager.loadDataset(source)

        clearInterval(progressInterval)
        setProgress(100)
        setStatus("success")
        setMessage(`Successfully loaded ${audioFiles.length} audio files`)

        onDatasetLoaded?.(datasetId)
      } catch (error) {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Failed to load dataset")
      } finally {
        setIsLoading(false)
      }
    },
    [datasetManager, onDatasetLoaded],
  )

  const handleKaggleDataset = useCallback(
    async (url: string, apiKey?: string) => {
      setIsLoading(true)
      setStatus("loading")
      setProgress(0)
      setMessage("Loading Kaggle dataset...")

      try {
        const source: DatasetSource = {
          type: "kaggle",
          url,
          apiKey,
        }

        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 15, 90))
        }, 300)

        const datasetId = await datasetManager.loadDataset(source)

        clearInterval(progressInterval)
        setProgress(100)
        setStatus("success")
        setMessage("Successfully loaded Kaggle dataset")

        onDatasetLoaded?.(datasetId)
      } catch (error) {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Failed to load Kaggle dataset")
      } finally {
        setIsLoading(false)
      }
    },
    [datasetManager, onDatasetLoaded],
  )

  const handleURLDataset = useCallback(
    async (url: string) => {
      setIsLoading(true)
      setStatus("loading")
      setProgress(0)
      setMessage("Loading dataset from URL...")

      try {
        const source: DatasetSource = {
          type: "url",
          url,
        }

        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 12, 90))
        }, 250)

        const datasetId = await datasetManager.loadDataset(source)

        clearInterval(progressInterval)
        setProgress(100)
        setStatus("success")
        setMessage("Successfully loaded dataset from URL")

        onDatasetLoaded?.(datasetId)
      } catch (error) {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Failed to load dataset from URL")
      } finally {
        setIsLoading(false)
      }
    },
    [datasetManager, onDatasetLoaded],
  )

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Dataset Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="kaggle" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Kaggle Dataset
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              From URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Audio Files</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload WAV, MP3, or other audio files containing cough samples
              </p>
              <Input
                type="file"
                multiple
                accept="audio/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={isLoading}
                className="max-w-xs mx-auto"
              />
            </div>
          </TabsContent>

          <TabsContent value="kaggle" className="space-y-4">
            <KaggleDatasetForm onSubmit={handleKaggleDataset} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <URLDatasetForm onSubmit={handleURLDataset} isLoading={isLoading} />
          </TabsContent>
        </Tabs>

        {isLoading && (
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {status !== "idle" && !isLoading && (
          <Alert
            className={`mt-6 ${status === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
          >
            {status === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={status === "success" ? "text-green-800" : "text-red-800"}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <DatasetList datasets={datasetManager.listDatasets()} />
      </CardContent>
    </Card>
  )
}

function KaggleDatasetForm({
  onSubmit,
  isLoading,
}: { onSubmit: (url: string, apiKey?: string) => void; isLoading: boolean }) {
  const [url, setUrl] = useState("https://www.kaggle.com/datasets/himanshu007121/cough-audio-dataset")
  const [apiKey, setApiKey] = useState("")

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="kaggle-url">Kaggle Dataset URL</Label>
        <Input
          id="kaggle-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.kaggle.com/datasets/..."
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="kaggle-api-key">Kaggle API Key (Optional)</Label>
        <Input
          id="kaggle-api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Your Kaggle API key"
          disabled={isLoading}
        />
      </div>
      <Button onClick={() => onSubmit(url, apiKey || undefined)} disabled={isLoading || !url} className="w-full">
        Load Kaggle Dataset
      </Button>
    </div>
  )
}

function URLDatasetForm({ onSubmit, isLoading }: { onSubmit: (url: string) => void; isLoading: boolean }) {
  const [url, setUrl] = useState("")

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="dataset-url">Dataset URL</Label>
        <Input
          id="dataset-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/dataset.json"
          disabled={isLoading}
        />
      </div>
      <Button onClick={() => onSubmit(url)} disabled={isLoading || !url} className="w-full">
        Load from URL
      </Button>
    </div>
  )
}

function DatasetList({ datasets }: { datasets: any[] }) {
  if (datasets.length === 0) return null

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">Loaded Datasets</h3>
      <div className="space-y-3">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{dataset.name}</h4>
                <p className="text-sm text-muted-foreground">{dataset.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Samples: {dataset.metadata.totalSamples}</span>
                  <span>Conditions: {dataset.metadata.conditions.join(", ")}</span>
                  <span>Format: {dataset.metadata.format}</span>
                </div>
              </div>
              <Badge variant="secondary">{dataset.version}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Import Badge component
import { Badge } from "@/components/ui/badge"
