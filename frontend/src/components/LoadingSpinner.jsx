import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[200px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-health-500"></div>
      <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse-slow">Loading system data...</p>
    </div>
  );
}
