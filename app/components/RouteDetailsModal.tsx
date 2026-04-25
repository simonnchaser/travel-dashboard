'use client';

import { useEffect, useState } from 'react';
import { getDirections, DirectionsResult, getTravelModeIcon, getVehicleTypeKorean } from '../../lib/directionsService';

interface RouteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  departure: string;
  arrival: string;
  departureUrl?: string;
  arrivalUrl?: string;
  transportMethod?: string;
}

export default function RouteDetailsModal({
  isOpen,
  onClose,
  departure,
  arrival,
  departureUrl,
  arrivalUrl,
  transportMethod,
}: RouteDetailsModalProps) {
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && departure && arrival) {
      loadDirections();
    }
  }, [isOpen, departure, arrival]);

  async function loadDirections() {
    setLoading(true);
    setError(null);

    try {
      // Load Google Maps if not already loaded
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places,geometry`;
        script.async = true;
        document.head.appendChild(script);

        await new Promise<void>((resolve) => {
          script.onload = () => resolve();
        });
      }

      // Use URLs if available, otherwise use names
      const origin = departureUrl || departure;
      const destination = arrivalUrl || arrival;

      const result = await getDirections(origin, destination, 'TRANSIT');

      if (result) {
        setDirections(result);
      } else {
        setError('경로를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('Failed to load directions:', err);
      setError('경로 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">🚆 경로 상세 정보</h2>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <span className="text-green-300">📍 출발:</span>
                  <span className="font-semibold">{departure}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-red-300">🎯 도착:</span>
                  <span className="font-semibold">{arrival}</span>
                </p>
                {transportMethod && (
                  <p className="flex items-center gap-2">
                    <span className="text-yellow-300">🚌 수단:</span>
                    <span className="font-semibold">{transportMethod}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors ml-4"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">경로 정보를 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-semibold">⚠️ {error}</p>
              <p className="text-sm mt-1">Google Maps에서 경로를 찾을 수 없습니다. 직접 입력한 정보를 확인해주세요.</p>
            </div>
          )}

          {directions && !loading && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h3 className="font-bold text-lg text-gray-800 mb-3">📊 요약</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600">총 거리</p>
                    <p className="text-2xl font-bold text-indigo-600">{directions.distance}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600">예상 시간</p>
                    <p className="text-2xl font-bold text-purple-600">{directions.duration}</p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <span>🗺️</span>
                  <span>상세 경로</span>
                  <span className="text-sm font-normal text-gray-500">({directions.steps.length}단계)</span>
                </h3>
                <div className="space-y-3">
                  {directions.steps.map((step, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        {/* Step Number */}
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>

                        {/* Step Details */}
                        <div className="flex-1">
                          {/* Transit Details (if available) */}
                          {step.transitDetails ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{getTravelModeIcon(step.transitDetails.vehicle)}</span>
                                <span className="font-bold text-lg text-gray-800">
                                  {getVehicleTypeKorean(step.transitDetails.vehicle)}
                                </span>
                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                                  {step.transitDetails.line}
                                </span>
                              </div>

                              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-green-600 font-semibold">🚏 승차:</span>
                                  <span>{step.transitDetails.departure}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-red-600 font-semibold">🚏 하차:</span>
                                  <span>{step.transitDetails.arrival}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span>정거장: {step.transitDetails.numStops}개</span>
                                  <span>•</span>
                                  <span>{step.duration}</span>
                                  <span>•</span>
                                  <span>{step.distance}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Walking/Other Steps */
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{getTravelModeIcon(step.travelMode)}</span>
                                <span className="font-semibold text-gray-800">{step.instruction}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span>📏 {step.distance}</span>
                                <span>•</span>
                                <span>⏱️ {step.duration}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* External Link */}
              <div className="flex gap-3">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(departure)}&destination=${encodeURIComponent(arrival)}&travelmode=transit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-center"
                >
                  Google Maps에서 보기 →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
