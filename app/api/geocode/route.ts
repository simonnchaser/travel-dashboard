import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  try {
    // Try Google Maps Geocoding API first if key is available
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (googleApiKey) {
      console.log('🌍 [Server] Geocoding with Google Maps API:', address);
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`
      );

      const googleData = await googleResponse.json();

      if (googleData.status === 'OK' && googleData.results && googleData.results.length > 0) {
        const location = googleData.results[0].geometry.location;
        console.log('✅ [Server] Google geocoding success:', { lat: location.lat, lng: location.lng });
        return NextResponse.json({
          lat: location.lat,
          lng: location.lng
        });
      }

      console.warn('⚠️ [Server] Google geocoding failed:', googleData.status);
    }

    // Fallback to OpenStreetMap Nominatim
    console.log('🌍 [Server] Falling back to OSM Nominatim:', address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'TravelDashboard/1.0'
        }
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      console.log('✅ [Server] OSM geocoding success:', { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      return NextResponse.json({
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      });
    }

    console.error('❌ [Server] No geocoding results found');
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  } catch (error) {
    console.error('❌ [Server] Geocoding error:', error);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
