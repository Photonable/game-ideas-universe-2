import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'

// This is the core logic that handles the incoming webhook event
async function handleStripeEvent(req: Request) {
  console.log('Stripe webhook handler invoked.');

  // FIXED: Get the signature from the request headers directly.
  const signature = req.headers.get('stripe-signature') as string
  
  const reqBuffer = await req.text();

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      reqBuffer,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Stripe webhook signature verification failed.', err)
    return NextResponse.json(
      { error: `Webhook error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    )
  }

  // Handle the specific event type
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      if (!session.metadata?.userId) {
        console.error('User ID not found in session metadata');
        return NextResponse.json({ error: 'User ID not found in session metadata' }, { status: 400 })
      }

      const { userId } = session.metadata
      
      // Update the user's document in Firestore
      const userRef = adminDb.collection('users').doc(userId)
      await userRef.update({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        hasActiveSubscription: true,
      })

      console.log('Checkout session completed, user updated:', userId)
      break
    }
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

// Handle the webhook event from a GET request
export async function GET(req: Request) {
  return handleStripeEvent(req);
}

// Reject POST requests
export async function POST() {
    return new NextResponse('Method Not Allowed', {
        status: 405,
        headers: {
            'Allow': 'GET',
        },
    });
}
