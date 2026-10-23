import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "#1E293B",
                    borderTopColor: "#334155",
                    height: 60,
                    paddingBottom: 8,
                },
                tabBarActiveTintColor: "#10B981",
                tabBarInactiveTintColor: "#6B7280",
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Dashboard",
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>📊</Text>,
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: "Add Loan",
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>➕</Text>,
                }}
            />
        </Tabs>
    );
}