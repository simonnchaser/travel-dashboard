'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ScheduleItem } from '../types/schedule';
import { extractCoordinatesFromUrlWithGeocoding, getCenterPoint, getCityColor } from '../../lib/mapUtils';

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
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Map already initialized

    // Mapbox access token (you'll need to add this to .env.local)
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';

    // Async function to load map with geocoding
    async function loadMap() {
      // Extract coordinates from schedules with geocoding support
      const locationsWithCoords = await Promise.all(
        schedules.map(async (s) => {
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

      if (locations.length === 0) {
        return;
      }

      // Calculate center point
      const center = getCenterPoint(locations.map(l => l.coords));

      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [center.lng, center.lat],
        zoom: 6,
      });

    map.current.on('load', async () => {
      setMapLoaded(true);

      // Process transport schedules with routes (with geocoding support)
      const transportRoutesPromises = schedules
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
      transportRoutes.forEach((route, index) => {
        const lineId = `route-${index}`;

        // Remove existing layers and source if they exist
        // IMPORTANT: Remove all layers using the source BEFORE removing the source
        if (map.current!.getLayer(`${lineId}-arrow`)) {
          map.current!.removeLayer(`${lineId}-arrow`);
        }
        if (map.current!.getLayer(lineId)) {
          map.current!.removeLayer(lineId);
        }
        if (map.current!.getSource(lineId)) {
          map.current!.removeSource(lineId);
        }

        // Add the route line
        map.current!.addSource(lineId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [route.departureCoords.lng, route.departureCoords.lat],
                [route.arrivalCoords.lng, route.arrivalCoords.lat],
              ],
            },
          },
        });

        map.current!.addLayer({
          id: lineId,
          type: 'line',
          source: lineId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#f97316', // orange for transport
            'line-width': 3,
            'line-dasharray': [2, 2], // dashed line
          },
        });

        // Add arrow symbol layer
        map.current!.addLayer({
          id: `${lineId}-arrow`,
          type: 'symbol',
          source: lineId,
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 100,
            'text-field': '→',
            'text-size': 20,
            'text-keep-upright': false,
          },
          paint: {
            'text-color': '#f97316',
          },
        });


        // Add departure marker
        const departureEl = document.createElement('div');
        departureEl.style.width = '20px';
        departureEl.style.height = '20px';
        departureEl.style.borderRadius = '50%';
        departureEl.style.backgroundColor = '#22c55e'; // green for departure
        departureEl.style.border = '2px solid white';
        departureEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        new mapboxgl.Marker(departureEl)
          .setLngLat([route.departureCoords.lng, route.departureCoords.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 15 }).setHTML(`
              <div style="padding: 6px;">
                <div style="font-weight: bold; color: #15803d;">📍 출발</div>
                <div style="font-size: 13px;">${route.departure || '출발지'}</div>
              </div>
            `)
          )
          .addTo(map.current!);

        // Add arrival marker
        const arrivalEl = document.createElement('div');
        arrivalEl.style.width = '20px';
        arrivalEl.style.height = '20px';
        arrivalEl.style.borderRadius = '50%';
        arrivalEl.style.backgroundColor = '#ef4444'; // red for arrival
        arrivalEl.style.border = '2px solid white';
        arrivalEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        new mapboxgl.Marker(arrivalEl)
          .setLngLat([route.arrivalCoords.lng, route.arrivalCoords.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 15 }).setHTML(`
              <div style="padding: 6px;">
                <div style="font-weight: bold; color: #b91c1c;">🎯 도착</div>
                <div style="font-size: 13px;">${route.arrival || '도착지'}</div>
                ${route.transport_method ? `<div style="font-size: 12px; color: #6b7280;">🚌 ${route.transport_method}</div>` : ''}
                ${route.travel_duration ? `<div style="font-size: 12px; color: #6b7280;">⏱️ ${route.travel_duration}</div>` : ''}
              </div>
            `)
          )
          .addTo(map.current!);
      });

      // Add markers for each location
      locations.forEach((location, index) => {
        const { coords, title, city, category, date, time, cost, currency } = location;

        // Create marker color based on city
        const color = getCityColor(location.city_id || 'default');

        // Create custom marker element with label
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        el.style.cursor = 'pointer';

        // Create the circle
        const circle = document.createElement('div');
        circle.style.backgroundColor = color;
        circle.style.width = '30px';
        circle.style.height = '30px';
        circle.style.borderRadius = '50%';
        circle.style.border = '3px solid white';
        circle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        circle.style.display = 'flex';
        circle.style.alignItems = 'center';
        circle.style.justifyContent = 'center';
        circle.style.fontSize = '14px';
        circle.textContent = (index + 1).toString();
        circle.style.color = 'white';
        circle.style.fontWeight = 'bold';

        // Create the label (title)
        const label = document.createElement('div');
        label.style.marginTop = '4px';
        label.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        label.style.padding = '4px 8px';
        label.style.borderRadius = '4px';
        label.style.fontSize = '12px';
        label.style.fontWeight = '600';
        label.style.color = '#1f2937';
        label.style.whiteSpace = 'nowrap';
        label.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        label.style.border = '1px solid rgba(0,0,0,0.1)';
        label.textContent = title;

        // Append circle and label to marker element
        el.appendChild(circle);
        el.appendChild(label);

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

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(popupContent);

        // Add marker to map
        new mapboxgl.Marker(el)
          .setLngLat([coords.lng, coords.lat])
          .setPopup(popup)
          .addTo(map.current!);
      });

      // Fit map to show all markers
      if (locations.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach(l => bounds.extend([l.coords.lng, l.coords.lat]));
        map.current!.fitBounds(bounds, { padding: 50 });
      }
    });
    }

    // Call the async function
    loadMap();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
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
