import { COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { aiService } from '@/services/aiService';
import { Expense, expenseService } from '@/services/expenseService';
import { Link, useRouter } from 'expo-router';
import { ArrowUpRight, Plus, Search, Sparkles, TrendingDown, Wallet } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for initial design preview if Supabase is not yet connected
const MOCK_EXPENSES: Expense[] = [
  { id: '1', amount: 162, category: 'Supplies', description: 'Tray', date: '2025-03-01', created_at: '', payment_method: 'GCash' },
  { id: '2', amount: 174, category: 'Supplies', description: 'Storage Box', date: '2025-03-02', created_at: '', payment_method: 'GCash' },
];

const renderIcon = (Icon: any, size: number, color: string) => {
  const IconComp = Icon as any;
  return <IconComp size={size} color={color} />;
};

const StatCard = ({ label, value, color, icon: Icon, theme }: any) => (
  <View style={[styles.statCard, { borderColor: theme.cardBorder, backgroundColor: theme.card }]}>
    <View style={styles.statHeader}>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        {renderIcon(Icon, 16, color)}
      </View>
    </View>
    <Text style={[styles.statValue, { color: theme.text }]}>₱{value.toLocaleString()}</Text>
  </View>
);

export default function Dashboard() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = COLORS[colorScheme];
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await expenseService.getExpenses();
      setExpenses(data.length > 0 ? data : MOCK_EXPENSES);
    } catch (error) {
      console.warn("Using mock data as Supabase is not configured yet.");
      setExpenses(MOCK_EXPENSES);
    } finally {
      setLoading(false);
    }
  };

  const getAIInsight = async () => {
    setAnalyzing(true);
    try {
      const insight = await aiService.generateInsights(expenses, 50000);
      setAiInsight(insight);
    } catch (error) {
      setAiInsight("Medyo busy ang AI advisor mo. Subukan uli mamaya!");
    } finally {
      setAnalyzing(false);
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const capital = 50000;
  const remaining = capital - totalSpent;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.green} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.muted }]}>Good morning,</Text>
            <Text style={[styles.brand, { color: theme.text }]}>Ex<Text style={{ color: theme.green }}>Penz</Text></Text>
          </View>
          <TouchableOpacity style={[styles.profileButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {renderIcon(Search, 20, theme.muted)}
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.green }]}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>₱{remaining.toLocaleString()}</Text>
          <View style={styles.balanceFooter}>
            <View style={styles.balanceInfo}>
              {renderIcon(ArrowUpRight, 14, "#fff")}
              <Text style={styles.balanceInfoText}>₱{totalSpent.toLocaleString()} spent</Text>
            </View>
            <View style={styles.balanceInfo}>
              {renderIcon(TrendingDown, 14, "#fff")}
              <Text style={styles.balanceInfoText}>12% less than last month</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Expenses" value={totalSpent} color={theme.red} icon={TrendingDown} theme={theme} />
          <StatCard label="Income" value={capital} color={theme.green} icon={ArrowUpRight} theme={theme} />
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
          <Link href="/(tabs)/explore" asChild>
            <TouchableOpacity>
              <Text style={{ color: theme.accent, fontWeight: '600' }}>See all</Text>
            </TouchableOpacity>
          </Link>
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
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.green }]}
        onPress={() => router.push('/modal')}
      >
        {renderIcon(Plus, 24, "#fff")}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  }
});
