import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../config/supabase";
import { notificationService } from "../services/notificationService";
import { useAuth } from "../hooks/useAuth";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let channel;

    async function setup() {
      if (!user?.uid) {
        setNotifications([]);
        return;
      }

      setLoading(true);
      try {
        const initial = await notificationService.getNotifications(user.uid);
        setNotifications(initial);

        channel = supabase
          .channel(`notifications-${user.uid}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.uid}`,
            },
            (payload) => {
              setNotifications((current) => [payload.new, ...current]);
            }
          )
          .subscribe();
      } finally {
        setLoading(false);
      }
    }

    setup();
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.uid]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const markRead = async (id) => {
    await notificationService.markRead(id);
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );
  };

  const markAllRead = async () => {
    if (!user?.uid) return;
    await notificationService.markAllRead(user.uid);
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
  };

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead, loading }),
    [notifications, unreadCount, loading]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider");
  }
  return context;
}
