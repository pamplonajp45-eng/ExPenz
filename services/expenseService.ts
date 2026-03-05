import { supabase } from '../lib/supabase';

export interface Expense {
    id: string;
    created_at: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    payment_method: string;
}

export const expenseService = {
    async getExpenses() {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data as Expense[];
    },

    async addExpense(expense: Omit<Expense, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('expenses')
            .insert([expense])
            .select();

        if (error) throw error;
        return data[0] as Expense;
    },

    async deleteExpense(id: string) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
