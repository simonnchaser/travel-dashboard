'use client';

import { useState, useEffect } from 'react';
import { TripSettings, City } from '../types/tripSettings';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<TripSettings>({
    trip_name: '',
    countries: [],
    cities: [],
    start_date: '',
    end_date: '',
  });
  const [saving, setSaving] = useState(false);

  // Temp state for adding
  const [newCountry, setNewCountry] = useState('');
  const [newCity, setNewCity] = useState<City>({ id: '', name: '', country: '' });

  // API state
  const [allCountries, setAllCountries] = useState<string[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [citiesForSelectedCountry, setCitiesForSelectedCountry] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch all countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch cities when country is selected for new city
  useEffect(() => {
    if (newCity.country) {
      fetchCitiesForCountry(newCity.country);
    }
  }, [newCity.country]);

  async function fetchCountries() {
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries');
      const data = await response.json();
      if (data.data) {
        const countryNames = data.data.map((c: any) => c.country).sort();
        setAllCountries(countryNames);
        setFilteredCountries(countryNames);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  }

  async function fetchCitiesForCountry(country: string) {
    setLoadingCities(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country }),
      });
      const data = await response.json();
      if (data.data) {
        const cities = data.data.sort();
        setCitiesForSelectedCountry(cities);
        setFilteredCities(cities);
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
      setCitiesForSelectedCountry([]);
      setFilteredCities([]);
    } finally {
      setLoadingCities(false);
    }
  }

  const addCountry = () => {
    if (newCountry && !settings.countries.includes(newCountry)) {
      setSettings({
        ...settings,
        countries: [...settings.countries, newCountry],
      });
      setNewCountry('');
    }
  };

  const removeCountry = (index: number) => {
    const country = settings.countries[index];
    setSettings({
      ...settings,
      countries: settings.countries.filter((_, i) => i !== index),
      cities: settings.cities.filter(c => c.country !== country), // Remove cities from that country
    });
  };

  const addCity = () => {
    if (!newCity.id || !newCity.name || !newCity.country) {
      alert('모든 필드를 입력해주세요!');
      return;
    }

    if (settings.cities.some(c => c.id === newCity.id)) {
      alert('이미 존재하는 도시 ID입니다!');
      return;
    }

    setSettings({
      ...settings,
      cities: [...settings.cities, { ...newCity }],
    });

    setNewCity({ id: '', name: '', country: '' });
  };

  const removeCity = (index: number) => {
    setSettings({
      ...settings,
      cities: settings.cities.filter((_, i) => i !== index),
    });
  };

  async function saveAndContinue() {
    // Validation
    if (!settings.trip_name) {
      alert('여행 이름을 입력해주세요!');
      return;
    }
    if (settings.countries.length === 0) {
      alert('최소 1개 국가를 추가해주세요!');
      return;
    }
    if (settings.cities.length === 0) {
      alert('최소 1개 도시를 추가해주세요!');
      return;
    }
    if (!settings.start_date || !settings.end_date) {
      alert('여행 날짜를 입력해주세요!');
      return;
    }

    setSaving(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다!');
        router.push('/login');
        return;
      }

      // Generate project code
      const { data: codeData } = await supabase.rpc('generate_project_code');
      const projectCode = codeData || 'TEMP' + Date.now();

      // Create new project
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          project_code: projectCode,
          project_name: settings.trip_name,
          countries: settings.countries,
          cities: settings.cities,
          start_date: settings.start_date,
          end_date: settings.end_date,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Show project code to user
      alert(`프로젝트 생성 완료!\n\n프로젝트 코드: ${projectCode}\n\n이 코드를 친구에게 공유하세요!`);

      // Redirect to projects page
      router.push('/projects');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      alert(`저장 실패!\n\n에러: ${err?.message || JSON.stringify(err)}\n\n브라우저 콘솔(F12)을 확인해주세요.`);
    } finally {
      setSaving(false);
    }
  }

  const canProceedToStep2 = settings.trip_name && settings.start_date && settings.end_date;
  const canProceedToStep3 = settings.countries.length > 0;
  const canFinish = settings.cities.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                    step >= s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-2 mx-2 rounded transition-all ${
                      step > s ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-semibold text-gray-600">
            <span className={step === 1 ? 'text-indigo-600' : ''}>기본 정보</span>
            <span className={step === 2 ? 'text-indigo-600' : ''}>방문 국가</span>
            <span className={step === 3 ? 'text-indigo-600' : ''}>방문 도시</span>
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">✈️ 여행 계획 시작하기</h1>
              <p className="text-gray-600">여행의 기본 정보를 입력해주세요</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                여행 이름 *
              </label>
              <input
                type="text"
                value={settings.trip_name}
                onChange={(e) => setSettings({ ...settings, trip_name: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                placeholder="예: 유럽 여행, 동남아 배낭여행"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  시작일 *
                </label>
                <input
                  type="date"
                  value={settings.start_date}
                  onChange={(e) => setSettings({ ...settings, start_date: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  종료일 *
                </label>
                <input
                  type="date"
                  value={settings.end_date}
                  onChange={(e) => setSettings({ ...settings, end_date: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-lg"
              >
                다음 단계 →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Countries */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">🌍 방문할 국가</h1>
              <p className="text-gray-600">여행하실 국가들을 추가해주세요</p>
            </div>

            {/* Add Country Form */}
            <div className="bg-indigo-50 p-6 rounded-xl border-2 border-indigo-200">
              <div className="flex gap-3 relative">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewCountry(value);
                      if (value) {
                        const filtered = allCountries.filter(c =>
                          c.toLowerCase().includes(value.toLowerCase())
                        );
                        setFilteredCountries(filtered);
                      } else {
                        setFilteredCountries(allCountries);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        addCountry();
                      }
                    }}
                    placeholder="국가명 입력 또는 검색 (예: Hungary, South Korea)"
                    className="w-full p-4 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-lg"
                    autoFocus
                  />
                  {/* Country Suggestions Dropdown */}
                  {newCountry && filteredCountries.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-indigo-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredCountries.slice(0, 10).map((country) => (
                        <button
                          key={country}
                          onClick={() => {
                            setNewCountry(country);
                            setFilteredCountries([]);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          {country}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={addCountry}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
                >
                  추가
                </button>
              </div>
            </div>

            {/* Country List */}
            <div className="space-y-3">
              {settings.countries.map((country, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-2 border-blue-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌏</span>
                    <span className="text-lg font-semibold text-gray-800">{country}</span>
                  </div>
                  <button
                    onClick={() => removeCountry(index)}
                    className="px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg font-bold transition-all"
                  >
                    삭제
                  </button>
                </div>
              ))}
              {settings.countries.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg">아직 추가된 국가가 없습니다</p>
                  <p className="text-sm">위 입력창에서 국가를 추가해보세요!</p>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all text-lg"
              >
                ← 이전
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3}
                className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-lg"
              >
                다음 단계 →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Cities */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">🏙️ 방문할 도시</h1>
              <p className="text-gray-600">각 국가별로 방문하실 도시들을 추가해주세요</p>
            </div>

            {/* Add City Form */}
            <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200 space-y-4">
              <p className="text-sm font-semibold text-purple-900">새 도시 추가</p>

              {/* Step 1: Select Country */}
              <div>
                <label className="block text-xs font-semibold text-purple-800 mb-2">1. 국가 선택 *</label>
                <select
                  value={newCity.country}
                  onChange={(e) => {
                    setNewCity({ ...newCity, country: e.target.value, name: '', id: '' });
                  }}
                  className="w-full p-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">국가를 선택하세요</option>
                  {settings.countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select or Enter City */}
              {newCity.country && (
                <div className="relative">
                  <label className="block text-xs font-semibold text-purple-800 mb-2">
                    2. 도시 선택 또는 입력 *
                    {loadingCities && <span className="ml-2 text-xs text-gray-500">(로딩 중...)</span>}
                  </label>
                  <input
                    type="text"
                    value={newCity.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewCity({
                        ...newCity,
                        name: value,
                        id: value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                      });
                      if (value) {
                        const filtered = citiesForSelectedCountry.filter(c =>
                          c.toLowerCase().includes(value.toLowerCase())
                        );
                        setFilteredCities(filtered);
                      } else {
                        setFilteredCities(citiesForSelectedCountry);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        addCity();
                      }
                    }}
                    placeholder="도시명 입력 또는 검색 (예: Budapest, Prague)"
                    className="w-full p-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />

                  {/* City Suggestions Dropdown */}
                  {newCity.name && filteredCities.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-purple-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredCities.slice(0, 20).map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setNewCity({
                              ...newCity,
                              name: city,
                              id: city.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                            });
                            setFilteredCities([]);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Show Auto-Generated ID */}
              {newCity.id && (
                <div>
                  <label className="block text-xs font-semibold text-purple-800 mb-2">3. 자동 생성된 ID</label>
                  <div className="p-3 bg-purple-100 border-2 border-purple-300 rounded-lg">
                    <code className="text-sm font-mono text-purple-900">{newCity.id}</code>
                  </div>
                </div>
              )}

              <button
                onClick={addCity}
                disabled={!newCity.country || !newCity.name || !newCity.id}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                + 도시 추가
              </button>
              <p className="text-xs text-purple-700">
                💡 도시를 선택하거나 입력하면 ID가 자동으로 생성됩니다
              </p>
            </div>

            {/* City List by Country */}
            <div className="space-y-4">
              {settings.countries.map((country) => {
                const citiesInCountry = settings.cities.filter(c => c.country === country);
                return (
                  <div key={country} className="border-2 border-gray-200 rounded-xl p-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-3">🌏 {country}</h3>
                    {citiesInCountry.length > 0 ? (
                      <div className="space-y-2">
                        {citiesInCountry.map((city, index) => {
                          const globalIndex = settings.cities.findIndex(c => c.id === city.id);
                          return (
                            <div
                              key={city.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                  {city.id}
                                </span>
                                <span className="font-semibold text-gray-800">{city.name}</span>
                              </div>
                              <button
                                onClick={() => removeCity(globalIndex)}
                                className="text-red-600 hover:text-red-800 font-bold"
                              >
                                🗑️
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm text-center py-4">이 국가의 도시를 추가해주세요</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all text-lg"
              >
                ← 이전
              </button>
              <button
                onClick={saveAndContinue}
                disabled={!canFinish || saving}
                className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-lg"
              >
                {saving ? '저장 중...' : '✓ 완료하고 시작하기'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </main>
  );
}
