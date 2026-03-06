import { COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { Utang, utangService } from '@/services/utangService';
import { useRouter } from 'expo-router';
import { Check, HandCoins, NotebookTabs, Plus, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UtangScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = COLORS[colorScheme];

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [utangs, setUtangs] = useState<Utang[]>([]);

    // Modals
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);

    // Add Form State
    const [newType, setNewType] = useState<'lent' | 'borrowed'>('lent');
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newReason, setNewReason] = useState('');
    const [newDueDate, setNewDueDate] = useState('');

    // Payment Form State
    const [selectedUtang, setSelectedUtang] = useState<Utang | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/auth');
            } else {
                fetchData();
            }
        };
        checkAuth();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await utangService.getUtangs();
            setUtangs(data);
        } catch (error) {
            console.error('Error fetching utangs:', error);
            Alert.alert('Error', 'Hindi ma-load yung listahan mo perds.');
        } finally {
            setLoading(false);
        }
    };

    // Calculate Summaries
    const totalReceivables = utangs.filter(u => u.type === 'lent' && u.status === 'active').reduce((sum, u) => sum + u.balance, 0);
    const totalPayables = utangs.filter(u => u.type === 'borrowed' && u.status === 'active').reduce((sum, u) => sum + u.balance, 0);
    const netPosition = totalReceivables - totalPayables;

    const handleAddUtang = async () => {
        if (!newName || !newAmount) {
            Alert.alert('Oops!', 'Pangalan at Amount kailangan perds.');
            return;
        }

        try {
            setActionLoading(true);
            await utangService.addUtang({
                type: newType,
                person_name: newName,
                amount: parseFloat(newAmount),
                date: new Date().toISOString().split('T')[0],
                reason: newReason,
                due_date: newDueDate,
                has_interest: false,
            });
            setAddModalVisible(false);
            setNewName('');
            setNewAmount('');
            setNewReason('');
            setNewDueDate('');
            fetchData();
        } catch (error) {
            console.error('Error adding:', error);
            Alert.alert('Error', 'Ulitin mo perds, nagka-error.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogPayment = async () => {
        if (!selectedUtang || !paymentAmount) return;

        const amount = parseFloat(paymentAmount);
        if (amount <= 0 || amount > selectedUtang.balance) {
            Alert.alert('Invalid', 'Check mo mabuti ang amount perds.');
            return;
        }

        try {
            setActionLoading(true);
            await utangService.addPayment(
                selectedUtang.id,
                amount,
                new Date().toISOString().split('T')[0],
                selectedUtang.balance
            );
            setPaymentModalVisible(false);
            setPaymentAmount('');
            fetchData();
        } catch (error) {
            console.error('Error paying:', error);
            Alert.alert('Error', 'Nagkaproblema sa system perds.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Burahin ito?",
            "Sigurado ka bang buburahin mo 'to? Pati records ng payments burado din ha.",
            [
                { text: "Huwag", style: "cancel" },
                {
                    text: "Burahin",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await utangService.deleteUtang(id);
                            fetchData();
                        } catch (e) {
                            Alert.alert("Error", "Hindi mabura perds.");
                            setLoading(false);
                        }
                    }
                }
            ]
        )
    };

    if (loading && utangs.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.green} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
                <View style={styles.headerTop}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Utang Tracker</Text>
                </View>

                {/* Dashboard Summary */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryBox}>
                        <Text style={[styles.summaryLabel, { color: theme.muted }]} numberOfLines={1} adjustsFontSizeToFit>Pautang Ko</Text>
                        <Text style={[styles.summaryValue, { color: theme.green }]} numberOfLines={1} adjustsFontSizeToFit>
                            ₱{totalReceivables.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <Text style={[styles.summaryLabel, { color: theme.muted }]} numberOfLines={1} adjustsFontSizeToFit>Utang Ko</Text>
                        <Text style={[styles.summaryValue, { color: theme.red }]} numberOfLines={1} adjustsFontSizeToFit>
                            ₱{totalPayables.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <Text style={[styles.summaryLabel, { color: theme.muted }]}>Net Position</Text>
                        <Text style={[styles.summaryValue, { color: netPosition >= 0 ? theme.green : theme.red }]}>
                            {netPosition < 0 ? '-' : ''}₱{Math.abs(netPosition).toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Records</Text>

                {utangs.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <NotebookTabs size={48} color={theme.muted} />
                        <Text style={[styles.emptyText, { color: theme.muted }]}>Wala pang records ng utang</Text>
                    </View>
                ) : (
                    utangs.map(utang => (
                        <View key={utang.id} style={[styles.card, { backgroundColor: theme.card, borderColor: utang.type === 'lent' ? theme.green + '40' : theme.red + '40' }]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.titleRow}>
                                    <View style={[styles.typeBadge, { backgroundColor: utang.type === 'lent' ? theme.green + '20' : theme.red + '20' }]}>
                                        <Text style={[styles.typeText, { color: utang.type === 'lent' ? theme.green : theme.red }]}>
                                            {utang.type === 'lent' ? 'Pautang Ko' : 'Utang Ko'}
                                        </Text>
                                    </View>
                                    <Text style={[styles.personName, { color: theme.text }]}>{utang.person_name}</Text>
                                    {utang.status === 'settled' && (
                                        <View style={[styles.statusBadge, { backgroundColor: theme.green }]}><Check size={12} color="#fff" /></View>
                                    )}
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(utang.id)} style={styles.deleteBtn}>
                                    <Trash2 size={16} color={theme.red} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.detailsRow}>
                                <Text style={[styles.balanceText, { color: theme.text }]}>
                                    Balance: ₱{utang.balance.toLocaleString()}
                                    <Text style={{ fontSize: 13, color: theme.muted }}> / ₱{utang.amount.toLocaleString()}</Text>
                                </Text>
                            </View>

                            {(utang.reason || utang.due_date) && (
                                <View style={styles.metaInfo}>
                                    {utang.reason && <Text style={[styles.metaText, { color: theme.muted }]}>Para sa: {utang.reason}</Text>}
                                    {utang.due_date && <Text style={[styles.metaText, { color: theme.muted }]}>Due: {utang.due_date}</Text>}
                                </View>
                            )}

                            {utang.status === 'active' && (
                                <View style={styles.actionsRow}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: theme.cardBorder }]}
                                        onPress={() => {
                                            setSelectedUtang(utang);
                                            setPaymentModalVisible(true);
                                        }}
                                    >
                                        <HandCoins size={16} color={theme.text} />
                                        <Text style={[styles.actionBtnText, { color: theme.text }]}>Log Payment</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add Modal */}
            <Modal visible={addModalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Dalaw or Dinapuan?</Text>
                            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                                <X size={24} color={theme.muted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeBtn, newType === 'lent' && { backgroundColor: theme.green }]}
                                onPress={() => setNewType('lent')}
                            >
                                <Text style={[styles.typeBtnTxt, { color: newType === 'lent' ? '#fff' : theme.muted }]}>Nagpautang Ako (Receivable)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, newType === 'borrowed' && { backgroundColor: theme.red }]}
                                onPress={() => setNewType('borrowed')}
                            >
                                <Text style={[styles.typeBtnTxt, { color: newType === 'borrowed' ? '#fff' : theme.muted }]}>Umutang Ako (Payable)</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.cardBorder }]}
                            placeholder="Pangalan (Sino?)"
                            placeholderTextColor={theme.muted}
                            value={newName}
                            onChangeText={setNewName}
                        />
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.cardBorder }]}
                            placeholder="Magkano? (₱)"
                            placeholderTextColor={theme.muted}
                            keyboardType="numeric"
                            value={newAmount}
                            onChangeText={setNewAmount}
                        />
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.cardBorder }]}
                            placeholder="Anong rason?"
                            placeholderTextColor={theme.muted}
                            value={newReason}
                            onChangeText={setNewReason}
                        />
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.cardBorder }]}
                            placeholder="Due Date (YYYY-MM-DD)"
                            placeholderTextColor={theme.muted}
                            value={newDueDate}
                            onChangeText={setNewDueDate}
                        />

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.green }]}
                            onPress={handleAddUtang}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Idagdag</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Payment Modal */}
            <Modal visible={paymentModalVisible} animationType="fade" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Log Payment / Bayad</Text>
                            <TouchableOpacity onPress={() => { setPaymentModalVisible(false); setPaymentAmount(''); }}>
                                <X size={24} color={theme.muted} />
                            </TouchableOpacity>
                        </View>

                        {selectedUtang && (
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ color: theme.muted }}>Para kay: <Text style={{ color: theme.text, fontWeight: '700' }}>{selectedUtang.person_name}</Text></Text>
                                <Text style={{ color: theme.muted }}>Current Balance: <Text style={{ color: theme.red, fontWeight: '700' }}>₱{selectedUtang.balance.toLocaleString()}</Text></Text>
                            </View>
                        )}

                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.cardBorder }]}
                            placeholder="Magkanong binayad? (₱)"
                            placeholderTextColor={theme.muted}
                            keyboardType="numeric"
                            value={paymentAmount}
                            onChangeText={setPaymentAmount}
                        />

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.green }]}
                            onPress={handleLogPayment}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>I-log ang Bayad</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.green, shadowColor: theme.green }]}
                onPress={() => setAddModalVisible(true)}
            >
                <Plus size={24} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

// Just importing this so JSX doesn't break
const { X } = require('lucide-react-native');

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 10 : 0,
        paddingBottom: 24,
        borderBottomWidth: 1,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    summaryBox: {
        flex: 1,
        minWidth: '30%',
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        opacity: 0.5,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    personName: {
        fontSize: 18,
        fontWeight: '700',
    },
    statusBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBtn: {
        padding: 4,
    },
    detailsRow: {
        marginBottom: 8,
    },
    balanceText: {
        fontSize: 24,
        fontWeight: '800',
    },
    metaInfo: {
        marginTop: 4,
        marginBottom: 12,
        gap: 4,
    },
    metaText: {
        fontSize: 13,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 'auto',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    typeBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    typeBtnTxt: {
        fontWeight: '700',
        fontSize: 13,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
    },
    saveButton: {
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
