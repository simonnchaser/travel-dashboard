'use client';

import { useState, useEffect, useRef } from 'react';
import { Booking, BookingCategory } from '../types/booking';
import { supabase } from '../../lib/supabase';
import { uploadFile, deleteFile, downloadFile, formatFileSize, getFileIcon } from '../../lib/fileUpload';

const bookingCategoryLabels: Record<BookingCategory, string> = {
  flight: '✈️ 항공권',
  accommodation: '🏨 숙소',
  tour: '🎫 투어/액티비티',
  restaurant: '🍽️ 레스토랑',
  transportation: '🚗 교통',
  entertainment: '🎭 공연/이벤트',
  other: '📋 기타',
};

interface BookingViewProps {
  projectId: string;
}

export default function BookingView({ projectId }: BookingViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New booking form state
  const [newBooking, setNewBooking] = useState({
    category: 'flight' as BookingCategory,
    title: '',
    booking_number: '',
    booking_url: '',
    booking_date: '',
    start_date: '',
    end_date: '',
    location: '',
    price: '',
    currency: 'KRW',
    notes: '',
  });
  const [newBookingFile, setNewBookingFile] = useState<File | null>(null);

  // Load bookings
  useEffect(() => {
    loadBookings();
  }, [projectId]);

  const loadBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('trip_id', projectId)
      .order('start_date', { ascending: true });

    if (!error && data) {
      setBookings(data);
    }
    setLoading(false);
  };

  const addBooking = async () => {
    if (!newBooking.title.trim()) {
      alert('제목을 입력하세요!');
      return;
    }

    setUploading(true);

    try {
      let fileData = null;

      // Upload file if selected
      if (newBookingFile) {
        fileData = await uploadFile(newBookingFile, projectId, 'booking');
        if (!fileData) {
          alert('파일 업로드 실패!');
          setUploading(false);
          return;
        }
      }

      const { error } = await supabase.from('bookings').insert([
        {
          ...newBooking,
          trip_id: projectId,
          price: newBooking.price ? parseFloat(newBooking.price) : null,
          booking_date: newBooking.booking_date || null,
          start_date: newBooking.start_date || null,
          end_date: newBooking.end_date || null,
          ...(fileData && {
            file_name: fileData.file_name,
            file_path: fileData.file_path,
            file_type: fileData.file_type,
            file_size: fileData.file_size,
          }),
        },
      ]);

      if (!error) {
        setNewBooking({
          category: 'flight',
          title: '',
          booking_number: '',
          booking_url: '',
          booking_date: '',
          start_date: '',
          end_date: '',
          location: '',
          price: '',
          currency: 'KRW',
          notes: '',
        });
        setNewBookingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadBookings();
      } else {
        alert('추가 실패!');
      }
    } catch (error) {
      console.error('Error adding booking:', error);
      alert('추가 실패!');
    } finally {
      setUploading(false);
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    // Find the booking to get file path
    const booking = bookings.find((b) => b.id === id);

    // Delete file from storage if exists
    if (booking?.file_path) {
      await deleteFile(booking.file_path);
    }

    const { error } = await supabase.from('bookings').delete().eq('id', id);

    if (!error) {
      loadBookings();
    } else {
      alert('삭제 실패!');
    }
  };

  const formatPrice = (price: number | undefined, currency: string | undefined) => {
    if (!price) return '';
    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₩';
    return `${currencySymbol}${price.toLocaleString()}`;
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">🎫 예약 관리</h1>
          <p className="text-gray-600">항공권, 숙소, 투어 등 모든 예약 정보를 한 곳에서 관리하세요</p>
        </div>

        {/* Add New Booking Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-purple-700 mb-4">새 예약 추가</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={newBooking.category}
                onChange={(e) => setNewBooking({ ...newBooking, category: e.target.value as BookingCategory })}
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                {Object.entries(bookingCategoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
              <input
                type="text"
                value={newBooking.title}
                onChange={(e) => setNewBooking({ ...newBooking, title: e.target.value })}
                placeholder="예: 인천 → 프라하 직항"
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">예약번호</label>
              <input
                type="text"
                value={newBooking.booking_number}
                onChange={(e) => setNewBooking({ ...newBooking, booking_number: e.target.value })}
                placeholder="예: ABC123456"
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">예약 링크</label>
              <input
                type="url"
                value={newBooking.booking_url}
                onChange={(e) => setNewBooking({ ...newBooking, booking_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작 날짜/시간</label>
              <input
                type="datetime-local"
                value={newBooking.start_date}
                onChange={(e) => setNewBooking({ ...newBooking, start_date: e.target.value })}
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료 날짜/시간 (선택)</label>
              <input
                type="datetime-local"
                value={newBooking.end_date}
                onChange={(e) => setNewBooking({ ...newBooking, end_date: e.target.value })}
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">장소/주소</label>
              <input
                type="text"
                value={newBooking.location}
                onChange={(e) => setNewBooking({ ...newBooking, location: e.target.value })}
                placeholder="예: 프라하 시내 호텔"
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
                <input
                  type="number"
                  value={newBooking.price}
                  onChange={(e) => setNewBooking({ ...newBooking, price: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">통화</label>
                <select
                  value={newBooking.currency}
                  onChange={(e) => setNewBooking({ ...newBooking, currency: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value="KRW">₩ KRW</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="CZK">Kč CZK</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
              <textarea
                value={newBooking.notes}
                onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                placeholder="예: 체크인 15:00 이후, 조식 포함"
                rows={2}
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">📎 예약 확인서 첨부 (선택)</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setNewBookingFile(e.target.files?.[0] || null)}
                accept="image/*,.pdf,.doc,.docx"
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
              />
              {newBookingFile && (
                <p className="text-xs text-gray-600 mt-1">
                  {getFileIcon(newBookingFile.type)} {newBookingFile.name} ({formatFileSize(newBookingFile.size)})
                </p>
              )}
            </div>
          </div>
          <button
            onClick={addBooking}
            disabled={uploading}
            className="w-full mt-4 bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? '업로드 중...' : '+ 예약 추가'}
          </button>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-purple-700 mb-4">예약 목록 ({bookings.length}개)</h2>
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">아직 예약이 없습니다</p>
              <p className="text-sm">위 양식에서 예약을 추가해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border-2 border-purple-100 rounded-lg p-4 hover:border-purple-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{bookingCategoryLabels[booking.category].split(' ')[0]}</span>
                        <h3 className="text-lg font-bold text-gray-800">{booking.title}</h3>
                        {booking.booking_number && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {booking.booking_number}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {bookingCategoryLabels[booking.category].split(' ')[1]}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteBooking(booking.id!)}
                      className="text-red-500 hover:text-red-700 font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {booking.start_date && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">시작:</span>
                        <span className="text-gray-600">{formatDateTime(booking.start_date)}</span>
                      </div>
                    )}
                    {booking.end_date && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">종료:</span>
                        <span className="text-gray-600">{formatDateTime(booking.end_date)}</span>
                      </div>
                    )}
                    {booking.location && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">📍 위치:</span>
                        <span className="text-gray-600">{booking.location}</span>
                      </div>
                    )}
                    {booking.price && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">💰 가격:</span>
                        <span className="text-gray-600">{formatPrice(booking.price, booking.currency)}</span>
                      </div>
                    )}
                  </div>

                  {booking.notes && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {booking.notes}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {booking.booking_url && (
                      <a
                        href={booking.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                      >
                        🔗 예약 페이지 열기
                      </a>
                    )}
                    {booking.file_name && booking.file_path && (
                      <button
                        onClick={() => downloadFile(booking.file_path!, booking.file_name!)}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition-colors flex items-center gap-1"
                      >
                        {getFileIcon(booking.file_type || '')} {booking.file_name} ⬇️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
