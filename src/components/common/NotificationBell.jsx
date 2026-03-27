import { Bell, AlertTriangle, Sparkles, Users, Info } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "../../hooks/useNotifications";

function iconForType(type) {
  if (type === "disruption") return <AlertTriangle className="h-4 w-4 text-danger" />;
  if (type === "suggestion") return <Sparkles className="h-4 w-4 text-success" />;
  if (type === "match") return <Users className="h-4 w-4 text-sky-400" />;
  return <Info className="h-4 w-4 text-slate-300" />;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="relative rounded-full border border-slate-600 p-2 hover:bg-slate-800"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-danger px-1.5 text-xs">{unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-700 bg-primary/95 p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-heading text-sm">Notifications</h4>
            <button className="text-xs text-accent" onClick={markAllRead} type="button">
              Mark all read
            </button>
          </div>
          <div className="max-h-80 space-y-2 overflow-auto">
            {notifications.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => markRead(item.id)}
                className="glass-card w-full p-2 text-left"
                type="button"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-slate-300">
                  {iconForType(item.type)}
                  <span>{item.title || "TravelMind Update"}</span>
                </div>
                <p className="text-sm text-slate-100">{item.message}</p>
              </button>
            ))}
            {!notifications.length ? <p className="text-sm text-slate-400">No notifications yet.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
