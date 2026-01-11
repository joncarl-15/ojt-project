
import React from 'react';

export const Success: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Registration Successful</h1>
                <p className="mt-2 text-gray-600">Your admin account has been created.</p>
            </div>
        </div>
    );
};
