import { COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Expense, expenseService } from '@/services/expenseService';
import { Calendar, Search, Trash2, Wallet } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CAT_COLORS: Record<string, string> = {
  'Food': '#F87171',
  'Transport': '#38BDF8',
  'Shopping': '#A78BFA',
  'Bills': '#FACC15',
  'Rent': '#FB923C',
  'Supplies': '#10B981',
};

const renderIcon = (Icon: any, size: number, color: string) => {
  const IconComp = Icon as any;
  return <IconComp size={size} color={color} />;
};

export default function ExpenseHistory() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = COLORS[colorScheme];

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchQuery, selectedCategory, expenses]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await expenseService.getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = expenses;
    if (searchQuery) {
      filtered = filtered.filter(e =>
        (e.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }
    setFilteredExpenses(filtered);
  };

  const handleDelete = async (id: string) => {
    try {
      await expenseService.deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }: { item: Expense }) => {
    const catColor = CAT_COLORS[item.category] || theme.green;
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={[styles.iconBox, { backgroundColor: catColor + '15' }]}>
          {renderIcon(Wallet, 20, catColor)}
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.description, { color: theme.text }]}>{item.description || item.category}</Text>
          <View style={styles.cardFooter}>
            <Text style={[styles.date, { color: theme.muted }]}>{item.date}</Text>
            <View style={[styles.badge, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
              <Text style={[styles.badgeText, { color: theme.muted }]}>{item.payment_method}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.amount, { color: theme.red }]}>-₱{item.amount.toLocaleString()}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            {renderIcon(Trash2, 16, theme.muted)}
          </TouchableOpacity>
        </View>
      </View>
    );
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Expense History</Text>
        <TouchableOpacity onPress={loadData}>
          {renderIcon(Calendar, 20, theme.muted)}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchWrapper, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {renderIcon(Search, 20, theme.muted)}
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search expenses..."
            placeholderTextColor={theme.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: selectedCategory === null ? theme.green : theme.card, borderColor: selectedCategory === null ? theme.green : theme.cardBorder }
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.filterText, { color: selectedCategory === null ? '#fff' : theme.muted }]}>All</Text>
          </TouchableOpacity>
          {Object.keys(CAT_COLORS).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                { backgroundColor: selectedCategory === cat ? theme.green : theme.card, borderColor: selectedCategory === cat ? theme.green : theme.cardBorder }
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterText, { color: selectedCategory === cat ? '#fff' : theme.muted }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ color: theme.muted }}>Hindi ka yata nagastos perds?</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  }
});
