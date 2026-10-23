import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
} from "react-native";
import { router } from "expo-router";
import { loanApi } from "../../services/api";

export default function AddLoanScreen() {
    const [friendName, setFriendName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // Client-side validation
        if (!friendName.trim()) {
            Alert.alert("Error", "Please enter your friend's name");
            return;
        }
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            Alert.alert("Error", "Please enter a valid amount");
            return;
        }
        if (!dueDate || isNaN(Date.parse(dueDate))) {
            Alert.alert("Error", "Please enter a valid date (YYYY-MM-DD)");
            return;
        }
        if (new Date(dueDate) <= new Date()) {
            Alert.alert("Error", "Due date must be in the future");
            return;
        }

        setLoading(true);
        try {
            await loanApi.create({
                friendName: friendName.trim(),
                amount: Number(amount),
                dueDate,
            });
            Alert.alert("Success", `Loan of Rs.${amount} to ${friendName} recorded!`, [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (error: any) {
            Alert.alert(
                "Error",
                error.response?.data?.error || "Failed to create loan"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>New Loan Entry</Text>
                <Text style={styles.subtitle}>Record money lent to a friend</Text>

                <Text style={styles.label}>Friend's Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Rahul"
                    placeholderTextColor="#6B7280"
                    value={friendName}
                    onChangeText={setFriendName}
                />

                <Text style={styles.label}>Amount (Rs.)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 5000"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                />

                <Text style={styles.label}>Due Date</Text>
                <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD (e.g., 2027-12-31)"
                    placeholderTextColor="#6B7280"
                    value={dueDate}
                    onChangeText={setDueDate}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Creating..." : "Add Loan Entry"}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A1628" },
    content: { padding: 20, paddingTop: 56 },
    title: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
    subtitle: { fontSize: 16, color: "#9CA3AF", marginBottom: 32 },
    label: { fontSize: 14, fontWeight: "600", color: "#D1D5DB", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
    input: {
        backgroundColor: "#1E293B", borderRadius: 12, padding: 16,
        color: "#FFFFFF", fontSize: 16, marginBottom: 20,
        borderWidth: 1, borderColor: "#334155",
    },
    button: { backgroundColor: "#10B981", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 12 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});