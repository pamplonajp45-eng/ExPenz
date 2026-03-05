import { COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { aiService } from '@/services/aiService';
import { Expense, expenseService } from '@/services/expenseService';
import { PayrollEntry, payrollService } from '@/services/payrollService';
import { Profile, profileService } from '@/services/profileService';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { ArrowUpRight, Download, Edit2, LogOut, Plus, Search, Sparkles, TrendingDown, Users, Wallet, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as XLSX from 'xlsx';

// Mock data for initial design preview if Supabase is not yet connected
const MOCK_EXPENSES: Expense[] = [
  { id: '1', user_id: '', amount: 162, category: 'Supplies', description: 'Tray', date: '2025-03-01', created_at: '', payment_method: 'GCash' },
  { id: '2', user_id: '', amount: 174, category: 'Supplies', description: 'Storage Box', date: '2025-03-02', created_at: '', payment_method: 'GCash' },
];

const renderIcon = (Icon: any, size: number, color: string) => {
  const IconComp = Icon as any;
  return <IconComp size={size} color={color} />;
};

const StatCard = ({ label, value, color, icon: Icon, theme, onEdit }: any) => (
  <View style={[styles.statCard, { borderColor: theme.cardBorder, backgroundColor: theme.card }]}>
    <View style={styles.statHeader}>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {onEdit && (
          <TouchableOpacity onPress={onEdit}>
            {renderIcon(Edit2, 14, theme.muted)}
          </TouchableOpacity>
        )}
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          {renderIcon(Icon, 16, color)}
        </View>
      </View>
    </View>
    <Text
      style={[styles.statValue, { color: theme.text }]}
      numberOfLines={1}
    >
      ₱{value.toLocaleString()}
    </Text>
  </View>
);

export default function Dashboard() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = COLORS[colorScheme];
  const router = useRouter();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Income Editing State
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [tempIncome, setTempIncome] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      const [expenseData, profileData, payrollData] = await Promise.all([
        expenseService.getExpenses(),
        profileService.getProfile(),
        payrollService.getPayrollEntries()
      ]);

      setExpenses(expenseData);
      setPayrollEntries(payrollData);

      if (profileData) {
        setProfile(profileData);
        setTempIncome(profileData.monthly_income.toString());
      } else {
        const newProfile = await profileService.createProfile();
        setProfile(newProfile);
        setTempIncome(newProfile.monthly_income.toString());
      }
    } catch (error: any) {
      console.error("Dashboard error:", error);
      if (error.message?.includes("authenticated")) {
        router.replace('/auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await supabase.auth.signOut();
        router.replace('/auth');
      } catch (error) {
        console.error("Logout error:", error);
        Alert.alert("Error", "Hindi maka-logout perds. Try again!");
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("Sigurado ka bang gusto mong mag-logout perds?")) {
        performLogout();
      }
      return;
    }

    Alert.alert(
      "Logout",
      "Sigurado ka bang gusto mong mag-logout perds?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: performLogout
        }
      ]
    );
  };

  const saveIncome = async () => {
    const val = Number(tempIncome);
    if (!isNaN(val) && val >= 0) {
      try {
        const updated = await profileService.updateIncome(val);
        setProfile(updated);
        setShowIncomeModal(false);
      } catch (e) {
        Alert.alert("Error", "Hindi na-save ang budget.");
      }
    } else {
      Alert.alert("Invalid Amount", "Pakilagay naman ng tamang numero perds.");
    }
  };

  const totalSpent = expenses.filter(e => e.category !== 'Payroll').reduce((sum, e) => sum + e.amount, 0);
  const totalPayroll = payrollEntries.reduce((sum, e) => sum + e.week1 + e.week2, 0);
  const capital = profile?.monthly_income || 50000;
  const remaining = capital - totalSpent - totalPayroll;
  const totalProfit = remaining;

  const getAIInsight = async () => {
    setAnalyzing(true);
    try {
      const insight = await aiService.generateInsights(expenses, capital);
      setAiInsight(insight);
    } catch (error) {
      setAiInsight("Medyo busy ang AI advisor mo. Subukan uli mamaya!");
    } finally {
      setAnalyzing(false);
    }
  };

  const exportToExcel = async () => {
    try {
      if (expenses.length === 0) {
        Alert.alert("Walang Laman", "Wala ka pang expenses na pwede i-export perds.");
        return;
      }

      // 1. Prepare Data for a Professional Report
      // Header and Summary Section
      const reportHeader = [
        ["ExPenz Financial Report"],
        [`Target Date: ${new Date().toLocaleDateString()}`],
        [""],
        ["Financial Summary"],
        ["Total Monthly Income:", null, `₱${capital.toLocaleString()}`],
        ["Total Expenses:", null, `₱${totalSpent.toLocaleString()}`],
        ["Total Payroll:", null, `₱${totalPayroll.toLocaleString()}`],
        ["Total Profit:", null, `₱${totalProfit.toLocaleString()}`],
        [""],
        ["Payroll Details"],
        ["Name", "Week 1", "Week 2", "Total"],
        ...payrollEntries.map(p => [p.employee_name, p.week1, p.week2, p.week1 + p.week2]),
        [""],
        ["Expense Details"]
      ];

      const tableHeader = [
        "Date", "Description", "Category", "Amount", "Payment Method"
      ];

      const transactionData = expenses.filter(e => e.category !== 'Payroll').map(e => [
        e.date,
        e.description || e.category,
        e.category,
        e.amount,
        e.payment_method || "N/A"
      ]);

      // Combine all data
      const finalData = [...reportHeader, tableHeader, ...transactionData];

      // 2. Create Workbook and Worksheet
      const ws = XLSX.utils.aoa_to_sheet(finalData);

      // Add basic formatting (merging title cells)
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }  // Date
      ];

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Date
        { wch: 30 }, // Description
        { wch: 15 }, // Category
        { wch: 12 }, // Amount
        { wch: 15 }, // Payment Method
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ulat ng Gastos");

      // 3. Generate filename
      const fileName = `ExPenz_Report_${new Date().getTime()}.xlsx`;

      // 4. Handle Platform Specific Export
      if (Platform.OS === 'web') {
        // For Web: XLSX.writeFile handles the download automatically in the browser
        XLSX.writeFile(wb, fileName);
      } else {
        // For Native (iOS/Android): Use Expo FileSystem and Sharing
        // Dynamically require to avoid bundling issues on Web
        const FileSystem = require('expo-file-system/legacy');
        const Sharing = require('expo-sharing');

        if (!FileSystem.documentDirectory) {
          Alert.alert("Error", "Hindi ma-access ang filesystem ng device mo.");
          return;
        }

        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const uri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(uri, wbout, {
          encoding: 'base64'
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert("Ops!", "Hindi available ang sharing sa device na ito perds.");
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Hindi natuloy ang page-export ng report.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.green} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: theme.muted }]}>
                Kamusta, {profile?.full_name?.split(' ')[0] || 'ka-ExPenz'}!
              </Text>
              <Text style={[styles.brand, { color: theme.text }]}>Ex<Text style={{ color: theme.green }}>Penz</Text></Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.profileButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                {renderIcon(Search, 20, theme.muted)}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.profileButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={handleLogout}
              >
                {renderIcon(LogOut, 20, theme.red)}
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance Card */}
          <View style={[styles.balanceCard, { backgroundColor: theme.green }]}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text
              style={styles.balanceValue}
              numberOfLines={1}
            >
              ₱{remaining.toLocaleString()}
            </Text>
            <View style={styles.balanceFooter}>
              <View style={styles.balanceInfo}>
                {renderIcon(ArrowUpRight, 14, "#fff")}
                <Text style={styles.balanceInfoText}>₱{totalSpent.toLocaleString()} spent</Text>
              </View>
              <View style={styles.balanceInfo}>
                {renderIcon(TrendingDown, 14, "#fff")}
                <Text style={styles.balanceInfoText}>Budget: ₱{capital.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Stats Rows */}
          <View style={styles.statsRow}>
            <StatCard label="Expenses" value={totalSpent} color={theme.red} icon={TrendingDown} theme={theme} />
            <StatCard label="Payroll" value={totalPayroll} color={theme.red} icon={Users} theme={theme} />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Profit" value={totalProfit} color={theme.green} icon={Wallet} theme={theme} />
            <StatCard
              label="Income"
              value={capital}
              color={theme.green}
              icon={ArrowUpRight}
              theme={theme}
              onEdit={() => setShowIncomeModal(true)}
            />
          </View>

          {/* AI Insight Section */}
          <View style={[styles.aiSection, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.aiHeader}>
              <View style={styles.aiTitleRow}>
                {renderIcon(Sparkles, 18, theme.green)}
                <Text style={[styles.aiTitle, { color: theme.text }]}>AI Financial Advisor</Text>
              </View>
              {aiInsight && (
                <TouchableOpacity onPress={() => setAiInsight(null)}>
                  <Text style={{ color: theme.muted, fontSize: 12 }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {!aiInsight ? (
              <View style={styles.aiEmpty}>
                <Text style={[styles.aiEmptyText, { color: theme.muted }]}>
                  Analyze your spending patterns with AI.
                </Text>
                <TouchableOpacity
                  style={[styles.aiButton, { backgroundColor: theme.green }]}
                  onPress={getAIInsight}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      {renderIcon(Sparkles, 16, "#fff")}
                      <Text style={styles.aiButtonText}>Generate insights</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.insightBox, { backgroundColor: theme.greenGlow }]}>
                <Text style={[styles.insightText, { color: theme.text }]}>{aiInsight}</Text>
              </View>
            )}
          </View>

          {/* Recent Transactions */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <TouchableOpacity onPress={exportToExcel} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {renderIcon(Download, 16, theme.green)}
                <Text style={{ color: theme.green, fontWeight: '600', fontSize: 13 }}>Export</Text>
              </TouchableOpacity>
              <Link href="/(tabs)/explore" asChild>
                <TouchableOpacity>
                  <Text style={{ color: theme.accent, fontWeight: '600' }}>See all</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ color: theme.muted }}>No expenses yet. Start tracking now!</Text>
            </View>
          ) : (
            expenses.slice(0, 3).map((item) => (
              <View key={item.id} style={[styles.transactionItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={[styles.categoryIcon, { backgroundColor: theme.greenGlow }]}>
                  {renderIcon(Wallet, 18, theme.green)}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={[styles.transactionName, { color: theme.text }]}>{item.description || item.category}</Text>
                  <Text style={[styles.transactionDate, { color: theme.muted }]}>{item.date}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: theme.red }]}>-₱{item.amount.toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.green }]}
        onPress={() => router.push('/modal')}
      >
        {renderIcon(Plus, 24, "#fff")}
      </TouchableOpacity>

      {/* Income Modal */}
      <Modal
        visible={showIncomeModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Iset ang Income</Text>
              <TouchableOpacity onPress={() => setShowIncomeModal(false)}>
                {renderIcon(X, 20, theme.text)}
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
              Magkano ang monthly income mo perds?
            </Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.cardBorder }]}
              value={tempIncome}
              onChangeText={setTempIncome}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.muted}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.green }]}
              onPress={saveIncome}
            >
              <Text style={styles.modalButtonText}>Save Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  mainWrapper: {
    padding: 20,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  balanceFooter: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceInfoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  aiSection: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aiEmpty: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  aiEmptyText: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  insightBox: {
    padding: 16,
    borderRadius: 16,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalInput: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
  },
  modalButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});
