import Stripe from 'stripe';

// Create a function to get Stripe instance with runtime environment variables
function getStripeInstance(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  // Log the key status for debugging (only first 7 chars for security)
  if (secretKey) {
    console.log('[STRIPE] Initializing with key:', secretKey.substring(0, 7) + '...');
  } else {
    console.error('[STRIPE] WARNING: No STRIPE_SECRET_KEY found in environment');
  }
  
  // Use the actual key or a dummy one
  // The dummy key prevents build errors but will fail at runtime with clear errors
  return new Stripe(secretKey || 'sk_test_dummy', {
    apiVersion: '2025-06-30.basil',
    typescript: true,
  });
}

// Initialize Stripe - this will be re-evaluated at runtime for each request
const stripe = getStripeInstance();

export default stripe;

export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy';