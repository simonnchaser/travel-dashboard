'use client';

import { useEffect, useRef } from 'react';

interface AutoExpandTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
}

export default function AutoExpandTextarea({
  value,
  onChange,
  placeholder = '',
  className = '',
  minRows = 3,
  maxRows = 10,
  disabled = false,
}: AutoExpandTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize function
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height based on content
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;

    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;

    // Enable scrolling if content exceeds maxRows
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  };

  // Adjust height on value change
  useEffect(() => {
    adjustHeight();
  }, [value]);

  // Adjust height on mount
  useEffect(() => {
    adjustHeight();
    // Also adjust on window resize
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    // Adjust height immediately after change
    setTimeout(adjustHeight, 0);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      style={{
        resize: 'none',
        transition: 'height 0.1s ease',
      }}
    />
  );
}
