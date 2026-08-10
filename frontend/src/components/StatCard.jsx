import React from 'react';

export default function StatCard({ title, value, icon, description, trend, colorClass }) {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 card-shadow card-hover flex flex-col justify-between transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl ${colorClass || 'bg-health-50 dark:bg-health-950/20 text-health-500'}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</h3>
        {description && (
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            {trend && <span className="font-semibold text-emerald-600 dark:text-emerald-400">{trend}</span>}
            <span>{description}</span>
          </p>
        )}
      </div>
    </div>
  );
}
