import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    _id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
    program?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage on mount
        const storedToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        // Reset session seen flag so tutorial can show again for this new login session
        sessionStorage.removeItem(`ojt_tutorial_session_seen_${newUser._id}`);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        // Reset session seen flag on logout as well
        if (user) {
            sessionStorage.removeItem(`ojt_tutorial_session_seen_${user._id}`);
        }
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
