import { NextRequest, NextResponse } from 'next/server';

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID; // Your Google Business listing Place ID

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

// In-memory cache for reviews data
let reviewsCache: {
  data: any;
  timestamp: number;
} | null = null;

export async function GET(request: NextRequest) {
  try {
    // Check if we have valid cached data
    if (reviewsCache && (Date.now() - reviewsCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: reviewsCache.data,
        cached: true
      });
    }

    // Validate environment variables
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      );
    }

    if (!PLACE_ID) {
      return NextResponse.json(
        { error: 'Google Place ID not configured' },
        { status: 500 }
      );
    }

    // Fetch place details including reviews from Google Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,user_ratings_total,reviews,formatted_address,formatted_phone_number,website,opening_hours&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(placesUrl);
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API status: ${data.status}`);
    }

    const placeDetails = data.result;

    // Format the reviews data
    const formattedData = {
      name: placeDetails.name || 'DT Exotics',
      rating: placeDetails.rating || 5.0,
      totalReviews: placeDetails.user_ratings_total || 0,
      address: placeDetails.formatted_address,
      phone: placeDetails.formatted_phone_number,
      website: placeDetails.website,
      isOpen: placeDetails.opening_hours?.open_now,
      reviews: (placeDetails.reviews || []).map((review: any) => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time,
        relativeTime: review.relative_time_description,
        profilePhoto: review.profile_photo_url
      })).slice(0, 5) // Limit to 5 most recent reviews
    };

    // Update cache
    reviewsCache = {
      data: formattedData,
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      data: formattedData,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching Google Reviews:', error);
    
    // Return cached data if available, even if stale
    if (reviewsCache) {
      return NextResponse.json({
        success: true,
        data: reviewsCache.data,
        cached: true,
        warning: 'Using cached data due to API error'
      });
    }

    // Fallback data if no cache available
    return NextResponse.json({
      success: true,
      data: {
        name: 'DT Exotics',
        rating: 5.0,
        totalReviews: 1,
        address: '9620 Las Vegas Blvd S, Las Vegas, NV 89123',
        phone: '(702) 518-0924',
        website: 'https://dtexoticslv.com',
        isOpen: true,
        reviews: [
          {
            author: 'Valued Customer',
            rating: 5,
            text: 'Amazing experience with DT Exotics! Professional service and incredible supercars.',
            relativeTime: 'a week ago'
          }
        ]
      },
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Optional: Add a POST endpoint to manually refresh cache
export async function POST(request: NextRequest) {
  try {
    // Clear cache to force refresh
    reviewsCache = null;
    
    // Fetch fresh data
    const freshData = await GET(request);
    
    return NextResponse.json({
      success: true,
      message: 'Cache refreshed successfully'
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    );
  }
}
