import { supabase } from '../lib/supabase';
import { Expense } from './expenseService';

export interface PayrollEntry {
    id: string;
    employee_name: string;
    week1: number;
    week2: number;
    date: string;
}

export const payrollService = {
    async getPayrollEntries() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .eq('category', 'Payroll')
            .order('date', { ascending: false });

        if (error) throw error;

        return (data as Expense[]).map(e => {
            const [name, w1, w2] = e.description.split(' | ');
            return {
                id: e.id,
                employee_name: name,
                week1: parseFloat(w1) || 0,
                week2: parseFloat(w2) || 0,
                date: e.date
            };
        });
    },

    async savePayrollEntry(entry: Omit<PayrollEntry, 'id'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const description = `${entry.employee_name} | ${entry.week1} | ${entry.week2}`;
        const amount = entry.week1 + entry.week2;

        const { data, error } = await supabase
            .from('expenses')
            .insert([{
                user_id: user.id,
                amount,
                category: 'Payroll',
                description,
                date: entry.date,
                payment_method: 'Payroll'
            }])
            .select();

        if (error) throw error;
        return data[0];
    },

    async deletePayrollEntry(id: string) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
