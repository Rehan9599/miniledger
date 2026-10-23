import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing token on app startup
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = await SecureStore.getItemAsync("token");
        setIsLoggedIn(!!token);    // !! converts to boolean: "abc" -> true, null -> false
        setIsLoading(false);
    };

    const login = async (token: string) => {
        await SecureStore.setItemAsync("token", token);
        setIsLoggedIn(true);
        router.replace("/(tabs)");    // Navigate to dashboard, replace history so back button won't go to login
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync("token");
        setIsLoggedIn(false);
        router.replace("/");          // Navigate to login screen
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);