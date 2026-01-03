import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || props.name;

    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-600 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
            block w-full rounded-xl border-gray-200 bg-gray-50/50 shadow-sm 
            focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 
            transition-all duration-200 ease-in-out
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            placeholder:text-gray-400 text-sm
            ${icon ? 'pl-9' : 'px-3'} py-2
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/50' : 'hover:border-gray-300'}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && <p className="text-sm text-red-500 font-medium ml-1 animate-slide-up">{error}</p>}
        </div>
    );
};
