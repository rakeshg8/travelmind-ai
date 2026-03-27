import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuth";
import GroupList from "./GroupList";
import CreateGroup from "./CreateGroup";
import GuideList from "./GuideList";
import GuideProfile from "./GuideProfile";
import BookGuide from "./BookGuide";
import BookingHistory from "./BookingHistory";
import RateGuide from "./RateGuide";

const TABS = ["My Groups", "Browse Groups", "Guides", "My Bookings"];

export default function GroupDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0]);
  const [loading, setLoading] = useState(true);
  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [memberGroupIds, setMemberGroupIds] = useState(() => new Set());
  const [guides, setGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const [groupRes, membersRes, guidesRes, bookingsRes] = await Promise.all([
          supabase.from("travel_groups").select("*").order("created_at", { ascending: false }),
          supabase.from("group_members").select("group_id, status").eq("user_id", user.uid),
          supabase.from("guides").select("*, users(name)").eq("is_approved", true),
          supabase.from("guide_bookings").select("*, guides(*, users(name))").eq("user_id", user.uid),
        ]);

        const groups = groupRes.data || [];
        const ids = new Set((membersRes.data || []).map((row) => row.group_id));
        setAllGroups(groups);
        setMyGroups(groups.filter((group) => ids.has(group.id) || group.created_by === user.uid));
        setMemberGroupIds(ids);
        setGuides(guidesRes.data || []);
        setBookings(bookingsRes.data || []);
      } catch (error) {
        console.error("Load failed:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.uid]);

  const createGroup = async (form) => {
    const { data } = await supabase
      .from("travel_groups")
      .insert({ ...form, created_by: user.uid })
      .select()
      .single();

    await supabase.from("group_members").insert({
      group_id: data.id,
      user_id: user.uid,
      status: "approved",
    });

    setAllGroups((current) => [data, ...current]);
    setMyGroups((current) => [data, ...current]);
  };

  const openGroup = (group) => navigate(`/group/${group.id}`);

  const requestJoin = async (groupId) => {
    const { error } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: user.uid,
      status: "pending",
    });
    if (!error) {
      setMemberGroupIds((prev) => new Set([...prev, groupId]));
    }
  };

  const bookGuide = async ({ guide_id, group_id, booking_date }) => {
    if (!group_id) return;
    await supabase.from("guide_bookings").insert({
      guide_id,
      group_id,
      user_id: user.uid,
      booking_date,
      status: "pending",
    });
  };

  const submitRating = async ({ booking, rating, review }) => {
    await supabase.from("guide_bookings").update({ rating, review }).eq("id", booking.id);

    const { data: ratings } = await supabase
      .from("guide_bookings")
      .select("rating")
      .eq("guide_id", booking.guide_id)
      .not("rating", "is", null);

    const values = ratings || [];
    if (values.length) {
      const avg = values.reduce((sum, row) => sum + Number(row.rating || 0), 0) / values.length;
      await supabase
        .from("guides")
        .update({ avg_rating: Math.round(avg * 10) / 10 })
        .eq("id", booking.guide_id);
    }

    setActiveBooking(null);
  };

  if (loading) {
    return <div className="mx-auto max-w-7xl animate-pulse px-4 py-6">Loading your groups...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tabLabel) => (
          <button
            key={tabLabel}
            type="button"
            className={`rounded-full px-4 py-2 text-sm ${tab === tabLabel ? "bg-accent text-primary" : "bg-slate-800"}`}
            onClick={() => setTab(tabLabel)}
          >
            {tabLabel}
          </button>
        ))}
      </div>

      {tab === "My Groups" ? (
        <div className="space-y-4">
          <CreateGroup onCreate={createGroup} />
          <GroupList groups={myGroups} onOpen={openGroup} />
        </div>
      ) : null}

      {tab === "Browse Groups" ? <GroupList groups={allGroups} onOpen={openGroup} memberGroupIds={memberGroupIds} onJoin={requestJoin} userId={user.uid} /> : null}

      {tab === "Guides" ? (
        <div className="space-y-4">
          <GuideList guides={guides} onView={setSelectedGuide} onBook={setSelectedGuide} />
          <GuideProfile guide={selectedGuide} />
          <BookGuide guide={selectedGuide} groupId={myGroups[0]?.id} onBook={bookGuide} />
        </div>
      ) : null}

      {tab === "My Bookings" ? (
        <div className="space-y-4">
          <BookingHistory bookings={bookings} onRate={setActiveBooking} />
          <RateGuide booking={activeBooking} onSubmit={submitRating} />
        </div>
      ) : null}
    </div>
  );
}
