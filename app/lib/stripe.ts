import Stripe from 'stripe';

// Initialize Stripe with the SDK's pinned default API version to avoid type mismatches during build
// Use conditional initialization to prevent build-time errors
let stripe: Stripe;

if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_dummy') {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20', // Use a specific API version for consistency
  });
} else {
  // Create a dummy instance for build time, will fail at runtime if not configured
  stripe = new Stripe('sk_test_dummy', {
    apiVersion: '2024-06-20',
  });
}

export default stripe;

export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy';