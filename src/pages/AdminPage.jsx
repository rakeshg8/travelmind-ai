import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FolderKanban, Shield, Users } from "lucide-react";
import { supabase } from "../config/supabase";

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function EmptyRow({ text, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-slate-400">
        {text}
      </td>
    </tr>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [pendingGuides, setPendingGuides] = useState([]);
  const [groups, setGroups] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [usersRes, guidesRes, groupsRes, bookingsRes, logsRes] = await Promise.all([
          supabase.from("users").select("id, name, email, role"),
          supabase.from("guides").select("*").eq("is_approved", false),
          supabase.from("travel_groups").select("*"),
          supabase.from("guide_bookings").select("*"),
          supabase.from("group_logs").select("*").order("created_at", { ascending: false }).limit(20),
        ]);

        setUsers(usersRes.data || []);
        setPendingGuides(guidesRes.data || []);
        setGroups(groupsRes.data || []);
        setBookings(bookingsRes.data || []);
        setLogs(logsRes.data || []);
      } catch (error) {
        console.error("Admin load failed:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const deleteUser = async (id) => {
    await supabase.from("users").delete().eq("id", id);
    setUsers((current) => current.filter((item) => item.id !== id));
  };

  const setGuideApproval = async (id, approved) => {
    await supabase.from("guides").update({ is_approved: approved }).eq("id", id);
    setPendingGuides((current) => current.filter((item) => item.id !== id));
  };

  const deleteGroup = async (id) => {
    await supabase.from("travel_groups").delete().eq("id", id);
    setGroups((current) => current.filter((item) => item.id !== id));
  };

  const stats = useMemo(
    () => [
      { label: "Total Users", value: users.length, icon: Users, tone: "text-sky-300" },
      { label: "Pending Guides", value: pendingGuides.length, icon: AlertTriangle, tone: "text-amber-300" },
      { label: "Travel Groups", value: groups.length, icon: FolderKanban, tone: "text-indigo-300" },
      { label: "Audit Events", value: logs.length, icon: Shield, tone: "text-emerald-300" },
    ],
    [users.length, pendingGuides.length, groups.length, logs.length]
  );

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <section className="glass-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl">Admin Control Center</h1>
            <p className="mt-1 text-sm text-slate-400">
              Moderate users, guide approvals, groups, bookings, and audit activity.
            </p>
          </div>
          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              Refreshing data
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Synced
            </span>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                </div>
                <Icon className={`h-5 w-5 ${card.tone}`} />
              </div>
            </article>
          );
        })}
      </section>

      <section className="glass-card overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-heading text-xl">User Management</h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {!users.length ? <EmptyRow text="No users found." colSpan={4} /> : null}
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-800/80 hover:bg-slate-900/40">
                  <td className="px-4 py-3">{user.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-300">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs capitalize">{user.role || "user"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20"
                      onClick={() => deleteUser(user.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-4 font-heading text-xl">Guide Approvals</h2>
        <div className="space-y-3">
          {!pendingGuides.length ? (
            <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-400">
              No pending guide approvals.
            </p>
          ) : null}
          {pendingGuides.map((guide) => (
            <div key={guide.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{guide.city || "Unknown City"}</p>
                  <p className="text-xs text-slate-400">₹{guide.price_per_day || 0}/day</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20"
                    onClick={() => setGuideApproval(guide.id, true)}
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                    onClick={() => setGuideApproval(guide.id, false)}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="glass-card overflow-hidden">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-heading text-xl">All Groups</h2>
          </div>
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Destination</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {!groups.length ? <EmptyRow text="No groups available." colSpan={3} /> : null}
                {groups.map((group) => (
                  <tr key={group.id} className="border-t border-slate-800/80 hover:bg-slate-900/40">
                    <td className="px-4 py-3">{group.name}</td>
                    <td className="px-4 py-3 text-slate-300">{group.destination}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20"
                        onClick={() => deleteGroup(group.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="glass-card overflow-hidden">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-heading text-xl">All Bookings</h2>
          </div>
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Guide</th>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {!bookings.length ? <EmptyRow text="No bookings found." colSpan={3} /> : null}
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-slate-800/80 hover:bg-slate-900/40">
                    <td className="px-4 py-3 text-slate-300">{booking.guide_id}</td>
                    <td className="px-4 py-3 text-slate-300">{booking.user_id}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-xs capitalize">{booking.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="glass-card overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-heading text-xl">Audit Logs</h2>
        </div>
        <div className="max-h-[360px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">By</th>
                <th className="px-4 py-3 text-left font-medium">Target</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {!logs.length ? <EmptyRow text="No audit logs yet." colSpan={4} /> : null}
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-800/80 hover:bg-slate-900/40">
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3 text-slate-300">{log.performed_by}</td>
                  <td className="px-4 py-3 text-slate-300">{log.target_user}</td>
                  <td className="px-4 py-3 text-slate-400">{formatTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
