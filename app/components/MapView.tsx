'use client';

import { useEffect, useRef, useState } from 'react';
import { ScheduleItem } from '../types/schedule';
import { extractCoordinatesFromUrlWithGeocoding, getCenterPoint, getCityColor } from '../../lib/mapUtils';

// Extend Window interface to include google
declare global {
  interface Window {
    google: any;
  }
}

interface MapViewProps {
  schedules: ScheduleItem[];
}

const categoryLabels = {
  accommodation: '숙박',
  dining: '식사',
  activity: '액티비티',
  transport: '교통',
};

export default function MapView({ schedules }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    let isMounted = true;

    // Async function to load map with geocoding
    async function loadMap() {
      // Sort schedules by time (date first, then time)
      const sortedSchedules = [...schedules].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;

        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });

      // Extract coordinates from schedules with geocoding support
      const locationsWithCoords = await Promise.all(
        sortedSchedules.map(async (s) => {
          if (s.category === 'transport') {
            if (!s.departure_google_maps_url) return null;
            const coords = await extractCoordinatesFromUrlWithGeocoding(s.departure_google_maps_url);
            return coords ? { ...s, coords } : null;
          } else {
            if (!s.google_maps_url) return null;
            const coords = await extractCoordinatesFromUrlWithGeocoding(s.google_maps_url);
            return coords ? { ...s, coords } : null;
          }
        })
      );

      const locations = locationsWithCoords.filter(Boolean) as (ScheduleItem & { coords: { lat: number; lng: number } })[];

      console.log('=== MapView Debug ===');
      console.log('Total schedules:', schedules.length);
      console.log('Locations with valid coords:', locations.length);
      console.log('====================');

      if (locations.length === 0 || !isMounted) {
        return;
      }

      // Calculate center point
      const center = getCenterPoint(locations.map(l => l.coords));

      // Load Google Maps script dynamically (only once)
      if (!window.google) {
        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places,geometry`;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);

          await new Promise<void>((resolve) => {
            script.onload = () => resolve();
          });
        } else {
          // Wait for existing script to load
          await new Promise<void>((resolve) => {
            const checkGoogle = setInterval(() => {
              if (window.google) {
                clearInterval(checkGoogle);
                resolve();
              }
            }, 100);
          });
        }
      }

      if (!isMounted) return;

      try {
        // Clean up existing markers and polylines
        markersRef.current.forEach(marker => marker.setMap(null));
        polylinesRef.current.forEach(polyline => polyline.setMap(null));
        markersRef.current = [];
        polylinesRef.current = [];

        // Initialize map (create new or reuse existing)
        if (!map.current && mapContainer.current) {
          map.current = new window.google.maps.Map(mapContainer.current, {
            center: { lat: center.lat, lng: center.lng },
            zoom: 6,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          });

          setMapLoaded(true);
        }

        // Process transport schedules with routes (with geocoding support)
        const transportRoutesPromises = sortedSchedules
          .filter(s => s.category === 'transport' && s.departure_google_maps_url && s.arrival_google_maps_url)
          .map(async (s) => {
            const departureCoords = await extractCoordinatesFromUrlWithGeocoding(s.departure_google_maps_url!);
            const arrivalCoords = await extractCoordinatesFromUrlWithGeocoding(s.arrival_google_maps_url!);

            if (!departureCoords || !arrivalCoords) return null;

            return { ...s, departureCoords, arrivalCoords };
          });

        const transportRoutes = (await Promise.all(transportRoutesPromises)).filter(Boolean) as (ScheduleItem & {
          departureCoords: { lat: number; lng: number };
          arrivalCoords: { lat: number; lng: number };
        })[];

        // Add route lines for transport schedules
        transportRoutes.forEach((route) => {
          // Create polyline for the route
          const routePath = new window.google.maps.Polyline({
            path: [
              { lat: route.departureCoords.lat, lng: route.departureCoords.lng },
              { lat: route.arrivalCoords.lat, lng: route.arrivalCoords.lng }
            ],
            geodesic: true,
            strokeColor: '#f97316',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            icons: [{
              icon: {
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              },
              offset: '100%',
              repeat: '100px'
            }]
          });

          routePath.setMap(map.current);
          polylinesRef.current.push(routePath);

          // Add departure marker (green)
          const departureMarker = new window.google.maps.Marker({
            position: { lat: route.departureCoords.lat, lng: route.departureCoords.lng },
            map: map.current,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#22c55e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 10
            }
          });

          const departureInfoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 6px;">
                <div style="font-weight: bold; color: #15803d;">📍 출발</div>
                <div style="font-size: 13px;">${route.departure || '출발지'}</div>
              </div>
            `
          });

          departureMarker.addListener('click', () => {
            departureInfoWindow.open(map.current, departureMarker);
          });

          markersRef.current.push(departureMarker);

          // Add arrival marker (red)
          const arrivalMarker = new window.google.maps.Marker({
            position: { lat: route.arrivalCoords.lat, lng: route.arrivalCoords.lng },
            map: map.current,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 10
            }
          });

          const arrivalInfoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 6px;">
                <div style="font-weight: bold; color: #b91c1c;">🎯 도착</div>
                <div style="font-size: 13px;">${route.arrival || '도착지'}</div>
                ${route.transport_method ? `<div style="font-size: 12px; color: #6b7280;">🚌 ${route.transport_method}</div>` : ''}
                ${route.travel_duration ? `<div style="font-size: 12px; color: #6b7280;">⏱️ ${route.travel_duration}</div>` : ''}
              </div>
            `
          });

          arrivalMarker.addListener('click', () => {
            arrivalInfoWindow.open(map.current, arrivalMarker);
          });

          markersRef.current.push(arrivalMarker);
        });

        // Add markers for each location with custom labels
        locations.forEach((location, index) => {
          const { coords, title, city, category, date, time, cost, currency } = location;

          // Create marker color based on city
          const color = getCityColor(location.city_id || 'default');

          // Create custom marker with label using AdvancedMarkerElement alternative
          const marker = new window.google.maps.Marker({
            position: { lat: coords.lat, lng: coords.lng },
            map: map.current,
            label: {
              text: (index + 1).toString(),
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '14px'
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 15
            },
            title: title
          });

          // Create popup content
          const popupContent = `
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #1f2937;">
                #${index + 1} ${title}
              </h3>
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
                📅 ${date} ${time ? `- ${time}` : ''}
              </div>
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
                📍 ${city}
              </div>
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
                🏷️ ${categoryLabels[category as keyof typeof categoryLabels] || category}
              </div>
              ${cost ? `
                <div style="font-size: 14px; color: #4f46e5; font-weight: 600; margin-top: 8px;">
                  💰 ${cost} ${currency || 'KRW'}
                </div>
              ` : ''}
              ${location.google_maps_url ? `
                <a
                  href="${location.google_maps_url}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="display: inline-block; margin-top: 8px; color: #4f46e5; text-decoration: underline; font-size: 13px;"
                >
                  구글맵에서 보기 →
                </a>
              ` : ''}
            </div>
          `;

          const infoWindow = new window.google.maps.InfoWindow({
            content: popupContent
          });

          marker.addListener('click', () => {
            infoWindow.open(map.current, marker);
          });

          markersRef.current.push(marker);
        });

        // Fit map to show all markers
        if (locations.length > 1) {
          const bounds = new window.google.maps.LatLngBounds();
          locations.forEach(l => bounds.extend({ lat: l.coords.lat, lng: l.coords.lng }));
          map.current!.fitBounds(bounds);
        }

      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    }

    // Call the async function
    loadMap();

    // Cleanup function
    return () => {
      isMounted = false;
      // Clean up markers and polylines when component unmounts or schedules change
      markersRef.current.forEach(marker => marker.setMap(null));
      polylinesRef.current.forEach(polyline => polyline.setMap(null));
      markersRef.current = [];
      polylinesRef.current = [];
    };
  }, [schedules]);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>🗺️</span>
          <span>일정 지도</span>
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {schedules.filter(s => s.category === 'transport' ? s.departure_google_maps_url : s.google_maps_url).length}개 위치 표시 중
        </p>
      </div>
      <div
        ref={mapContainer}
        className="w-full h-[600px]"
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">지도 로딩 중...</p>
        </div>
      )}
    </div>
  );
}
