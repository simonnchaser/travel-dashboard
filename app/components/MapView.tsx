'use client';

import { useEffect, useRef, useState } from 'react';
import { ScheduleItem } from '../types/schedule';
import { extractCoordinatesFromUrlWithGeocoding, getCenterPoint, getCityColor } from '../../lib/mapUtils';
import { getDirections, DirectionsResult, getTravelModeIcon, getVehicleTypeKorean } from '../../lib/directionsService';

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

interface LocationWithIndex extends ScheduleItem {
  coords: { lat: number; lng: number };
  originalIndex: number;
}

export default function MapView({ schedules }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const locationsRef = useRef<LocationWithIndex[]>([]);

  // Selection state for route calculation
  const [selectedMarkers, setSelectedMarkers] = useState<number[]>([]);
  const selectedMarkersRef = useRef<number[]>([]); // Keep ref in sync with state
  const [routeInfo, setRouteInfo] = useState<DirectionsResult | null>(null);
  const [travelMode, setTravelMode] = useState<'TRANSIT' | 'WALKING' | 'DRIVING'>('TRANSIT');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const directionsRenderer = useRef<any>(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedMarkersRef.current = selectedMarkers;
  }, [selectedMarkers]);

  // Handle marker selection
  const handleMarkerClick = async (index: number) => {
    console.log('🔵 Marker clicked:', index);
    console.log('🔵 Current selection:', selectedMarkersRef.current);

    const newSelection = [...selectedMarkersRef.current];

    if (newSelection.includes(index)) {
      // Deselect if already selected
      const idx = newSelection.indexOf(index);
      newSelection.splice(idx, 1);
      console.log('🔴 Deselected, new selection:', newSelection);
      setSelectedMarkers(newSelection);
      updateMarkerStyles(newSelection);

      // Clear route if deselecting
      if (newSelection.length < 2) {
        clearRoute();
      }
    } else {
      // Select marker
      if (newSelection.length >= 2) {
        // Replace oldest selection
        newSelection.shift();
      }
      newSelection.push(index);
      console.log('🟢 Selected, new selection:', newSelection);
      setSelectedMarkers(newSelection);
      updateMarkerStyles(newSelection);

      // Calculate route if two markers selected
      if (newSelection.length === 2) {
        console.log('🗺️ Calculating route between', newSelection[0], 'and', newSelection[1]);
        await calculateRoute(newSelection[0], newSelection[1]);
      } else {
        clearRoute();
      }
    }
  };

  // Update marker visual styles based on selection
  const updateMarkerStyles = (selection: number[]) => {
    markersRef.current.forEach((marker, idx) => {
      const location = locationsRef.current[idx];
      if (!location) return;

      const color = getCityColor(location.city_id || 'default');
      const isSelected = selection.includes(idx);
      const isFirst = selection[0] === idx;
      const isSecond = selection[1] === idx;

      marker.setIcon({
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: isFirst ? '#22c55e' : isSecond ? '#ef4444' : color,
        fillOpacity: 1,
        strokeColor: isSelected ? '#fbbf24' : '#ffffff',
        strokeWeight: isSelected ? 5 : 3,
        scale: isSelected ? 20 : 15
      });
    });
  };

  // Calculate route between two points
  const calculateRoute = async (fromIndex: number, toIndex: number) => {
    setLoadingRoute(true);
    setRouteInfo(null);

    try {
      const fromLocation = locationsRef.current[fromIndex];
      const toLocation = locationsRef.current[toIndex];

      if (!fromLocation || !toLocation) return;

      // Use coordinates for more accurate routing
      const origin = `${fromLocation.coords.lat},${fromLocation.coords.lng}`;
      const destination = `${toLocation.coords.lat},${toLocation.coords.lng}`;

      const directions = await getDirections(origin, destination, travelMode);

      if (directions) {
        setRouteInfo(directions);
        displayRouteOnMap(fromLocation.coords, toLocation.coords);
      }
    } catch (error) {
      console.error('Failed to calculate route:', error);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Display route polyline on map
  const displayRouteOnMap = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    // Clear previous route
    if (directionsRenderer.current) {
      directionsRenderer.current.setMap(null);
    }

    // Create directions renderer
    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: map.current,
      suppressMarkers: true, // We already have our custom markers
      polylineOptions: {
        strokeColor: '#4f46e5',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });

    // Request directions
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: from.lat, lng: from.lng },
        destination: { lat: to.lat, lng: to.lng },
        travelMode: window.google.maps.TravelMode[travelMode]
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(result);
        }
      }
    );
  };

  // Clear route display
  const clearRoute = () => {
    if (directionsRenderer.current) {
      directionsRenderer.current.setMap(null);
    }
    setRouteInfo(null);
  };

  // Reset selection
  const resetSelection = () => {
    setSelectedMarkers([]);
    updateMarkerStyles([]);
    clearRoute();
  };

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
        sortedSchedules.map(async (s, originalIndex) => {
          if (s.category === 'transport') {
            if (!s.departure_google_maps_url) return null;
            const coords = await extractCoordinatesFromUrlWithGeocoding(s.departure_google_maps_url);
            return coords ? { ...s, coords, originalIndex } : null;
          } else {
            if (!s.google_maps_url) return null;
            const coords = await extractCoordinatesFromUrlWithGeocoding(s.google_maps_url);
            return coords ? { ...s, coords, originalIndex } : null;
          }
        })
      );

      const locations = locationsWithCoords.filter(Boolean) as LocationWithIndex[];
      locationsRef.current = locations;

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

          // Create custom marker with label
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
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                💡 클릭해서 두 지점 선택 시 경로 표시
              </div>
            </div>
          `;

          const infoWindow = new window.google.maps.InfoWindow({
            content: popupContent
          });

          // Update click handler to support selection
          marker.addListener('click', async () => {
            // Handle selection first
            await handleMarkerClick(index);
            // Then show info window
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

  // Update route when travel mode changes
  useEffect(() => {
    if (selectedMarkers.length === 2) {
      calculateRoute(selectedMarkers[0], selectedMarkers[1]);
    }
  }, [travelMode]);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>🗺️</span>
              <span>일정 지도</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {schedules.filter(s => s.category === 'transport' ? s.departure_google_maps_url : s.google_maps_url).length}개 위치 표시 중
            </p>
          </div>

          {/* Travel Mode Selector */}
          {selectedMarkers.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setTravelMode('TRANSIT')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  travelMode === 'TRANSIT'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🚌 대중교통
              </button>
              <button
                onClick={() => setTravelMode('WALKING')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  travelMode === 'WALKING'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🚶 도보
              </button>
              <button
                onClick={() => setTravelMode('DRIVING')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  travelMode === 'DRIVING'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🚗 자동차
              </button>
              <button
                onClick={resetSelection}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition-all"
              >
                ✕ 초기화
              </button>
            </div>
          )}
        </div>

        {/* Selection Instructions */}
        {selectedMarkers.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            💡 <strong>지도 사용법:</strong> 마커를 클릭하여 두 지점을 선택하면 경로 정보가 표시됩니다.
          </div>
        )}

        {/* Selection Status */}
        {selectedMarkers.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-semibold text-indigo-900">
                  선택됨: {selectedMarkers.length}/2
                </span>
                {selectedMarkers.length === 1 && (
                  <span className="text-indigo-700 ml-2">
                    → 다른 지점을 선택하세요
                  </span>
                )}
                {selectedMarkers.length === 2 && locationsRef.current[selectedMarkers[0]] && locationsRef.current[selectedMarkers[1]] && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-indigo-800">
                      <span className="text-green-600">🟢</span>
                      <span>{locationsRef.current[selectedMarkers[0]].title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-800">
                      <span className="text-red-600">🔴</span>
                      <span>{locationsRef.current[selectedMarkers[1]].title}</span>
                    </div>
                  </div>
                )}
              </div>
              {loadingRoute && (
                <div className="flex items-center gap-2 text-indigo-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                  <span className="text-sm font-semibold">경로 계산 중...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map and Route Info Container */}
      <div className="flex flex-col lg:flex-row">
        {/* Map */}
        <div className={`${routeInfo ? 'lg:w-2/3' : 'w-full'} relative`}>
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

        {/* Route Info Panel */}
        {routeInfo && selectedMarkers.length === 2 && (
          <div className="lg:w-1/3 p-4 bg-gray-50 border-l border-gray-200 overflow-y-auto max-h-[600px]">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <span>🗺️</span>
              <span>경로 정보</span>
            </h3>

            {/* Summary */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600">총 거리</p>
                  <p className="text-lg font-bold text-indigo-600">{routeInfo.distance}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">예상 시간</p>
                  <p className="text-lg font-bold text-purple-600">{routeInfo.duration}</p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                상세 경로 ({routeInfo.steps.length}단계)
              </h4>
              {routeInfo.steps.map((step, index) => (
                <div key={index} className="bg-white rounded-lg p-3 shadow-sm text-sm">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      {step.transitDetails ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span>{getTravelModeIcon(step.transitDetails.vehicle)}</span>
                            <span className="font-semibold text-gray-800">
                              {getVehicleTypeKorean(step.transitDetails.vehicle)}
                            </span>
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">
                              {step.transitDetails.line}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5 ml-6">
                            <p>🚏 승차: {step.transitDetails.departure}</p>
                            <p>🚏 하차: {step.transitDetails.arrival}</p>
                            <p>{step.transitDetails.numStops}개 정거장 • {step.duration}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-gray-800">{step.instruction}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {step.distance} • {step.duration}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Google Maps Link */}
            {locationsRef.current[selectedMarkers[0]] && locationsRef.current[selectedMarkers[1]] && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${locationsRef.current[selectedMarkers[0]].coords.lat},${locationsRef.current[selectedMarkers[0]].coords.lng}&destination=${locationsRef.current[selectedMarkers[1]].coords.lat},${locationsRef.current[selectedMarkers[1]].coords.lng}&travelmode=${travelMode.toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-center font-semibold hover:bg-indigo-700 transition-colors text-sm"
              >
                Google Maps에서 보기 →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
