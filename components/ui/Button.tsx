
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'lavender';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const sizes = {
    sm: "px-4 py-2.5 text-xs rounded-xl",
    md: "px-6 py-3.5 text-sm rounded-2xl",
    lg: "px-8 py-4 text-base rounded-2xl",
  };

  const variants = {
    // Primary: Brand Gradient (Violet to Indigo)
    primary: "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 focus:ring-primary-200 border-0",
    
    // Secondary: Clean White Surface
    secondary: "bg-white text-surface-800 hover:bg-surface-50 border border-surface-200 shadow-sm hover:shadow-md focus:ring-surface-100",
    
    // Outline: Tinted Outline
    outline: "bg-transparent border-2 border-primary-200 text-primary-600 hover:bg-primary-50 hover:border-primary-300 focus:ring-primary-100",
    
    // Ghost: Minimal
    ghost: "bg-transparent text-surface-500 hover:bg-surface-100 hover:text-surface-900",
    
    // Danger: Rose Gradient
    danger: "bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white shadow-lg shadow-accent-500/30 focus:ring-accent-200",
    
    // Lavender: Special Gradient
    lavender: "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30 focus:ring-purple-200",
  };

  const variantStyle = variants[variant] || variants.primary;

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${variantStyle} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
};
