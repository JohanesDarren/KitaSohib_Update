
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label = "Memuat data...", className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-10 w-full min-h-[200px] ${className}`}>
      <Loader2 className="animate-spin text-primary-500 mb-4" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
        {label}
      </p>
    </div>
  );
};
