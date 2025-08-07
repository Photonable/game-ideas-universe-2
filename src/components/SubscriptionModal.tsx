"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onPurchase: (planType: 'spark' | 'creator' | 'universe') => void
  currentPlan?: string
  isUniverseUser?: boolean
}

export default function SubscriptionModal({ isOpen, onClose, onPurchase, currentPlan, isUniverseUser = false }: SubscriptionModalProps) {
  const plans = [
    {
      name: "Spark",
      price: "$2/mo",
      generations: "4 Generations/month",
      popular: true,
      planType: "spark" as const
    },
    {
      name: "Creator",
      price: "$5/mo",
      generations: "10 Generations/month",
      planType: "creator" as const
    },
    {
      name: "Universe",
      price: "$11/mo",
      generations: "Unlimited",
      planType: "universe" as const
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Choose Your Subscription</DialogTitle>
          <DialogDescription className="text-center">
            Unlock unlimited creativity with our subscription plans
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlan === plan.planType
            return (
              <Card key={index} className={`text-center ${plan.popular && !isCurrentPlan ? 'ring-2 ring-purple-400' : ''} ${isCurrentPlan ? 'ring-2 ring-green-400' : ''}`}>
                {plan.popular && !isCurrentPlan && (
                  <div className="bg-purple-500 text-white text-xs font-bold py-1 px-3 rounded-b-md">
                    POPULAR
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-b-md">
                    CURRENT PLAN
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold text-purple-600">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">{plan.generations}</div>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-left">
                    <li>✅ AI-powered idea generation</li>
                    <li>✅ Save unlimited favorites</li>
                    <li>✅ Export ideas to various formats</li>
                    <li>✅ Priority customer support</li>
                    {plan.planType === 'universe' && (
                      <li>✅ Early access to new features</li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={() => onPurchase(plan.planType)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          Need just one generation? Use the one-shot option below for $1
        </div>
      </DialogContent>
    </Dialog>
  )
}
