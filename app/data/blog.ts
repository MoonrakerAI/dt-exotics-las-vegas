import { BlogPost, BlogCategory, BlogTag } from '../types/blog'

// Sample blog posts for demonstration
export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Ultimate Guide to Supercar Rentals in Las Vegas',
    slug: 'ultimate-guide-supercar-rentals-las-vegas',
    excerpt: 'Everything you need to know about renting luxury supercars in Sin City, from choosing the right vehicle to making the most of your experience.',
    content: `
# The Ultimate Guide to Supercar Rentals in Las Vegas

Las Vegas is the perfect playground for luxury supercar experiences. With its iconic Strip, scenic desert highways, and vibrant nightlife, there's no better place to live out your automotive dreams.

## Why Choose Las Vegas for Supercar Rentals?

### The Perfect Driving Environment
- **The Strip**: Cruise the famous Las Vegas Boulevard in style
- **Red Rock Canyon**: Experience breathtaking scenic drives
- **Perfect Weather**: 300+ sunny days per year
- **24/7 Energy**: The city that never sleeps matches your supercar's energy

### Our Premium Fleet

At DT Exotics, we offer an unmatched selection of luxury vehicles:

- **Lamborghini Huracán Spyder**: Open-top thrills with 610 HP
- **Audi R8 Black Panther Edition**: Unique custom wrap design
- **Porsche 911 992**: The evolution of perfection
- **Chevrolet Corvette C8**: American mid-engine excellence

## Planning Your Supercar Experience

### Choose the Right Vehicle
Consider your experience level, group size, and planned activities. First-time renters often prefer the user-friendly Audi models, while experienced drivers gravitate toward our Lamborghinis.

### Best Routes in Las Vegas
1. **The Strip Cruise**: Essential for any first-timer
2. **Red Rock Canyon Loop**: 13 miles of stunning scenery
3. **Valley of Fire**: Day trip adventure (60 miles)
4. **Mount Charleston**: Cool mountain escape

### Photography Tips
- **Golden Hour**: Best lighting 1 hour before sunset
- **Iconic Backdrops**: Bellagio fountains, Welcome sign
- **Action Shots**: We provide professional photography services

## Safety and Preparation

### What You Need
- Valid driver's license (21+ years old)
- Insurance: All self-drive rentals require renter-provided full coverage insurance that transfers to a rental vehicle. If you don't have coverage, we can assist with rental insurance options.
- Credit card for security deposit
- Comfortable driving experience

### Our Safety Standards
- Comprehensive safety orientation
- 24/7 support during your rental
- GPS tracking for emergencies
- Chauffeur-driven services are insured by our partners; clients are not responsible for insurance in those cases.

## Making Memories

A supercar rental in Las Vegas isn't just about the drive—it's about creating unforgettable memories. Whether it's a bachelor party, birthday celebration, or just treating yourself, the experience extends far beyond the vehicle.

Ready to start your Las Vegas supercar adventure? Contact DT Exotics today and let us help you create memories that will last a lifetime.
    `,
    author: {
      name: 'DT Exotics Team',
      email: 'team@dtexoticslv.com'
    },
    seo: {
      metaTitle: 'Ultimate Guide to Supercar Rentals in Las Vegas | DT Exotics',
      metaDescription: 'Complete guide to renting luxury supercars in Las Vegas. Learn about our fleet, best driving routes, safety tips, and how to make the most of your experience.',
      keywords: ['supercar rental las vegas', 'luxury car rental', 'lamborghini rental', 'las vegas experiences', 'exotic car rental'],
      ogTitle: 'The Ultimate Guide to Supercar Rentals in Las Vegas',
      ogDescription: 'Everything you need to know about renting luxury supercars in Sin City. From Lamborghinis to Porsches, make your Vegas trip unforgettable.',
      ogImage: '/images/blog/supercar-guide-og.jpg',
      canonicalUrl: 'https://dtexoticslv.com/blog/ultimate-guide-supercar-rentals-las-vegas',
      noIndex: false,
      noFollow: false
    },
    status: 'published',
    featured: true,
    featuredImage: '/images/blog/vegas-strip-supercars.jpg',
    categories: ['Guides', 'Las Vegas'],
    tags: ['supercars', 'las vegas', 'luxury', 'travel', 'experiences'],
    publishedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-10T15:30:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Corporate Events: Impress Your Clients with Luxury Transportation',
    slug: 'corporate-events-luxury-transportation',
    excerpt: 'Elevate your business events with premium luxury vehicle services. Learn how the right transportation can enhance your corporate image and client relationships.',
    content: `
# Corporate Events: Impress Your Clients with Luxury Transportation

In the world of business, first impressions matter. When you're hosting clients, closing deals, or attending corporate events, the transportation you choose sends a powerful message about your company's values and attention to detail.

## The Business Case for Luxury Transportation

### Professional Image
Arriving in a luxury vehicle immediately establishes credibility and success. It shows that your company values excellence and attention to detail—qualities that clients want to see in their business partners.

### Client Experience
Premium transportation is more than just getting from point A to point B. It's about creating an experience that makes your clients feel valued and important.

## Our Corporate Services

### Executive Transportation
- **Airport Transfers**: Professional meet-and-greet services
- **Meeting Transfers**: Punctual and reliable city transportation
- **Multi-day Packages**: Dedicated vehicles for extended stays

### Event Coordination
- **Product Launches**: Make a statement with exotic arrivals
- **Client Entertainment**: VIP treatment for your most important guests
- **Team Building**: Unique experiences that bring teams together

### Benefits for Your Business

1. **Enhanced Professional Image**: Command respect and attention
2. **Stress-Free Logistics**: We handle all transportation details
3. **Client Relationship Building**: Shared luxury experiences create lasting bonds
4. **Tax Advantages**: Business transportation expenses are often deductible

## Planning Your Corporate Event

### Consultation Process
Our team works closely with you to understand your specific needs, timeline, and budget. We provide detailed proposals and coordinate all logistics.

### Fleet Selection
Choose from our diverse fleet based on your event type:
- **Luxury SUVs**: Professional and spacious for groups
- **Sports Cars**: High-impact for product launches
- **Premium Sedans**: Classic elegance for executive transport

### Additional Services
- **Professional Chauffeurs**: Discrete and experienced drivers
- **Route Planning**: Optimal timing and traffic management
- **24/7 Support**: Dedicated coordination throughout your event

Ready to elevate your next corporate event? Contact our corporate services team to discuss your requirements and create a memorable experience for your clients.
    `,
    author: {
      name: 'Chris Morin',
      email: 'chris@moonraker.ai'
    },
    seo: {
      metaTitle: 'Corporate Luxury Transportation Services Las Vegas | DT Exotics',
      metaDescription: 'Professional luxury transportation for corporate events in Las Vegas. Executive car services, client entertainment, and business event transportation.',
      keywords: ['corporate transportation', 'executive car service', 'business events las vegas', 'luxury transportation', 'client entertainment'],
      ogTitle: 'Corporate Events: Impress Your Clients with Luxury Transportation',
      ogDescription: 'Elevate your business events with premium luxury vehicle services that enhance your corporate image and client relationships.',
      noIndex: false,
      noFollow: false
    },
    status: 'published',
    featured: false,
    featuredImage: '/images/blog/corporate-luxury.jpg',
    categories: ['Corporate', 'Business'],
    tags: ['corporate', 'business', 'professional', 'clients', 'events'],
    publishedAt: '2024-01-12T14:00:00Z',
    createdAt: '2024-01-08T11:20:00Z',
    updatedAt: '2024-01-12T14:00:00Z'
  }
]

export const blogCategories: BlogCategory[] = [
  {
    id: '1',
    name: 'Guides',
    slug: 'guides',
    description: 'Comprehensive guides for supercar rentals and luxury experiences',
    postCount: 1
  },
  {
    id: '2',
    name: 'Las Vegas',
    slug: 'las-vegas',
    description: 'Everything about luxury experiences in Las Vegas',
    postCount: 1
  },
  {
    id: '3',
    name: 'Corporate',
    slug: 'corporate',
    description: 'Business and corporate luxury transportation insights',
    postCount: 1
  },
  {
    id: '4',
    name: 'Business',
    slug: 'business',
    description: 'Business-focused content and industry insights',
    postCount: 1
  }
]

export const blogTags: BlogTag[] = [
  { id: '1', name: 'Supercars', slug: 'supercars', postCount: 1 },
  { id: '2', name: 'Las Vegas', slug: 'las-vegas', postCount: 1 },
  { id: '3', name: 'Luxury', slug: 'luxury', postCount: 2 },
  { id: '4', name: 'Travel', slug: 'travel', postCount: 1 },
  { id: '5', name: 'Experiences', slug: 'experiences', postCount: 1 },
  { id: '6', name: 'Corporate', slug: 'corporate', postCount: 1 },
  { id: '7', name: 'Business', slug: 'business', postCount: 1 },
  { id: '8', name: 'Professional', slug: 'professional', postCount: 1 },
  { id: '9', name: 'Clients', slug: 'clients', postCount: 1 },
  { id: '10', name: 'Events', slug: 'events', postCount: 1 }
]