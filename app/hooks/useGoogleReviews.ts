import { useState, useEffect, useCallback } from 'react';

export interface GoogleReview {
  author: string;
  rating: number;
  text: string;
  time?: number;
  relativeTime: string;
  profilePhoto?: string;
}

export interface GoogleReviewsData {
  name: string;
  rating: number;
  totalReviews: number;
  address?: string;
  phone?: string;
  website?: string;
  isOpen?: boolean;
  reviews: GoogleReview[];
}

export interface UseGoogleReviewsReturn {
  data: GoogleReviewsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useGoogleReviews(): UseGoogleReviewsReturn {
  const [data, setData] = useState<GoogleReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/google-reviews', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
        
        // Log cache status for debugging
        if (result.cached) {
          console.log('Google Reviews: Using cached data');
        } else {
          console.log('Google Reviews: Fresh data fetched');
        }
        
        if (result.fallback) {
          console.warn('Google Reviews: Using fallback data due to API error');
        }
      } else {
        throw new Error(result.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching Google Reviews:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Set fallback data if no data exists
      if (!data) {
        setData({
          name: 'DT Exotics',
          rating: 5.0,
          totalReviews: 1,
          address: '9620 Las Vegas Blvd S STE E4 #508, Las Vegas, NV 89123',
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
        });
      }
    } finally {
      setLoading(false);
    }
  }, [data]);

  const refresh = useCallback(async () => {
    await fetchReviews();
  }, [fetchReviews]);

  // Initial fetch
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReviews();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [fetchReviews]);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated
  };
}
