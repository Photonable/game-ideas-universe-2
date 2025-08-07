"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, CreditCard } from "lucide-react"

export default function StripeTestPanel() {
  const [testResults, setTestResults] = useState<{
    keysLoaded: boolean
    apiRouteWorking: boolean | null
    error: string | null
  }>({
    keysLoaded: false,
    apiRouteWorking: null,
    error: null
  })

  // Debug: Log environment variables on component mount
  React.useEffect(() => {
    console.log('🔧 StripeTestPanel mounted')
    console.log('🔧 All environment variables:', Object.keys(process.env))
    console.log('🔧 Stripe publishable key:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'FOUND' : 'NOT FOUND')
    if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.log('🔧 Key preview:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...')
    }
  }, [])

  const testStripeIntegration = async () => {
    try {
      // Test 1: Check if publishable key is loaded
      const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      console.log('🔧 Environment check:')
      console.log('🔧 process.env keys starting with NEXT_PUBLIC_:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')))
      console.log('🔧 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY raw value:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      console.log('🔧 pubKey variable:', pubKey)
      console.log('🔧 pubKey length:', pubKey?.length)
      console.log('🔧 pubKey starts with pk_test_:', pubKey?.startsWith('pk_test_'))
      console.log('🔧 pubKey starts with pk_live_:', pubKey?.startsWith('pk_live_'))

      const keysLoaded = !!(pubKey && (pubKey.startsWith('pk_test_') || pubKey.startsWith('pk_live_')))
      console.log('🔧 keysLoaded result:', keysLoaded)

      setTestResults(prev => ({ ...prev, keysLoaded }))

      if (!keysLoaded) {
        throw new Error('Stripe publishable key not found or invalid')
      }

      // Test 2: Test API route
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'one-shot',
          userId: 'test-user',
          userEmail: 'test@example.com'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTestResults(prev => ({
          ...prev,
          apiRouteWorking: !!(data.sessionId),
          error: null
        }))
      } else {
        const errorText = await response.text()
        throw new Error(`API route failed: ${errorText}`)
      }

    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        apiRouteWorking: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <AlertCircle className="w-4 h-4 text-yellow-500" />
    if (status === true) return <CheckCircle className="w-4 h-4 text-green-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const StatusBadge = ({ status }: { status: boolean | null }) => {
    if (status === null) return <Badge variant="secondary">Not Tested</Badge>
    if (status === true) return <Badge className="bg-green-500 hover:bg-green-600">Working</Badge>
    return <Badge variant="destructive">Failed</Badge>
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Stripe Integration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon status={testResults.keysLoaded} />
              <span className="text-sm">API Keys Loaded</span>
            </div>
            <StatusBadge status={testResults.keysLoaded} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon status={testResults.apiRouteWorking} />
              <span className="text-sm">Checkout API</span>
            </div>
            <StatusBadge status={testResults.apiRouteWorking} />
          </div>

          {testResults.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                <strong>Error:</strong> {testResults.error}
              </p>
            </div>
          )}

          {testResults.keysLoaded && testResults.apiRouteWorking && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                ✅ <strong>Integration Working!</strong> Ready to accept payments.
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={testStripeIntegration}
          className="w-full"
          variant="outline"
        >
          Test Integration
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Test Card:</strong> 4242 4242 4242 4242</p>
          <p><strong>Expiry:</strong> Any future date (12/34)</p>
          <p><strong>CVC:</strong> Any 3 digits (123)</p>
        </div>
      </CardContent>
    </Card>
  )
}
