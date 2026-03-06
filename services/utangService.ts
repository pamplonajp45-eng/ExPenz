import { supabase } from '../lib/supabase';

export interface UtangPayment {
    id: string;
    utang_id: string;
    amount: number;
    date: string;
    created_at: string;
}

export interface Utang {
    id: string;
    user_id: string;
    type: 'lent' | 'borrowed';
    person_name: string;
    amount: number;
    balance: number;
    date: string;
    reason?: string;
    due_date?: string;
    has_interest: boolean;
    status: 'active' | 'settled';
    created_at: string;
    payments?: UtangPayment[];
}

export const utangService = {
    async getUtangs() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('utangs')
            .select(`
                *,
                payments:utang_payments(*)
            `)
            .eq('user_id', user.id)
            .order('due_date', { ascending: true, nullsFirst: false });

        if (error) throw error;

        data.forEach(u => {
            if (u.payments) {
                u.payments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            }
        });
        return data as Utang[];
    },

    async addUtang(utang: Omit<Utang, 'id' | 'created_at' | 'user_id' | 'status' | 'balance'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const newUtang = {
            ...utang,
            user_id: user.id,
            balance: utang.amount,
            status: 'active'
        };

        const { data, error } = await supabase
            .from('utangs')
            .insert([newUtang])
            .select();

        if (error) throw error;
        return data[0] as Utang;
    },

    async addPayment(utangId: string, amount: number, currentDate: string, currentBalance: number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error: paymentError } = await supabase
            .from('utang_payments')
            .insert([{
                utang_id: utangId,
                amount: amount,
                date: currentDate
            }]);

        if (paymentError) throw paymentError;

        const newBalance = Math.max(0, currentBalance - amount);
        const newStatus = newBalance === 0 ? 'settled' : 'active';

        const { error: updateError } = await supabase
            .from('utangs')
            .update({ balance: newBalance, status: newStatus })
            .eq('id', utangId)
            .eq('user_id', user.id);

        if (updateError) throw updateError;
    },

    async deleteUtang(id: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('utangs')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;
    }
};
