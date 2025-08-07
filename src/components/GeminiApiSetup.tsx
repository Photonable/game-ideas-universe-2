"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Key,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  Settings
} from "lucide-react"

interface GeminiApiSetupProps {
  isOpen: boolean
  onClose: () => void
  onApiKeySet: (apiKey: string) => void
}

export default function GeminiApiSetup({ isOpen, onClose, onApiKeySet }: GeminiApiSetupProps) {
  const [apiKey, setApiKey] = useState("")
  const [isTestingKey, setIsTestingKey] = useState(false)
  const [keyStatus, setKeyStatus] = useState<'untested' | 'valid' | 'invalid'>('untested')

  useEffect(() => {
    if (isOpen) {
      // Check if API key is already set
      const existingKey = localStorage.getItem('gemini-api-key')
      if (existingKey) {
        setApiKey(existingKey)
        setKeyStatus('valid')
      }
    }
  }, [isOpen])

  const testApiKey = async (key: string) => {
    setIsTestingKey(true)
    try {
      // Simple test to validate the API key format and potentially test connectivity
      if (!key || key.length < 20) {
        setKeyStatus('invalid')
        return false
      }

      // Store temporarily for testing
      const originalKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = key

      // You could add an actual API test here
      // For now, we'll just validate the format
      setKeyStatus('valid')
      return true

    } catch (error) {
      console.error('API key test failed:', error)
      setKeyStatus('invalid')
      return false
    } finally {
      setIsTestingKey(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKey) return

    const isValid = await testApiKey(apiKey)
    if (isValid) {
      localStorage.setItem('gemini-api-key', apiKey)
      onApiKeySet(apiKey)
      onClose()
    }
  }

  const handleRemoveApiKey = () => {
    localStorage.removeItem('gemini-api-key')
    setApiKey("")
    setKeyStatus('untested')
    onApiKeySet("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Configure Gemini AI</span>
          </DialogTitle>
          <DialogDescription>
            Add your Google Gemini API key to enable real AI-powered game idea generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            {keyStatus === 'valid' && (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                API Key Configured
              </Badge>
            )}
            {keyStatus === 'invalid' && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Invalid API Key
              </Badge>
            )}
            {keyStatus === 'untested' && (
              <Badge variant="secondary">
                <Info className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Gemini API Key</label>
            <div className="flex space-x-2">
              <Input
                type="password"
                placeholder="Enter your Gemini API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => testApiKey(apiKey)}
                disabled={!apiKey || isTestingKey}
                variant="outline"
              >
                {isTestingKey ? "Testing..." : "Test"}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>How to get your Gemini API key:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Google AI Studio <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                  <li>Sign in with your Google account</li>
                  <li>Click "Create API Key" and select a Google Cloud project</li>
                  <li>Copy the generated API key and paste it above</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  Your API key is stored locally in your browser and never sent to our servers.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Benefits */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">With Gemini AI, you get:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Real AI-powered game idea generation</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Contextual and creative responses to your prompts</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Detailed game mechanics and market analysis</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Unlimited generations with your own API key</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {keyStatus === 'valid' ? (
              <>
                <Button onClick={handleRemoveApiKey} variant="outline" className="flex-1">
                  Remove API Key
                </Button>
                <Button onClick={onClose} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Continue with AI
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Skip for Now
                </Button>
                <Button
                  onClick={handleSaveApiKey}
                  disabled={!apiKey || isTestingKey || keyStatus === 'invalid'}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Save & Continue
                </Button>
              </>
            )}
          </div>

          {keyStatus === 'untested' && !apiKey && (
            <p className="text-xs text-muted-foreground text-center">
              Without an API key, you'll get mock game ideas for demonstration purposes.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
