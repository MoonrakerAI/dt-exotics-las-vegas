import Stripe from 'stripe';

// Initialize Stripe with the SDK's pinned default API version to avoid type mismatches during build
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {});

export default stripe;

export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy';