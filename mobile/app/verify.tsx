import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function VerifyScreen() {
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const { login } = useAuth();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (code.length !== 6) {
            Alert.alert("Error", "Please enter the 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.verifyOtp(phone!, code);
            await login(response.data.token);   // Saves token + navigates to dashboard
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.error || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.emoji}>🔐</Text>
                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.subtitle}>
                    Enter the 6-digit code sent to +91 {phone}
                </Text>
                <Text style={styles.hint}>
                    (Check the server console for the OTP)
                </Text>

                <TextInput
                    style={styles.otpInput}
                    placeholder="000000"
                    placeholderTextColor="#6B7280"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={code}
                    onChangeText={setCode}
                    textAlign="center"
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Verifying..." : "Verify & Login"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A1628" },
    content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
    emoji: { fontSize: 64, marginBottom: 16 },
    title: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
    subtitle: { fontSize: 16, color: "#9CA3AF", marginBottom: 4, textAlign: "center" },
    hint: { fontSize: 13, color: "#F59E0B", marginBottom: 32, fontStyle: "italic" },
    otpInput: {
        backgroundColor: "#1E293B", borderRadius: 12, paddingVertical: 16,
        paddingHorizontal: 24, color: "#FFFFFF", fontSize: 32, fontWeight: "bold",
        letterSpacing: 12, width: "100%", marginBottom: 24,
        borderWidth: 1, borderColor: "#334155",
    },
    button: { backgroundColor: "#10B981", paddingVertical: 16, borderRadius: 12, width: "100%", alignItems: "center" },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});