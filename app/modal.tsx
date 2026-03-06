import { COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { expenseService } from '@/services/expenseService';
import { useRouter } from 'expo-router';
import { Home, ShoppingBag, Train, Users, Utensils, X, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
  { label: 'Food', icon: Utensils, color: '#F87171' },
  { label: 'Transport', icon: Train, color: '#38BDF8' },
  { label: 'Shopping', icon: ShoppingBag, color: '#A78BFA' },
  { label: 'Bills', icon: Zap, color: '#FACC15' },
  { label: 'Rent', icon: Home, color: '#FB923C' },
  { label: 'Supplies', icon: Users, color: '#10B981' },
];

const METHODS = ['Cash', 'GCash', 'SPayLater', 'Bank Transfer'];

const renderIcon = (Icon: any, size: number, color: string) => {
  const IconComp = Icon as any;
  return <IconComp size={size} color={color} />;
};

export default function AddExpenseModal() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = COLORS[colorScheme];

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [method, setMethod] = useState('GCash');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert("Oops!", "Pakilagay naman ng valid na amount.");
      return;
    }

    setLoading(true);
    try {
      await expenseService.addExpense({
        amount: Number(amount),
        description,
        category,
        date: new Date().toISOString().split('T')[0],
        payment_method: method,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hindi na-save yung expense. Subukan uli?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          {renderIcon(X, 24, theme.text)}
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Add Expense</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainWrapper}>
          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text style={[styles.currency, { color: theme.green }]}>₱</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              placeholder="0"
              placeholderTextColor={theme.muted}
              keyboardType="numeric"
              autoFocus
              value={amount}
              onChangeText={setAmount}
              numberOfLines={1}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.muted }]}>What&apos;s this for?</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              placeholder="e.g. Lunch with friends"
              placeholderTextColor={theme.muted}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Category Picker */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.muted }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.label;
                const catColor = cat.color;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[
                      styles.categoryItem,
                      { backgroundColor: theme.card, borderColor: isSelected ? theme.green : theme.cardBorder }
                    ]}
                    onPress={() => setCategory(cat.label)}
                  >
                    <View style={[styles.catIconContainer, { backgroundColor: catColor + '20' }]}>
                      {renderIcon(Icon, 20, catColor)}
                    </View>
                    <Text style={[styles.catLabel, { color: isSelected ? theme.text : theme.muted, fontWeight: isSelected ? '700' : '500' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.muted }]}>Payment Method</Text>
            <View style={styles.methodList}>
              {METHODS.map((m) => {
                const isSelected = method === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.methodBadge,
                      { backgroundColor: isSelected ? theme.green : theme.card, borderColor: isSelected ? theme.green : theme.cardBorder }
                    ]}
                    onPress={() => setMethod(m)}
                  >
                    <Text style={[styles.methodText, { color: isSelected ? '#fff' : theme.muted }]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.green }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Expense</Text>
          )}
        </TouchableOpacity>
      </View>
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
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  mainWrapper: {
    padding: 20,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  currency: {
    fontSize: 32,
    fontWeight: '800',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 64,
    fontWeight: '800',
    minWidth: 100,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  catIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  catLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  methodList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  methodBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
