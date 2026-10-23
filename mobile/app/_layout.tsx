import { Stack, router } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

// Separate component so it can use the useAuth hook (which needs AuthProvider as an ancestor)
function RootNavigator() {
    const { isLoggedIn, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return; // Wait until we've checked SecureStore

        if (isLoggedIn) {
            router.replace("/(tabs)");   // Authenticated → go to dashboard
        } else {
            router.replace("/");         // Not authenticated → go to login
        }
    }, [isLoggedIn, isLoading]);

    // Show a blank loading screen while checking the stored token
    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: "#0A1628", justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0A1628" },
                animation: "fade",
            }}
        />
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="light" />
            <RootNavigator />
        </AuthProvider>
    );
}