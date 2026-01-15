import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
    return (
        <div
            className={`
        bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg 
        hover:shadow-xl hover:border-white/80 transition-all duration-300
        ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`p-4 border-b border-gray-100 ${className}`}>
        {children}
    </div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`p-4 ${className}`}>
        {children}
    </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`p-4 pt-0 ${className}`}>
        {children}
    </div>
);
