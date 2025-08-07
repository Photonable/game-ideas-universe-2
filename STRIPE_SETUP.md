# Stripe Payment Integration Setup

This guide will help you set up Stripe payments for your Game Ideas Universe app.

## 1. Get Your Stripe API Keys

1. **Log into your Stripe Dashboard**: https://dashboard.stripe.com/
2. **Navigate to API Keys**:
   - Click "Developers" in the left sidebar
   - Click "API keys"
3. **Copy your keys**:
   - **Publishable key** (starts with `pk_test_...` for test mode)
   - **Secret key** (starts with `sk_test_...` for test mode)

⚠️ **Important**: Use TEST keys for development, LIVE keys only for production!

## 2. Update Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 3. Test with Stripe Test Cards

Use these test card numbers in development:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

**Test Details**:
- Any future expiry date (e.g., 12/34)
- Any 3-digit CVC (e.g., 123)
- Any ZIP code (e.g., 12345)

## 4. Set Up Webhooks (Production)

For production, you'll need to set up webhooks:

1. In Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
5. Copy the webhook secret and add to `STRIPE_WEBHOOK_SECRET`

## 5. Current Pricing

The app is configured with these prices:

- **One-shot**: $1.00 (1 generation)
- **Spark Plan**: $2.00/month (4 generations)
- **Creator Plan**: $5.00/month (10 generations)
- **Universe Plan**: $11.00/month (unlimited generations)

## 6. Testing the Integration

1. **Start the development server**: `bun run dev`
2. **Log into the app**
3. **Try purchasing a subscription or one-shot**
4. **Use test card**: `4242 4242 4242 4242`
5. **Verify the payment flow**

## 7. Going Live

When ready for production:

1. Replace test keys with live keys
2. Set up production webhooks
3. Test thoroughly with real card (small amount)
4. Deploy to production

## Troubleshooting

- **"Stripe failed to load"**: Check your publishable key
- **"Failed to create checkout session"**: Check your secret key
- **Payment not updating**: Webhooks not configured (payment still works, but updates happen on refresh)

## Security Notes

- ✅ **Secret keys**: Never expose in frontend code
- ✅ **Webhook verification**: All payments are verified server-side
- ✅ **PCI Compliance**: Stripe handles all card data
- ✅ **Test mode**: Safe to test with test cards

Your app is now ready to accept real payments! 🎉
