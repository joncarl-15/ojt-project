import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    _id: string;
    email: string;
    username: string; // Note: Model uses userName, but client might expect username (UserList.tsx used username). 
    // Let's check existing AuthContext. 
    // Real userModel has 'userName'. 
    // AuthContext in client has 'username'. 
    // I should probably map it or check what the backend returns.
    // Backend UserController returns user object directly.
    // UserModel has userName.
    // Let's use userName to be safe, but alias if needed.
    userName: string; // Added this
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
        const storedToken = localStorage.getItem('adminAccessToken'); // Separate key for admin?
        const storedUser = localStorage.getItem('adminUser');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('adminAccessToken', newToken);
        localStorage.setItem('adminUser', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminUser');
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
