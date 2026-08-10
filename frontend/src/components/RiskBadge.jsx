import React from 'react';

export default function RiskBadge({ riskLevel }) {
  const normalized = riskLevel?.toLowerCase().trim();
  
  if (normalized === 'high risk') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 mr-1.5 bg-red-500 rounded-full animate-pulse"></span>
        High Risk
      </span>
    );
  } else if (normalized === 'mid risk' || normalized === 'medium risk') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 mr-1.5 bg-amber-500 rounded-full"></span>
        Mid Risk
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full"></span>
        Low Risk
      </span>
    );
  }
}
