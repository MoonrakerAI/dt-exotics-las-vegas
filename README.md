# DT Exotics Las Vegas - Supercar Rental Website

A modern, high-performance website for DT Exotics Las Vegas supercar rental service, featuring a Tron-inspired dark theme with neon accents.

## Features

- **Full-width Hero Video Section** - Emotionally compelling hero section with video background
- **Gamified Car Selector** - Interactive car showcase with stats, images, videos, and engine sounds
- **Advanced Contact Form** - Car selection, date range picker, and automated email notifications
- **Responsive Design** - Fully optimized for all devices
- **Dark Tron Theme** - Sleek design with neon blue/pink/green accents

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Email**: Resend API
- **Date Picker**: React DatePicker

## Project Structure

```
dt-exotics-website/
├── app/
│   ├── api/
│   │   └── contact/          # Email API endpoint
│   ├── components/
│   │   └── sections/         # Page sections
│   ├── data/
│   │   └── cars.ts          # Car database
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── public/
│   ├── images/
│   │   ├── hero/           # Hero section images
│   │   ├── logo/           # Logo files
│   │   └── pages/          # Page-specific images
│   └── videos/
│       ├── hero/           # Hero video
│       └── pages/          # Page videos
└── assets/
    └── cars/               # Car-specific content
        └── [car-model]/
            ├── pics/       # Car images
            ├── vids/       # Car videos
            └── audio/      # Engine sounds
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.local.example` to `.env.local`
   - Add your Resend API key:
     ```
     RESEND_API_KEY=your_resend_api_key_here
     ```

3. **Add Content**
   - Add hero video to `/public/videos/hero/hero-video.mp4`
   - Add logo to `/public/images/logo/`
   - Add car images to `/assets/cars/[car-model]/pics/`
   - Add car videos to `/assets/cars/[car-model]/vids/`
   - Add engine sounds to `/assets/cars/[car-model]/audio/`

4. **Run Development Server**
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

## Email Configuration

The contact form uses Resend API to send emails. To set up:
1. Create a Resend account at [resend.com](https://resend.com)
2. Get your API key
3. Add it to `.env.local`
4. Configure your domain in Resend dashboard

## Deployment

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

## Content Guidelines

### Images
- Hero video: 1920x1080 minimum, MP4 format
- Car images: 1600x900 minimum, JPG/PNG format
- Logo: SVG or PNG with transparent background

### Audio Files
- Format: MP3
- Duration: 3-10 seconds
- Two types per car:
  - `startup.mp3` - Engine start sound
  - `rev.mp3` - Engine rev sound

## Customization

### Theme Colors
Edit colors in `tailwind.config.js`:
- `neon-blue`: #00ffff
- `neon-pink`: #ff00ff
- `neon-green`: #00ff00
- `dark-metal`: #1a1a1a
- `dark-gray`: #0a0a0a

### Fonts
- Headers: Orbitron (tech font)
- Body: Inter (clean, modern)

## Performance Optimization

- Images are optimized with Next.js Image component
- Lazy loading for off-screen content
- Minimal JavaScript bundle size
- CSS optimized with Tailwind

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## License

© 2024 DT Exotics Las Vegas. All rights reserved.