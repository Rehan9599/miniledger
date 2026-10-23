import axios from "axios";
import * as SecureStore from "expo-secure-store";

// IMPORTANT: Change this to your computer's local IP address!
// Find it by running: ipconfig (in PowerShell)
// Look for "IPv4 Address" under your WiFi adapter (e.g., 192.168.1.42)
// Expo Go on your phone connects over WiFi, so "localhost" won't work!
const API_BASE = "http://10.253.10.186:3000/api";

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
});

// Interceptor — automatically attach JWT token to every request
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API calls
export const authApi = {
    sendOtp: (phone: string) => api.post("/auth/send-otp", { phone }),
    verifyOtp: (phone: string, code: string) =>
        api.post("/auth/verify-otp", { phone, code }),
};

// Loan API calls
export const loanApi = {
    getAll: () => api.get("/loans"),
    create: (data: { friendName: string; amount: number; dueDate: string }) =>
        api.post("/loans", data),
    markRepaid: (id: string) => api.patch(`/loans/${id}/repay`),
    uploadReceipt: (id: string, uri: string) => {
        const formData = new FormData();
        formData.append("receipt", {
            uri,
            name: "receipt.jpg",
            type: "image/jpeg",
        } as any);
        return api.post(`/loans/${id}/receipt`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};

// Summary API call
export const summaryApi = {
    get: () => api.get("/summary"),
};

export default api;