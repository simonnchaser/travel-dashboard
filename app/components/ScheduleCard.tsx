'use client';

import { useState } from 'react';
import { ScheduleItem } from '../types/schedule';

interface ScheduleCardProps {
  schedule: ScheduleItem;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (schedule: ScheduleItem) => void;
  onDelete: () => void;
}

export default function ScheduleCard({
  schedule,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}: ScheduleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(schedule.notes || '');

  const toggleReservation = () => {
    onUpdate({
      ...schedule,
      reservation: {
        ...schedule.reservation,
        completed: !schedule.reservation.completed,
        status: !schedule.reservation.completed ? '완료' : '예정',
      },
    });
  };

  const saveNotes = () => {
    onUpdate({
      ...schedule,
      notes: editedNotes,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      {/* Card Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-indigo-600">#{index + 1}</span>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{schedule.title}</h3>
                <p className="text-sm text-gray-500">
                  {schedule.date}
                </p>
              </div>
            </div>

            {schedule.details && (
              <p className="text-gray-600 mt-2">{schedule.details}</p>
            )}
          </div>

          {/* Reservation Status Badge */}
          <div className="flex items-center gap-2">
            {schedule.reservation.required && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleReservation();
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  schedule.reservation.completed
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                {schedule.reservation.completed ? '✅ 완료' : '⏳ 예약 필요'}
              </button>
            )}

            <button className="text-gray-400 hover:text-gray-600">
              {isExpanded ? '▲' : '▼'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {schedule.transportation && (
              <div className="flex items-start gap-2">
                <span className="text-xl">🚌</span>
                <div>
                  <p className="text-sm font-semibold text-gray-700">교통편</p>
                  <p className="text-gray-600">{schedule.transportation}</p>
                </div>
              </div>
            )}

            {schedule.meals && (
              <div className="flex items-start gap-2">
                <span className="text-xl">🍽️</span>
                <div>
                  <p className="text-sm font-semibold text-gray-700">식사</p>
                  <p className="text-gray-600">{schedule.meals}</p>
                </div>
              </div>
            )}

            {schedule.cost && (
              <div className="flex items-start gap-2">
                <span className="text-xl">💰</span>
                <div>
                  <p className="text-sm font-semibold text-gray-700">비용</p>
                  <p className="text-gray-600">
                    {schedule.cost} {schedule.unit && `(${schedule.unit})`}
                  </p>
                </div>
              </div>
            )}

            {schedule.checkin_checkout && (
              <div className="flex items-start gap-2">
                <span className="text-xl">🏨</span>
                <div>
                  <p className="text-sm font-semibold text-gray-700">체크인/아웃</p>
                  <p className="text-gray-600">{schedule.checkin_checkout}</p>
                  {schedule.duration && (
                    <p className="text-sm text-gray-500">기간: {schedule.duration}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Google Maps Link */}
          {schedule.google_maps_url && (
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <a
                href={schedule.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                구글맵에서 보기
              </a>
              {schedule.coordinates && (
                <span className="text-sm text-gray-500">
                  ({schedule.coordinates.latitude.toFixed(4)}, {schedule.coordinates.longitude.toFixed(4)})
                </span>
              )}
            </div>
          )}

          {/* Reservation Link */}
          {schedule.reservation_link && (
            <div className="flex items-center gap-2">
              <span className="text-xl">🔗</span>
              <a
                href={schedule.reservation_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                예약 링크
              </a>
            </div>
          )}

          {/* Notes Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">📝 메모</p>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  편집
                </button>
              )}
            </div>

            {isEditing ? (
              <div>
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder="메모를 입력하세요..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={saveNotes}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditedNotes(schedule.notes || '');
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">
                {schedule.notes || '메모가 없습니다. 편집 버튼을 눌러 추가하세요.'}
              </p>
            )}
          </div>

          {/* Delete Button */}
          <div className="border-t pt-4 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-semibold"
            >
              🗑️ 일정 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
