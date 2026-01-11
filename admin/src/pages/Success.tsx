import React, { useEffect, useState } from 'react';

export const Success: React.FC = () => {
    const [seconds, setSeconds] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prev) => prev - 1);
        }, 1000);

        if (seconds === 0) {
            window.location.href = 'https://ojt-monitoring-system-topaz.vercel.app/login';
        }

        return () => clearInterval(timer);
    }, [seconds]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Registration Successful</h1>
                <p className="mt-2 text-gray-600">Your admin account has been created.</p>
                <p className="mt-4 text-sm text-gray-500">Redirecting to login in {seconds} seconds...</p>
                <a
                    href="https://ojt-monitoring-system-topaz.vercel.app/login"
                    className="mt-4 inline-block text-blue-600 hover:underline"
                >
                    Click here if not redirected
                </a>
            </div>
        </div>
    );
};
