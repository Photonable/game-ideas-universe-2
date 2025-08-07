import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import Stripe from 'stripe'

// Import Firebase for server-side database updates
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore'

// Initialize Firebase with the same config as client
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase for server-side use
if (!getApps().length) {
  initializeApp(firebaseConfig)
}

const db = getFirestore()

// GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'Stripe webhook endpoint is working',
    timestamp: new Date().toISOString(),
    method: 'GET'
  })
}

// POST method for Stripe webhooks
export async function POST(req: NextRequest) {
  console.log('🔧 Webhook POST method called')

  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    console.log('🔧 Body length:', body.length)
    console.log('🔧 Signature exists:', !!signature)

    if (!signature) {
      console.log('❌ No signature provided')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
      console.log('✅ Webhook event verified:', event.type)
    } catch (err) {
      console.error('❌ Signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    console.log('📨 Processing event:', event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('💳 Processing checkout completion for session:', session.id)

      // Process in background to avoid timeout
      setImmediate(async () => {
        await handleCheckoutCompleted(session)
      })
    }

    // Respond immediately to Stripe
    return NextResponse.json({ received: true, event: event.type })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, planType, generations } = session.metadata || {}

  console.log('🔄 Handling checkout completion:', { userId, planType, generations })

  if (!userId || !planType) {
    console.error('❌ Missing metadata:', session.metadata)
    return
  }

  try {
    const userRef = doc(db, 'users', userId)
    const generationsCount = parseInt(generations || '0')
    const now = new Date()

    if (planType === 'one-shot') {
      console.log('💰 Processing one-shot purchase')
      await updateDoc(userRef, {
        totalGenerations: increment(generationsCount),
        updatedAt: serverTimestamp(),
        lastPaymentDate: now
      })
    } else {
      console.log('📝 Processing subscription:', planType)
      const subscriptionUpdates: any = {
        subscriptionType: planType,
        subscriptionStatus: 'active',
        subscriptionStartDate: now,
        generationsRemaining: generationsCount === 999999 ? 999999 : generationsCount,
        totalGenerations: generationsCount,
        updatedAt: serverTimestamp(),
        lastPaymentDate: now
      }

      if (planType !== 'universe') {
        const endDate = new Date(now)
        endDate.setMonth(endDate.getMonth() + 1)
        subscriptionUpdates.subscriptionEndDate = endDate
      }

      await updateDoc(userRef, subscriptionUpdates)
    }

    console.log('✅ User profile updated successfully for:', planType)

  } catch (error) {
    console.error('❌ Database update failed:', error)
  }
}
