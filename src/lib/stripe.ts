import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Client-side Stripe instance
let stripePromise: Promise<any> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')))
      return Promise.reject(new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set'))
    }

    stripePromise = loadStripe(publishableKey, {
      locale: 'auto',
    }).catch((error) => {
      console.error('Stripe.js failed to load:', error)
      stripePromise = null // Reset so we can try again
      throw new Error('Failed to load Stripe.js - this may be due to browser security settings')
    })
  }

  return stripePromise
}

// Subscription plan configuration
export const STRIPE_PLANS = {
  spark: {
    name: 'Spark Plan',
    price: 200, // $2.00 in cents
    generations: 4,
    interval: 'month' as const,
  },
  creator: {
    name: 'Creator Plan',
    price: 500, // $5.00 in cents
    generations: 10,
    interval: 'month' as const,
  },
  universe: {
    name: 'Universe Plan',
    price: 1100, // $11.00 in cents
    generations: 999999, // Unlimited
    interval: 'month' as const,
  },
} as const

// One-shot purchase configuration
export const ONE_SHOT_PRICE = 100 // $1.00 in cents

export type PlanType = keyof typeof STRIPE_PLANS | 'one-shot'

// Helper function to get plan details
export function getPlanDetails(planType: PlanType) {
  if (planType === 'one-shot') {
    return {
      name: 'One Generation',
      price: ONE_SHOT_PRICE,
      generations: 1,
      interval: null,
    }
  }

  return STRIPE_PLANS[planType]
}

// Helper function to format price for display
export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`
}
