
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ElementType;
  onClick?: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  icon: Icon,
  onClick
}) => {
  const baseStyles = "inline-flex items-center gap-1.5 font-black uppercase tracking-widest rounded-xl border";
  
  const sizes = {
    sm: "px-2 py-0.5 text-[8px]",
    md: "px-3 py-1.5 text-[10px]"
  };

  const variants = {
    primary: "bg-primary-50 text-primary-600 border-primary-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    danger: "bg-red-50 text-red-600 border-red-100",
    neutral: "bg-slate-100 text-slate-500 border-slate-200",
    outline: "bg-transparent text-slate-400 border-slate-200"
  };

  return (
    <span 
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {Icon && <Icon size={size === 'sm' ? 10 : 12} />}
      {children}
    </span>
  );
};
