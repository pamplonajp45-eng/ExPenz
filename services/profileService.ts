import { supabase } from "../lib/supabase";

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  monthly_income: number;
  created_at: string;
}

export const profileService = {
  async getProfile(userId?: string) {
    let user_id = userId;
    if (!user_id) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      user_id = user.id;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 is "No rows found"
    return data as Profile;
  },

  async updateIncome(income: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update({ monthly_income: income })
      .eq("user_id", user.id)
      .select();

    if (error) throw error;
    return data[0] as Profile;
  },

  async createProfile(userIdOrFullName: string | null = null, email?: string) {
    let user_id: string;
    let user_email: string | undefined;
    let fullName: string | null = null;

    // Handle both old and new signatures for backward compatibility
    if (userIdOrFullName && userIdOrFullName.includes("@")) {
      // Old signature: createProfile(fullName)
      fullName = userIdOrFullName;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      user_id = user.id;
      user_email = user.email || undefined;
    } else if (userIdOrFullName) {
      // New signature: createProfile(userId, email)
      user_id = userIdOrFullName;
      user_email = email;
    } else {
      // Fallback: get from auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      user_id = user.id;
      user_email = user.email || undefined;
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        [
          {
            user_id: user_id,
            email: user_email,
            full_name: fullName,
            monthly_income: 50000,
          },
        ],
        { onConflict: "user_id" },
      )
      .select();

    if (error) throw error;
    return data[0] as Profile;
  },
};
