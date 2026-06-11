export const CornerShapes = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Colossal Red Triangle Top-Left */}
      <svg
        className="absolute -top-[20%] -left-[10%] w-[60vw] max-w-[800px] h-auto opacity-10 text-red-500 transform -rotate-12"
        viewBox="0 0 100 100"
        fill="currentColor"
        preserveAspectRatio="xMidYMid meet"
      >
        <polygon points="50,10 100,90 0,90" />
      </svg>

      {/* Massive Blue Diamond Bottom-Right */}
      <svg
        className="absolute -bottom-[20%] -right-[10%] w-[60vw] max-w-[800px] h-auto opacity-10 text-blue-500 transform rotate-12"
        viewBox="0 0 100 100"
        fill="currentColor"
        preserveAspectRatio="xMidYMid meet"
      >
        <polygon points="50,0 100,50 50,100 0,50" />
      </svg>
    </div>
  );
};
