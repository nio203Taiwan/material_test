import React from 'https://esm.sh/react@18.3.1';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyle = "px-6 py-3 font-mono font-bold tracking-tighter uppercase transition-all duration-200 flex items-center justify-center gap-2 border-b-4 active:border-b-0 active:translate-y-1 disabled:opacity-30 disabled:translate-y-0 disabled:border-b-4";
  
  const variants = {
    primary: "bg-[#c2410c] border-amber-900 text-white hover:bg-amber-600 shadow-[0_5px_15px_rgba(217,119,6,0.3)]",
    secondary: "bg-slate-700 border-slate-900 text-slate-200 hover:bg-slate-600",
    ghost: "bg-transparent border-transparent text-slate-400 hover:text-cyan-400 hover:border-cyan-900 border-b-0"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          <span>Syncing...</span>
        </div>
      ) : children}
    </button>
  );
};