import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { loanApi, summaryApi, SERVER_BASE } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface Loan {
  id: string;
  friendName: string;
  amount: number;
  dueDate: string;
  isRepaid: boolean;
  isOverdue: boolean;
  receiptUrl?: string;
}

interface Summary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  activeLoans: number;
  overdueLoans: number;
}

export default function DashboardScreen() {
  const { logout } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [loansRes, summaryRes] = await Promise.all([
        loanApi.getAll(),
        summaryApi.get(),
      ]);
      setLoans(loansRes.data.loans);
      setSummary(summaryRes.data.summary);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, []);

  // Refresh data every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleRepay = (loan: Loan) => {
    Alert.alert(
      "Mark as Repaid",
      `Did ${loan.friendName} return Rs.${loan.amount}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Repaid",
          onPress: async () => {
            try {
              await loanApi.markRepaid(loan.id);
              fetchData();      // Refresh the list after marking repaid
            } catch (error) {
              Alert.alert("Error", "Failed to mark as repaid");
            }
          },
        },
      ]
    );
  };

  const showReceiptOptions = (loan: Loan) => {
    Alert.alert("Attach Receipt", "Choose a source", [
      {
        text: "📷 Take Photo",
        onPress: () => handleUploadReceipt(loan, "camera"),
      },
      {
        text: "🖼️ Choose from Gallery",
        onPress: () => handleUploadReceipt(loan, "gallery"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleUploadReceipt = async (
    loan: Loan,
    source: "camera" | "gallery"
  ) => {
    try {
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Needed",
            "Camera access is required to take a receipt photo."
          );
          return;
        }
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Needed",
            "Gallery access is required to select a receipt photo."
          );
          return;
        }
      }

      const pickerFn =
        source === "camera"
          ? ImagePicker.launchCameraAsync
          : ImagePicker.launchImageLibraryAsync;

      const result = await pickerFn({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploadingId(loan.id);
      await loanApi.uploadReceipt(loan.id, result.assets[0].uri);
      await fetchData();
      Alert.alert("Success", "Receipt uploaded successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to upload receipt. Please try again.");
      console.error("Receipt upload error:", error);
    } finally {
      setUploadingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderSummaryCard = () => {
    if (!summary) return null;
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your Ledger Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Lent</Text>
            <Text style={styles.summaryValueLent}>
              Rs.{summary.totalLent.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Repaid</Text>
            <Text style={styles.summaryValueRepaid}>
              Rs.{summary.totalRepaid.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Overdue</Text>
            <Text style={styles.summaryValueOverdue}>
              Rs.{summary.overdueAmount.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLoanItem = ({ item }: { item: Loan }) => (
    <View
      style={[
        styles.loanCard,
        item.isOverdue && styles.loanCardOverdue,
        item.isRepaid && styles.loanCardRepaid,
      ]}
    >
      <View style={styles.loanHeader}>
        <Text style={styles.friendName}>{item.friendName}</Text>
        {item.isOverdue && (
          <View style={styles.overdueBadge}>
            <Text style={styles.overdueBadgeText}>OVERDUE</Text>
          </View>
        )}
        {item.isRepaid && (
          <View style={styles.repaidBadge}>
            <Text style={styles.repaidBadgeText}>REPAID</Text>
          </View>
        )}
      </View>

      <Text style={styles.amount}>Rs.{item.amount.toLocaleString()}</Text>
      <Text style={styles.dueDate}>
        {item.isRepaid ? "Settled" : `Due: ${formatDate(item.dueDate)}`}
      </Text>

      {!item.isRepaid && (
        <TouchableOpacity
          style={styles.repayButton}
          onPress={() => handleRepay(item)}
        >
          <Text style={styles.repayButtonText}>Mark as Repaid</Text>
        </TouchableOpacity>
      )}

      {/* Receipt Section */}
      {uploadingId === item.id ? (
        <View style={styles.receiptLoading}>
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text style={styles.receiptLoadingText}>Uploading receipt…</Text>
        </View>
      ) : item.receiptUrl ? (
        <TouchableOpacity
          style={styles.receiptPreview}
          onPress={() =>
            setViewingReceipt(`${SERVER_BASE}${item.receiptUrl}`)
          }
        >
          <Image
            source={{ uri: `${SERVER_BASE}${item.receiptUrl}` }}
            style={styles.receiptThumbnail}
          />
          <Text style={styles.receiptAttachedText}>
            📎 Receipt attached · Tap to view
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => showReceiptOptions(item)}
        >
          <Text style={styles.uploadButtonText}>📷 Attach Receipt</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>💸</Text>
      <Text style={styles.emptyText}>No loans yet</Text>
      <Text style={styles.emptySubtext}>
        Your wallet is happy! Add a loan to start tracking.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MiniLedger</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        renderItem={renderLoanItem}
        ListHeaderComponent={renderSummaryCard}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      />

      {/* Receipt Viewing Modal */}
      <Modal
        visible={viewingReceipt !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {viewingReceipt && (
              <Image
                source={{ uri: viewingReceipt }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setViewingReceipt(null)}
            >
              <Text style={styles.modalCloseText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF" },
  logoutText: { color: "#EF4444", fontSize: 16, fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  // Summary Card
  summaryCard: {
    backgroundColor: "#1E293B", borderRadius: 16, padding: 20,
    marginBottom: 20, borderWidth: 1, borderColor: "#334155",
  },
  summaryTitle: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF", marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryLabel: { fontSize: 12, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 },
  summaryValueLent: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
  summaryValueRepaid: { fontSize: 20, fontWeight: "bold", color: "#10B981" },
  summaryValueOverdue: { fontSize: 20, fontWeight: "bold", color: "#EF4444" },
  // Loan Cards
  loanCard: {
    backgroundColor: "#1E293B", borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "#334155",
  },
  loanCardOverdue: { borderColor: "#EF4444", borderWidth: 2 },
  loanCardRepaid: { opacity: 0.7, borderColor: "#10B981" },
  loanHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  friendName: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  overdueBadge: { backgroundColor: "#EF444420", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  overdueBadgeText: { color: "#EF4444", fontSize: 11, fontWeight: "bold", letterSpacing: 1 },
  repaidBadge: { backgroundColor: "#10B98120", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  repaidBadgeText: { color: "#10B981", fontSize: 11, fontWeight: "bold" },
  amount: { fontSize: 24, fontWeight: "bold", color: "#F59E0B", marginBottom: 4 },
  dueDate: { fontSize: 14, color: "#9CA3AF", marginBottom: 12 },
  repayButton: {
    backgroundColor: "#10B98120", paddingVertical: 10, borderRadius: 8,
    alignItems: "center", borderWidth: 1, borderColor: "#10B981",
  },
  repayButtonText: { color: "#10B981", fontWeight: "bold" },
  // Empty State
  emptyContainer: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
  // Receipt styles
  receiptLoading: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, marginTop: 10, backgroundColor: "#8B5CF610",
    borderRadius: 8, borderWidth: 1, borderColor: "#8B5CF640",
  },
  receiptLoadingText: { color: "#8B5CF6", marginLeft: 8, fontSize: 14, fontWeight: "600" },
  receiptPreview: {
    flexDirection: "row", alignItems: "center", marginTop: 10,
    backgroundColor: "#8B5CF610", borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: "#8B5CF640",
  },
  receiptThumbnail: { width: 48, height: 48, borderRadius: 6, backgroundColor: "#334155" },
  receiptAttachedText: { color: "#C4B5FD", fontSize: 13, fontWeight: "600", marginLeft: 12, flex: 1 },
  uploadButton: {
    paddingVertical: 10, borderRadius: 8, alignItems: "center", marginTop: 10,
    backgroundColor: "#8B5CF610", borderWidth: 1, borderColor: "#8B5CF640",
  },
  uploadButtonText: { color: "#8B5CF6", fontWeight: "bold", fontSize: 14 },
  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center", alignItems: "center",
  },
  modalContent: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center", padding: 20 },
  modalImage: { width: "100%", height: "80%", borderRadius: 12 },
  modalCloseButton: {
    marginTop: 20, backgroundColor: "#1E293B", paddingHorizontal: 32,
    paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#334155",
  },
  modalCloseText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});