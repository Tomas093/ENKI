import React from "react";

export function GeometricBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#F4F6FA]">
      {/* Colossal Red Triangle Top-Left */}
      <svg
        className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 opacity-[0.05]"
        width="800"
        height="800"
        viewBox="0 0 100 100"
        fill="#EF4444"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon points="0,0 100,0 0,100" />
      </svg>

      {/* Massive Blue Diamond Bottom-Right */}
      <svg
        className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-[0.05]"
        width="900"
        height="900"
        viewBox="0 0 100 100"
        fill="#3B82F6"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon points="50,0 100,50 50,100 0,50" />
      </svg>
    </div>
  );
}
