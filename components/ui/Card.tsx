
import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'white' | 'glass' | 'glass-dark' | 'outline' | 'flat' | 'tinted' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean; // Adds hover lift & pointer
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'white', 
  padding = 'lg',
  interactive = false,
  onClick
}) => {
  // Base structural styles
  const baseStyles = "rounded-[2.5rem] relative overflow-hidden transition-all duration-300";
  
  // Updated variants for higher definition
  const variants = {
    // White now has a more defined shadow and border
    white: "bg-white border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_45px_rgba(0,0,0,0.08)]",
    glass: "glass-card border border-white/60 shadow-lg",
    'glass-dark': "bg-slate-900/90 backdrop-blur-xl border border-slate-700 text-white",
    outline: "bg-transparent border-2 border-primary-100 hover:border-primary-300 hover:bg-primary-50/30",
    flat: "bg-surface-50 border border-surface-200",
    tinted: "bg-primary-50/60 border border-primary-100/50 hover:bg-primary-50",
    gradient: "bg-gradient-to-br from-white to-primary-50 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
  };

  // Responsive padding
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-5 md:p-6",
    lg: "p-6 md:p-8"
  };

  // Interaction styles
  const interactionStyles = interactive 
    ? "cursor-pointer hover:-translate-y-1 active:scale-[0.98]" 
    : "";

  const Component = interactive ? motion.div : 'div';

  return (
    <Component 
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${interactionStyles} ${className}`}
      onClick={onClick}
      {...(interactive ? { layout: true } : {})}
    >
      {children}
    </Component>
  );
};
