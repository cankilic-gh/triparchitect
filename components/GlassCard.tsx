import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", onClick, hoverEffect = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white/40 backdrop-blur-xl border border-white/50 
        shadow-lg rounded-2xl p-5 transition-all duration-300
        ${hoverEffect ? 'hover:bg-white/60 hover:shadow-xl hover:-translate-y-1 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};