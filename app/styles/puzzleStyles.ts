/**
 * 🧩 Tripzle 퍼즐 테마 스타일 유틸리티
 *
 * 각 카테고리별 퍼즐 조각 스타일과 공통 퍼즐 효과를 정의합니다.
 */

import { ScheduleCategory } from '../types/schedule';

/**
 * 퍼즐 카드 베이스 스타일
 * - 둥근 모서리
 * - 그림자 효과 (퍼즐 조각이 떠있는 느낌)
 * - 호버 애니메이션
 */
export const puzzleCardBase = `
  relative
  rounded-2xl
  border-3
  transition-all
  duration-200
  ease-in-out
  puzzle-hover
  overflow-hidden
`;

/**
 * 카테고리별 퍼즐 색상 스타일
 */
export const puzzleCategoryStyles: Record<ScheduleCategory, string> = {
  accommodation: `
    bg-[var(--puzzle-accommodation-light)]
    border-[var(--puzzle-accommodation)]
    hover:bg-purple-100
  `,
  dining: `
    bg-[var(--puzzle-dining-light)]
    border-[var(--puzzle-dining)]
    hover:bg-green-100
  `,
  activity: `
    bg-[var(--puzzle-activity-light)]
    border-[var(--puzzle-activity)]
    hover:bg-amber-100
  `,
  transport: `
    bg-[var(--puzzle-transport-light)]
    border-[var(--puzzle-transport)]
    hover:bg-blue-100
  `,
  tour: `
    bg-[var(--puzzle-tour-light)]
    border-[var(--puzzle-tour)]
    hover:bg-orange-100
  `,
};

/**
 * 카테고리별 배지 스타일
 */
export const puzzleBadgeStyles: Record<ScheduleCategory, string> = {
  accommodation: `
    bg-[var(--puzzle-accommodation)]
    text-white
  `,
  dining: `
    bg-[var(--puzzle-dining)]
    text-white
  `,
  activity: `
    bg-[var(--puzzle-activity)]
    text-white
  `,
  transport: `
    bg-[var(--puzzle-transport)]
    text-white
  `,
  tour: `
    bg-[var(--puzzle-tour)]
    text-white
  `,
};

/**
 * 카테고리별 텍스트 색상
 */
export const puzzleTextStyles: Record<ScheduleCategory, string> = {
  accommodation: 'text-purple-900',
  dining: 'text-green-900',
  activity: 'text-amber-900',
  transport: 'text-blue-900',
  tour: 'text-orange-900',
};

/**
 * 퍼즐 버튼 스타일
 */
export const puzzleButtonStyles = {
  primary: `
    relative
    px-4 py-2
    rounded-xl
    font-semibold
    transition-all
    duration-200
    bg-gradient-to-br from-purple-500 to-indigo-600
    text-white
    shadow-[3px_3px_0px_0px_rgba(99,102,241,0.3)]
    hover:shadow-[5px_5px_0px_0px_rgba(99,102,241,0.4)]
    hover:-translate-y-0.5
    active:shadow-[2px_2px_0px_0px_rgba(99,102,241,0.3)]
    active:translate-y-0
  `,
  secondary: `
    relative
    px-4 py-2
    rounded-xl
    font-semibold
    transition-all
    duration-200
    bg-white
    text-indigo-600
    border-2
    border-indigo-300
    shadow-[3px_3px_0px_0px_rgba(99,102,241,0.2)]
    hover:shadow-[5px_5px_0px_0px_rgba(99,102,241,0.3)]
    hover:-translate-y-0.5
    active:shadow-[2px_2px_0px_0px_rgba(99,102,241,0.2)]
    active:translate-y-0
  `,
  danger: `
    relative
    px-4 py-2
    rounded-xl
    font-semibold
    transition-all
    duration-200
    bg-gradient-to-br from-red-500 to-pink-600
    text-white
    shadow-[3px_3px_0px_0px_rgba(239,68,68,0.3)]
    hover:shadow-[5px_5px_0px_0px_rgba(239,68,68,0.4)]
    hover:-translate-y-0.5
    active:shadow-[2px_2px_0px_0px_rgba(239,68,68,0.3)]
    active:translate-y-0
  `,
};

/**
 * 퍼즐 모달 스타일
 */
export const puzzleModalStyles = `
  rounded-3xl
  border-4
  border-indigo-200
  shadow-[8px_8px_0px_0px_rgba(99,102,241,0.15)]
  overflow-hidden
`;

/**
 * 퍼즐 입력 필드 스타일
 */
export const puzzleInputStyles = `
  rounded-xl
  border-2
  border-gray-300
  focus:border-indigo-400
  focus:ring-4
  focus:ring-indigo-100
  transition-all
  duration-200
`;

/**
 * 퍼즐 애니메이션 클래스
 */
export const puzzleAnimations = {
  pop: 'animate-[puzzle-pop_0.3s_ease-out]',
  shake: 'animate-[puzzle-shake_0.5s_ease-in-out]',
  connect: 'animate-[puzzle-connect_0.8s_ease-in-out]',
};

/**
 * 카테고리에 따른 전체 퍼즐 카드 스타일 반환
 */
export function getPuzzleCardStyle(category: ScheduleCategory): string {
  return `${puzzleCardBase} ${puzzleCategoryStyles[category]}`;
}

/**
 * 카테고리에 따른 배지 스타일 반환
 */
export function getPuzzleBadgeStyle(category: ScheduleCategory): string {
  return `px-3 py-1 rounded-full text-xs font-bold ${puzzleBadgeStyles[category]}`;
}

/**
 * 카테고리에 따른 텍스트 색상 반환
 */
export function getPuzzleTextColor(category: ScheduleCategory): string {
  return puzzleTextStyles[category];
}
