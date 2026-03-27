import { supabase } from "../config/supabase";

export const notificationService = {
  async createNotification(userId, title, message, type = "info") {
    const { data, error } = await supabase
      .from("notifications")
      .insert({ user_id: userId, title, message, type })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  async getNotifications(userId) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    return data || [];
  },

  async markRead(id) {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) {
      throw error;
    }
  },

  async markAllRead(userId) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) {
      throw error;
    }
  },
};
