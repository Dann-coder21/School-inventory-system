export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[200px] bg-transparent">
      <div className="relative">
        {/* Gradient Ring */}
        <div className="h-16 w-16 rounded-full border-4 border-t-4 border-transparent border-t-gradient-to-r from-purple-600 to-indigo-600 animate-spin shadow-lg"></div>

        {/* Glow Effect */}
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full shadow-[0_0_15px_3px_rgba(139,92,246,0.4)]"></div>

        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-indigo-700 tracking-wide animate-pulse">
            Loading
          </span>
        </div>
      </div>
    </div>
  );
}
