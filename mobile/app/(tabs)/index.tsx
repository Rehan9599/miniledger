import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { loanApi, summaryApi } from "../../services/api";
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
});