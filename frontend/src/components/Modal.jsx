import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  type = 'info', // 'info' | 'success' | 'warning' | 'danger' | 'confirm'
  size = 'md' // 'sm' | 'md' | 'lg' | 'xl'
}) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Icon and color mapping based on type
  const typeConfigs = {
    info: {
      icon: <Info className="text-blue-500" size={24} />,
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-100 dark:border-blue-900/50'
    },
    success: {
      icon: <CheckCircle className="text-emerald-500" size={24} />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-100 dark:border-emerald-900/50'
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500" size={24} />,
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-100 dark:border-amber-900/50'
    },
    danger: {
      icon: <AlertCircle className="text-red-500" size={24} />,
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-100 dark:border-red-900/50'
    },
    confirm: {
      icon: <Info className="text-health-500" size={24} />,
      bg: 'bg-health-50 dark:bg-health-950/30',
      border: 'border-health-100 dark:border-health-900/50'
    }
  };

  const config = typeConfigs[type] || typeConfigs.info;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md} bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-black/40 border border-slate-100 dark:border-slate-700/80 overflow-hidden transform transition-all duration-300 scale-100 flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${config.bg} border ${config.border}`}>
              {config.icon}
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">
              {title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
