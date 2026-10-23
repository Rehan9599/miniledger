import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { router } from "expo-router";
import { authApi } from "../services/api";

export default function LoginScreen() {
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        if (phone.length !== 10) {
            Alert.alert("Error", "Please enter a valid 10-digit phone number");
            return;
        }

        setLoading(true);
        try {
            await authApi.sendOtp(phone);
            router.push({ pathname: "/verify", params: { phone } });
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.content}>
                <Text style={styles.emoji}>🏦</Text>
                <Text style={styles.title}>MiniLedger</Text>
                <Text style={styles.subtitle}>Track money lent to friends</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.prefix}>+91</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter phone number"
                        placeholderTextColor="#6B7280"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phone}
                        onChangeText={setPhone}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSendOtp}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Sending..." : "Send OTP"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A1628" },
    content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
    emoji: { fontSize: 64, marginBottom: 16 },
    title: { fontSize: 32, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
    subtitle: { fontSize: 16, color: "#9CA3AF", marginBottom: 48 },
    inputContainer: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B",
        borderRadius: 12, paddingHorizontal: 16, marginBottom: 24,
        width: "100%", borderWidth: 1, borderColor: "#334155",
    },
    prefix: { color: "#10B981", fontSize: 16, fontWeight: "600", marginRight: 8 },
    input: { flex: 1, color: "#FFFFFF", fontSize: 18, paddingVertical: 16, letterSpacing: 2 },
    button: { backgroundColor: "#10B981", paddingVertical: 16, borderRadius: 12, width: "100%", alignItems: "center" },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});