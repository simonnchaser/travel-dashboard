/**
 * Extract search query from Google Maps search URL
 */
function extractSearchQuery(url: string): string | null {
  try {
    // Format: /maps/search/ENCODED_QUERY
    const searchMatch = url.match(/\/maps\/search\/([^/?]+)/);
    if (searchMatch) {
      return decodeURIComponent(searchMatch[1]);
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Cache for geocoding results to avoid repeated API calls
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

/**
 * Geocode address/place name to coordinates using server-side API
 * This is async and should be called separately, not in extractCoordinatesFromUrl
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!;
  }

  try {
    const response = await fetch(
      `/api/geocode?address=${encodeURIComponent(address)}`
    );

    if (!response.ok) {
      geocodeCache.set(address, null);
      return null;
    }

    const data = await response.json();

    if (data.lat && data.lng) {
      const coords = { lat: data.lat, lng: data.lng };
      geocodeCache.set(address, coords);
      return coords;
    }

    geocodeCache.set(address, null);
    return null;
  } catch (error) {
    geocodeCache.set(address, null);
    return null;
  }
}

/**
 * Extract coordinates from Google Maps URL
 * Supports various Google Maps URL formats
 * Returns { lat, lng, isSearchUrl, searchQuery } where isSearchUrl indicates if geocoding is needed
 */
export function extractCoordinatesFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;

  try {
    // Format 1: @lat,lng,zoom (e.g., @47.5036,19.0383,16z)
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      return {
        lat: parseFloat(atMatch[1]),
        lng: parseFloat(atMatch[2])
      };
    }

    // Format 2: !3d and !4d parameters (e.g., !3d47.503639!4d19.038291)
    const d3Match = url.match(/!3d(-?\d+\.?\d*)/);
    const d4Match = url.match(/!4d(-?\d+\.?\d*)/);
    if (d3Match && d4Match) {
      return {
        lat: parseFloat(d3Match[1]),
        lng: parseFloat(d4Match[1])
      };
    }

    // Format 3: /place/LAT+LNG/ or /place/LAT,LNG/
    const placeMatch = url.match(/\/place\/(-?\d+\.?\d*)[,+](-?\d+\.?\d*)/);
    if (placeMatch) {
      return {
        lat: parseFloat(placeMatch[1]),
        lng: parseFloat(placeMatch[2])
      };
    }

    // Format 4: ll=lat,lng parameter
    const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (llMatch) {
      return {
        lat: parseFloat(llMatch[1]),
        lng: parseFloat(llMatch[2])
      };
    }

    // Format 5: query=lat,lng parameter (from PlaceAutocomplete)
    const queryMatch = url.match(/[?&]query=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (queryMatch) {
      console.log('✅ Matched query format:', { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) });
      return {
        lat: parseFloat(queryMatch[1]),
        lng: parseFloat(queryMatch[2])
      };
    }

    // If it's a search URL, we can't extract coordinates directly
    // The calling code should use geocodeAddress separately
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract coordinates from URL, with fallback to geocoding for search URLs
 * This is async and should be used in components
 */
export async function extractCoordinatesFromUrlWithGeocoding(url: string): Promise<{ lat: number; lng: number } | null> {
  if (!url) return null;

  // First try direct coordinate extraction
  const coords = extractCoordinatesFromUrl(url);
  if (coords) return coords;

  // If that fails, check if it's a search URL and geocode it
  const searchQuery = extractSearchQuery(url);
  if (searchQuery) {
    return await geocodeAddress(searchQuery);
  }

  return null;
}

/**
 * Get transit directions between two locations using Google Directions API
 */
export async function getTransitDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{
  duration: string;
  distance: string;
  steps: Array<{
    instruction: string;
    duration: string;
    mode: string;
    transitDetails?: {
      line: string;
      vehicle: string;
      departure: string;
      arrival: string;
    };
  }>;
} | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=transit&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        duration: leg.duration.text,
        distance: leg.distance.text,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          duration: step.duration.text,
          mode: step.travel_mode.toLowerCase(),
          transitDetails: step.transit_details ? {
            line: step.transit_details.line.short_name || step.transit_details.line.name,
            vehicle: step.transit_details.line.vehicle.name,
            departure: step.transit_details.departure_stop.name,
            arrival: step.transit_details.arrival_stop.name,
          } : undefined
        }))
      };
    }

    console.warn('Directions API returned no results');
    return null;
  } catch (error) {
    console.error('Directions API error:', error);
    return null;
  }
}

/**
 * Get center point from array of coordinates
 */
export function getCenterPoint(coordinates: { lat: number; lng: number }[]): { lat: number; lng: number } {
  if (coordinates.length === 0) {
    return { lat: 48.2082, lng: 16.3738 }; // Default to Vienna
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length
  };
}

/**
 * Get color for category
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    accommodation: '#10b981', // green
    dining: '#f59e0b', // amber
    activity: '#8b5cf6', // purple
    transport: '#3b82f6', // blue
  };
  return colors[category] || '#6b7280'; // default gray
}

/**
 * Get color for city
 */
export function getCityColor(cityId: string): string {
  const colors: Record<string, string> = {
    budapest: '#ef4444', // red
    prague: '#3b82f6', // blue
    vienna: '#8b5cf6', // purple
    cesky_krumlov: '#10b981', // green
    hallstatt: '#f59e0b', // amber
  };
  return colors[cityId] || '#6b7280'; // default gray
}
