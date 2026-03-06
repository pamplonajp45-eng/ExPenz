import { COLORS } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PayrollEntry, payrollService } from "@/services/payrollService";
import { Plus, Trash2, User, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const renderIcon = (Icon: any, size: number, color: string) => {
  const IconComp = Icon as any;
  return <IconComp size={size} color={color} />;
};

export default function PayrollScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = COLORS[colorScheme];

  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // New Entry State
  const [newName, setNewName] = useState("");
  const [week1, setWeek1] = useState("");
  const [week2, setWeek2] = useState("");

  useEffect(() => {
    if (!dataLoaded) {
      loadData();
    }
  }, [dataLoaded]);

  const loadData = async () => {
    setLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Load payroll timeout")), 6000),
      );

      const dataPromise = payrollService.getPayrollEntries();

      const data = (await Promise.race([
        dataPromise,
        timeoutPromise,
      ])) as PayrollEntry[];

      setEntries(data || []);
      setDataLoaded(true);
    } catch (error) {
      console.error(error);
      setEntries([]);
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newName || !week1 || !week2) {
      Alert.alert("Oops!", "Pakilagay naman lahat ng details perds.");
      return;
    }

    try {
      const newEntry = await payrollService.savePayrollEntry({
        employee_name: newName,
        week1: parseFloat(week1) || 0,
        week2: parseFloat(week2) || 0,
        date: new Date().toISOString().split("T")[0],
      });
      setShowAddModal(false);
      setNewName("");
      setWeek1("");
      setWeek2("");
      // Add the new entry to state instead of reloading
      setEntries([newEntry, ...entries]);
    } catch (error) {
      Alert.alert("Error", "Hindi na-save yung payroll perds.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await payrollService.deletePayrollEntry(id);
      // Remove from state instead of reloading
      setEntries(entries.filter((e) => e.id !== id));
    } catch (error) {
      Alert.alert("Error", "Hindi nabura perds.");
    }
  };

  const totalPayroll = entries.reduce((sum, e) => sum + e.week1 + e.week2, 0);

  const renderItem = ({ item }: { item: PayrollEntry }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.greenGlow }]}>
        {renderIcon(User, 20, theme.green)}
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.employeeName, { color: theme.text }]}>
          {item.employee_name}
        </Text>
        <View style={styles.weeksRow}>
          <Text style={[styles.weekLabel, { color: theme.muted }]}>
            W1:{" "}
            <Text style={{ color: theme.text }}>
              ₱{item.week1.toLocaleString()}
            </Text>
          </Text>
          <Text style={[styles.weekLabel, { color: theme.muted }]}>
            W2:{" "}
            <Text style={{ color: theme.text }}>
              ₱{item.week2.toLocaleString()}
            </Text>
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.totalAmount, { color: theme.green }]}>
          ₱{(item.week1 + item.week2).toLocaleString()}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          {renderIcon(Trash2, 16, theme.muted)}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>
            Payroll Management
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Total: ₱{totalPayroll.toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.green }]}
          onPress={() => setShowAddModal(true)}
        >
          {renderIcon(Plus, 20, "#fff")}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.green} size="large" />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ color: theme.muted }}>
                Wala ka pang empleyado perds.
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Add Employee Pay
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                {renderIcon(X, 20, theme.text)}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.background,
                    borderColor: theme.cardBorder,
                  },
                ]}
                value={newName}
                onChangeText={setNewName}
                placeholder="Employee Name"
                placeholderTextColor={theme.muted}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.muted }]}>
                  Week 1
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.background,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  value={week1}
                  onChangeText={setWeek1}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.muted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.muted }]}>
                  Week 2
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.background,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  value={week2}
                  onChangeText={setWeek2}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.muted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.green }]}
              onPress={handleAddEntry}
            >
              <Text style={styles.saveButtonText}>Save Payroll</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 16, fontWeight: "600", marginTop: 4 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: { padding: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardInfo: { flex: 1 },
  employeeName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  weeksRow: { flexDirection: "row", gap: 12 },
  weekLabel: { fontSize: 12, fontWeight: "500" },
  cardRight: { alignItems: "flex-end", gap: 8 },
  totalAmount: { fontSize: 16, fontWeight: "800" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { padding: 40, alignItems: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { borderRadius: 24, padding: 24, borderWidth: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: 12 },
  saveButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
