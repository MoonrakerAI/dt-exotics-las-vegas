# DT Exotics Las Vegas - Supercar Rental Website

A modern, high-performance website for DT Exotics Las Vegas supercar rental service, featuring a Tron-inspired dark theme with neon accents.

## Features

- **Full-width Hero Video Section** - Emotionally compelling hero section with video background
- **Gamified Car Selector** - Interactive car showcase with stats, images, videos, and engine sounds
- **Advanced Contact Form** - Car selection, date range picker, and automated email notifications
- **Responsive Design** - Fully optimized for all devices
- **Dark Tron Theme** - Sleek design with neon blue/pink/green accents
- **Secure Payment Processing** - Stripe integration with manual capture and 3D Secure support
- **Admin Dashboard** - Comprehensive rental management with secure authentication
- **Rate Limiting** - Protection against brute force attacks and API abuse
- **Input Validation** - Comprehensive validation and sanitization of all user inputs

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Payment Processing**: Stripe with manual capture
- **Database**: Vercel KV (Redis)
- **Authentication**: JWT-based secure authentication
- **Email**: Resend API
- **AI Chat**: Anthropic Claude API
- **Rate Limiting**: Custom implementation with Vercel KV

## Security Features

### Authentication & Authorization
- **JWT-based authentication** with secure token signing
- **Environment variable-based credentials** (no hardcoded secrets)
- **Rate limiting** on login attempts (5 attempts per 15 minutes)
- **Input validation and sanitization** for all user inputs
- **XSS protection** with content sanitization

### Payment Security
- **Manual payment capture** for deposit control
- **Idempotency keys** to prevent duplicate charges
- **3D Secure authentication** handling
- **Payment amount validation** to prevent overcharging
- **Webhook signature verification** for Stripe events

### API Protection
- **Rate limiting** on all API endpoints
- **Input validation** for all request data
- **Error handling** without exposing sensitive information
- **CORS protection** and secure headers

## Project Structure

```
dt-exotics-website/
├── app/
│   ├── api/
│   │   ├── admin/           # Admin API endpoints (JWT protected)
│   │   ├── auth/            # Authentication endpoints
│   │   ├── contact/         # Email API endpoint
│   │   ├── rentals/         # Rental management API
│   │   ├── webhooks/        # Stripe webhook handlers
│   │   └── chat/            # AI chat API
│   ├── admin/               # Admin dashboard (protected routes)
│   ├── components/
│   │   ├── auth/            # Authentication components
│   │   ├── sections/        # Page sections
│   │   └── ui/              # UI components
│   ├── lib/
│   │   ├── auth.ts          # JWT authentication
│   │   ├── validation.ts    # Input validation
│   │   ├── rate-limit.ts    # Rate limiting
│   │   ├── stripe.ts        # Stripe configuration
│   │   └── kv-database.ts   # Database operations
│   ├── data/
│   │   └── cars.ts          # Car database
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
└── env.example              # Environment variables template
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `env.example` to `.env.local` and configure all required variables:

```bash
cp env.example .env.local
```

**Required Environment Variables:**
- `ADMIN_EMAIL` - Admin email address
- `ADMIN_PASSWORD_HASH` - SHA256 hash of admin password
- `JWT_SECRET` - 32+ character secret for JWT signing
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `VERCEL_KV_REST_API_URL` - Vercel KV database URL
- `VERCEL_KV_REST_API_TOKEN` - Vercel KV access token
- `RESEND_API_KEY` - Resend email API key
- `ANTHROPIC_API_KEY` - Anthropic Claude API key

### 3. Generate Security Keys

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Hash Admin Password:**
```bash
node -e "console.log(require('crypto').createHash('sha256').update('your_password').digest('hex'))"
```

### 4. Add Content
- Add hero video to `/public/videos/hero/hero-video.mp4`
- Add logo to `/public/images/logo/`
- Add car images to `/public/cars/[car-model]/pics/`
- Add car videos to `/public/cars/[car-model]/vids/`
- Add engine sounds to `/public/cars/[car-model]/audio/`

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Car Models

The website features these luxury vehicles:
- Lamborghini Huracán Spyder
- Lamborghini Huracán Coupé
- Chevrolet Corvette C8 Stingray
- Audi R8 Black Panther Edition
- Audi SQ8
- Audi S5 Sportback
- Dodge Challenger Hellcat
- Mercedes-Benz GLE 53 AMG

## Payment Flow

1. **Deposit Payment**: 30% of total rental cost (authorized but not captured)
2. **Admin Capture**: Admin manually captures deposit when rental is confirmed
3. **Final Payment**: Remaining 70% charged at rental completion with 3D Secure support
4. **Idempotency**: All payments use idempotency keys to prevent duplicates

## Admin Dashboard

Access the admin dashboard at `/admin` with secure JWT authentication:

- **Rental Management**: View, filter, and manage all rentals
- **Payment Processing**: Capture deposits and charge final amounts
- **Customer Information**: View customer details and rental history
- **Real-time Updates**: Live status updates and payment tracking

## Security Best Practices

### Development
- Never commit `.env` files to version control
- Use different keys for development and production
- Regularly rotate secrets and API keys
- Test security features thoroughly

### Production
- Use strong, unique passwords and API keys
- Enable HTTPS and secure headers
- Monitor rate limiting and failed authentication attempts
- Implement proper logging and monitoring
- Regular security audits and updates

## API Rate Limits

- **Login**: 5 attempts per 15 minutes
- **Contact Form**: 10 submissions per hour
- **Rental Creation**: 5 requests per hour
- **General API**: 100 requests per minute

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## License

© 2024 DT Exotics Las Vegas. All rights reserved.