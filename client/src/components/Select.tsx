import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    error?: string;
    placeholder?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    id?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    value,
    onChange,
    options,
    error,
    placeholder = 'Select an option',
    className = '',
    required = false,
    disabled = false,
    id,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`space-y-1.5 ${className}`} ref={containerRef}>
            {label && (
                <label
                    htmlFor={id}
                    className={`block text-sm font-semibold ml-1 ${error ? 'text-red-500' : 'text-gray-700'
                        }`}
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                        w-full flex items-center justify-between
                        rounded-xl border bg-white shadow-sm
                        pl-3 pr-2 py-2 text-left text-sm
                        transition-all duration-200 ease-in-out
                        ${error
                            ? 'border-red-300 focus:ring-4 focus:ring-red-500/10 focus:border-red-500'
                            : 'border-gray-200 hover:border-gray-300 focus:ring-4 focus:ring-green-500/10 focus:border-green-500'
                        }
                        ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <span className="pointer-events-none flex items-center justify-center text-gray-400">
                        <ChevronDown
                            size={18}
                            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </span>
                </button>

                {isOpen && !disabled && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white border border-gray-100 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-100">
                        {options.length === 0 ? (
                            <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-400 italic text-center">
                                No options available
                            </div>
                        ) : (
                            options.map((option) => (
                                <div
                                    key={option.value}
                                    className={`
                                        relative cursor-pointer select-none py-2.5 pl-4 pr-9 
                                        transition-colors duration-150
                                        ${option.value === value
                                            ? 'bg-green-50 text-green-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                    onClick={() => handleSelect(option.value)}
                                >
                                    <span className="block truncate">
                                        {option.label}
                                    </span>
                                    {option.value === value && (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-green-600">
                                            <Check size={16} />
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-500 font-medium ml-1 animate-slide-up">
                    {error}
                </p>
            )}
        </div>
    );
};
