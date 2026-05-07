'use client';

import { useState, useEffect, useRef } from 'react';

// Declare google types
declare global {
  interface Window {
    google: any;
  }
}

interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  place_id: string;
  google_maps_url: string;
  types: string[];
  photo_url?: string;
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export default function PlaceAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = '장소를 검색하세요',
  className = '',
}: PlaceAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [placeDetails, setPlaceDetails] = useState<Map<string, PlaceResult>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);

  // Google Maps API 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      // PlacesService는 div 요소가 필요함
      const div = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(div);
    }
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 장소 검색
  const searchPlaces = async (query: string) => {
    if (!query.trim() || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    autocompleteService.current.getPlacePredictions(
      {
        input: query,
      },
      (results: any, status: any) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setIsOpen(true);
          // 각 결과의 상세 정보 가져오기
          results.forEach((prediction: any) => {
            fetchPlaceDetails(prediction.place_id);
          });
        } else {
          setPredictions([]);
          setIsOpen(false);
        }
      }
    );
  };

  // 장소 상세 정보 가져오기
  const fetchPlaceDetails = (placeId: string) => {
    if (!placesService.current || placeDetails.has(placeId)) return;

    placesService.current.getDetails(
      {
        placeId,
        fields: ['name', 'formatted_address', 'geometry', 'place_id', 'types', 'photos'],
      },
      (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const lat = place.geometry?.location?.lat() || 0;
          const lng = place.geometry?.location?.lng() || 0;

          const placeData: PlaceResult = {
            name: place.name || '',
            address: place.formatted_address || '',
            lat,
            lng,
            place_id: place.place_id || '',
            google_maps_url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${place.place_id}`,
            types: place.types || [],
            photo_url: place.photos?.[0]?.getUrl({ maxWidth: 100, maxHeight: 100 }),
          };

          setPlaceDetails((prev) => new Map(prev).set(placeId, placeData));
        }
      }
    );
  };

  // 입력 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // 사용자가 직접 입력을 수정하면 선택된 장소 초기화
    if (selectedPlace && newValue !== selectedPlace.name) {
      setSelectedPlace(null);
    }

    searchPlaces(newValue);
  };

  // 장소 선택 핸들러 with fallback
  const handlePlaceSelect = (placeId: string, prediction: any) => {
    const place = placeDetails.get(placeId);

    if (place) {
      // Use cached details
      setSelectedPlace(place);
      setIsOpen(false);
      onPlaceSelect(place);
    } else {
      // Fallback: Use prediction data to create basic place info
      const fallbackPlace: PlaceResult = {
        name: prediction.structured_formatting.main_text,
        address: prediction.description,
        lat: 0,
        lng: 0,
        place_id: placeId,
        google_maps_url: `https://www.google.com/maps/search/?api=1&query_place_id=${placeId}`,
        types: [],
      };

      setSelectedPlace(fallbackPlace);
      setIsOpen(false);
      onPlaceSelect(fallbackPlace);

      // Try to fetch details in background
      fetchPlaceDetails(placeId);
    }
  };

  // 선택된 장소 삭제 핸들러
  const handleRemovePlace = () => {
    setSelectedPlace(null);
    onChange('');
    onPlaceSelect({
      name: '',
      address: '',
      lat: 0,
      lng: 0,
      place_id: '',
      google_maps_url: '',
      types: [],
    });
  };

  // 카테고리 아이콘 가져오기
  const getCategoryIcon = (types: string[]) => {
    if (types.includes('lodging') || types.includes('hotel')) return '🏨';
    if (types.includes('restaurant') || types.includes('food')) return '🍽️';
    if (types.includes('tourist_attraction') || types.includes('museum')) return '🎭';
    if (types.includes('airport') || types.includes('train_station') || types.includes('transit_station')) return '🚌';
    if (types.includes('bus_station')) return '🚌';
    return '📍';
  };

  // 카테고리 라벨 가져오기
  const getCategoryLabel = (types: string[]) => {
    if (types.includes('lodging') || types.includes('hotel')) return '숙소';
    if (types.includes('restaurant') || types.includes('food')) return '식당';
    if (types.includes('tourist_attraction')) return '관광지';
    if (types.includes('museum')) return '박물관';
    if (types.includes('airport')) return '공항';
    if (types.includes('train_station')) return '기차역';
    if (types.includes('bus_station')) return '버스 정류장';
    if (types.includes('transit_station')) return '교통';
    return '장소';
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (predictions.length > 0) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      {isOpen && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto"
        >
          {predictions.map((prediction) => {
            const details = placeDetails.get(prediction.place_id);
            return (
              <button
                key={prediction.place_id}
                onClick={() => handlePlaceSelect(prediction.place_id, prediction)}
                className="w-full p-3 hover:bg-indigo-50 border-b last:border-b-0 text-left transition-colors flex items-start gap-3"
              >
                {/* 썸네일 이미지 */}
                <div className="shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  {details?.photo_url ? (
                    <img
                      src={details.photo_url}
                      alt={details.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">
                      {details ? getCategoryIcon(details.types) : '📍'}
                    </span>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  {/* 이름 + 카테고리 */}
                  <div className="flex items-center gap-2 mb-1">
                    {details && (
                      <span className="text-lg">
                        {getCategoryIcon(details.types)}
                      </span>
                    )}
                    <span className="font-semibold text-gray-900 truncate">
                      {prediction.structured_formatting.main_text}
                    </span>
                  </div>

                  {/* 주소 */}
                  <div className="text-sm text-gray-600 truncate">
                    📍 {prediction.structured_formatting.secondary_text || prediction.description}
                  </div>

                  {/* 카테고리 라벨 */}
                  {details && (
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {getCategoryLabel(details.types)}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && predictions.length === 0 && !isLoading && value.trim() && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 text-center text-gray-500"
        >
          검색 결과가 없습니다
        </div>
      )}

      {/* 선택된 장소 미리보기 카드 */}
      {selectedPlace && (
        <div className="mt-3 bg-linear-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4 shadow-md">
          <div className="flex items-start gap-3">
            {/* 썸네일 */}
            <div className="shrink-0 w-20 h-20 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
              {selectedPlace.photo_url ? (
                <img
                  src={selectedPlace.photo_url}
                  alt={selectedPlace.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">
                  {getCategoryIcon(selectedPlace.types)}
                </span>
              )}
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  {/* 장소 이름 */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">
                      {getCategoryIcon(selectedPlace.types)}
                    </span>
                    <h3 className="font-bold text-gray-900 text-lg truncate">
                      {selectedPlace.name}
                    </h3>
                  </div>

                  {/* 카테고리 배지 */}
                  <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                    {getCategoryLabel(selectedPlace.types)}
                  </span>
                </div>

                {/* X 삭제 버튼 */}
                <button
                  onClick={handleRemovePlace}
                  className="shrink-0 w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                  title="선택 취소"
                >
                  <span className="text-lg font-bold">×</span>
                </button>
              </div>

              {/* 주소 */}
              <div className="flex items-start gap-1 text-sm text-gray-700 mb-2">
                <span className="shrink-0">📍</span>
                <span className="wrap-break-word">{selectedPlace.address}</span>
              </div>

              {/* 좌표 */}
              {selectedPlace.lat !== 0 && selectedPlace.lng !== 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200">
                    {selectedPlace.lat.toFixed(6)}, {selectedPlace.lng.toFixed(6)}
                  </span>
                </div>
              )}

              {/* Google Maps URL */}
              <div className="flex items-center gap-2">
                <a
                  href={selectedPlace.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <span>🗺️</span>
                  <span>Google Maps에서 보기</span>
                </a>
                <span className="text-xs text-green-600 font-semibold">✓ URL 저장됨</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
