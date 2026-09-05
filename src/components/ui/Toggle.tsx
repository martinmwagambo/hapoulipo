'use client';

import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
}: ToggleProps) {
  const trackClass = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const thumbClass = size === 'sm' ? 'h-3 w-3 translate-x-1' : 'h-4 w-4 translate-x-1';
  const thumbCheckedClass = size === 'sm' ? 'translate-x-5' : 'translate-x-6';

  return (
    <label
      className={`flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`toggle-track ${trackClass} ${checked ? 'bg-primary' : 'bg-gray-300'} focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1`}
      >
        <span className={`toggle-thumb ${thumbClass} ${checked ? thumbCheckedClass : ''}`} />
      </button>
      {label && <span className="text-sm font-medium text-card-foreground">{label}</span>}
    </label>
  );
}
