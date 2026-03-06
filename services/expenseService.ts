import { supabase } from "../lib/supabase";

export interface Expense {
  id: string;
  user_id: string;
  created_at: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: string;
}

export const expenseService = {
  async getExpenses() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) throw error;
    return data as Expense[];
  },

  async addExpense(expense: Omit<Expense, "id" | "created_at" | "user_id">) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("expenses")
      .insert([{ ...expense, user_id: user.id }])
      .select();

    if (error) throw error;
    return data[0] as Expense;
  },

  async deleteExpense(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // Guard for security

    if (error) throw error;
  },

  async updateExpenseAmount(id: string, amount: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const { error } = await supabase
      .from("expenses")
      .update({ amount })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
  },
};
