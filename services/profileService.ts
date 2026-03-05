import { supabase } from '../lib/supabase';

export interface Profile {
    id: string;
    user_id: string;
    email: string | null;
    full_name: string | null;
    monthly_income: number;
    created_at: string;
}

export const profileService = {
    async getProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows found"
        return data as Profile;
    },

    async updateIncome(income: number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('profiles')
            .update({ monthly_income: income })
            .eq('user_id', user.id)
            .select();

        if (error) throw error;
        return data[0] as Profile;
    },

    async createProfile(fullName: string | null = null) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('profiles')
            .upsert(
                [
                    {
                        user_id: user.id,
                        email: user.email,
                        full_name: fullName,
                        monthly_income: 50000
                    }
                ],
                { onConflict: 'user_id' }
            )
            .select();

        if (error) throw error;
        return data[0] as Profile;
    }
};
