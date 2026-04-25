import React from 'react';

/**
 * URL 패턴을 감지하는 정규식
 * http://, https://, www. 로 시작하는 URL을 감지
 */
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

/**
 * 텍스트 내의 URL을 자동으로 링크로 변환
 */
export function linkify(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // 정규식으로 URL 찾기
  const regex = new RegExp(URL_REGEX);

  while ((match = regex.exec(text)) !== null) {
    const url = match[0];
    const index = match.index;

    // URL 이전의 일반 텍스트 추가
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    // URL을 링크로 변환
    const href = url.startsWith('http') ? url : `https://${url}`;
    parts.push(
      <a
        key={index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline break-all"
        onClick={(e) => e.stopPropagation()} // 부모 요소 클릭 이벤트 차단
      >
        {url}
      </a>
    );

    lastIndex = regex.lastIndex;
  }

  // 마지막 URL 이후의 텍스트 추가
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Linkify 컴포넌트 - 텍스트를 받아서 링크가 포함된 React 요소 반환
 */
interface LinkifyProps {
  children: string;
  className?: string;
}

export function Linkify({ children, className = '' }: LinkifyProps) {
  return <span className={className}>{linkify(children)}</span>;
}
