// Google Maps Directions API Service

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  travelMode: string;
  transitDetails?: {
    line: string;
    departure: string;
    arrival: string;
    numStops: number;
    vehicle: string;
  };
}

export interface DirectionsResult {
  duration: string;
  distance: string;
  steps: RouteStep[];
  overview: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export async function getDirections(
  origin: string,
  destination: string,
  travelMode: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING' = 'TRANSIT'
): Promise<DirectionsResult | null> {
  // Ensure Google Maps is loaded
  if (!window.google) {
    console.error('Google Maps not loaded');
    return null;
  }

  return new Promise((resolve) => {
    const directionsService = new window.google.maps.DirectionsService();

    const request = {
      origin,
      destination,
      travelMode: window.google.maps.TravelMode[travelMode],
      transitOptions: {
        modes: ['BUS', 'RAIL', 'SUBWAY', 'TRAIN', 'TRAM'],
      },
    };

    directionsService.route(request, (result: any, status: any) => {
      if (status === 'OK' && result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0];

        const steps: RouteStep[] = leg.steps.map((step: any) => {
          const routeStep: RouteStep = {
            instruction: step.instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
            distance: step.distance.text,
            duration: step.duration.text,
            travelMode: step.travel_mode,
          };

          // Add transit details if available
          if (step.transit && step.transit.line) {
            routeStep.transitDetails = {
              line: step.transit.line.name || step.transit.line.short_name,
              departure: step.transit.departure_stop.name,
              arrival: step.transit.arrival_stop.name,
              numStops: step.transit.num_stops,
              vehicle: step.transit.line.vehicle.type,
            };
          }

          return routeStep;
        });

        resolve({
          duration: leg.duration.text,
          distance: leg.distance.text,
          steps,
          overview: `${leg.distance.text}, ${leg.duration.text}`,
        });
      } else {
        console.error('Directions request failed:', status);
        resolve(null);
      }
    });
  });
}

// Get travel mode icon
export function getTravelModeIcon(mode: string): string {
  const icons: Record<string, string> = {
    DRIVING: '🚗',
    WALKING: '🚶',
    TRANSIT: '🚌',
    BICYCLING: '🚴',
    BUS: '🚌',
    SUBWAY: '🚇',
    TRAIN: '🚆',
    TRAM: '🚋',
    RAIL: '🚆',
  };
  return icons[mode] || '🚌';
}

// Get vehicle type in Korean
export function getVehicleTypeKorean(vehicleType: string): string {
  const types: Record<string, string> = {
    BUS: '버스',
    SUBWAY: '지하철',
    TRAIN: '기차',
    TRAM: '트램',
    RAIL: '철도',
    HEAVY_RAIL: '철도',
    METRO_RAIL: '메트로',
    COMMUTER_TRAIN: '통근 열차',
    HIGH_SPEED_TRAIN: '고속 열차',
    LONG_DISTANCE_TRAIN: '장거리 열차',
  };
  return types[vehicleType] || vehicleType;
}
