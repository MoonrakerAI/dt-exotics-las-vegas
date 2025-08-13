import Stripe from 'stripe';

// Always export a non-null Stripe client so TypeScript consumers don't need null checks.
// If STRIPE_SECRET_KEY is missing at build/deploy time, we initialize with a dummy key.
// Routes must still validate configuration at runtime before making real API calls.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

export default stripe;

export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy';