import Stripe from 'stripe';

// Initialize Stripe client conditionally
let stripe: Stripe | null = null;

// Only initialize Stripe if we have a valid secret key
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_dummy') {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-06-30.basil', // Use the latest API version expected by TypeScript
  });
} else {
  // Create a dummy instance for build time, will fail at runtime if not configured
  console.warn('[STRIPE] Stripe not initialized - secret key not configured');
}

export default stripe;

export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy';