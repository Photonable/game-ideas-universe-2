import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PLANS, ONE_SHOT_PRICE, getPlanDetails } from '@/lib/stripe'
import type { PlanType } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    // Debug: Check if Stripe is configured
    console.log('🔧 Stripe API called')
    console.log('🔧 STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY)
    console.log('🔧 STRIPE_SECRET_KEY starts with sk_:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_'))

    const { planType, userId, userEmail } = await req.json()
    console.log('🔧 Request data:', { planType, userId, userEmail })

    if (!planType || !userId || !userEmail) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: planType, userId, userEmail' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('❌ STRIPE_SECRET_KEY not found')
      return NextResponse.json(
        { error: 'Stripe not configured - missing secret key' },
        { status: 500 }
      )
    }

    console.log('🔧 Plan type:', planType)
    const planDetails = getPlanDetails(planType as PlanType)
    console.log('🔧 Plan details:', planDetails)
    const origin = req.headers.get('origin') || 'http://localhost:3000'

    // Create checkout session based on plan type
    if (planType === 'one-shot') {
      // One-time payment for single generation
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'One Generation',
                description: 'Single AI-powered game idea generation',
              },
              unit_amount: ONE_SHOT_PRICE,
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}?payment=cancelled`,
        customer_email: userEmail,
        metadata: {
          userId,
          planType: 'one-shot',
          generations: '1',
        },
      })

      return NextResponse.json({
        sessionId: session.id,
        url: session.url
      })
    } else {
      // Subscription payment
      const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]

      if (!plan) {
        console.error('❌ Invalid plan type:', planType)
        return NextResponse.json(
          { error: `Invalid plan type: ${planType}` },
          { status: 400 }
        )
      }

      console.log('🔧 Creating subscription session for plan:', plan)

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan.name,
                description: `${plan.generations === 999999 ? 'Unlimited' : plan.generations} AI-powered game idea generations per month`,
              },
              unit_amount: plan.price,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success__url: `${origin}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}?payment=cancelled`,
        customer_email: userEmail,
        metadata: {
          userId,
          planType,
        },
        subscription_data: {
          metadata: {
            userId,
            planType,
          }
        }
      })

      return NextResponse.json({
        sessionId: session.id,
        url: session.url
      })
    }
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
