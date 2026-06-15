import React from 'react';

// Common colors based on the EdTech trivia theme
const COLORS = {
  red: '#FF4B4B',
  blue: '#4B7BFF',
  yellow: '#FFD13B',
  green: '#22C55E'
};

export function SmallShapesRow() {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      {/* Red Triangle */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L22 20H2L12 2Z" fill={COLORS.red} />
      </svg>
      {/* Blue Diamond */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L22 12L12 22L2 12L12 2Z" fill={COLORS.blue} />
      </svg>
      {/* Yellow Circle */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill={COLORS.yellow} />
      </svg>
      {/* Green Square */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="4" fill={COLORS.green} />
      </svg>
    </div>
  );
}

export function BackgroundShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">

    </div>
  );
}
