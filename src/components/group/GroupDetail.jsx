import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuth";
import JoinRequests from "./JoinRequests";
import GroupChat from "./GroupChat";
import GuideList from "./GuideList";
import GuideProfile from "./GuideProfile";
import BookGuide from "./BookGuide";

const TABS = ["overview", "members", "chat", "guide"];

export default function GroupDetail() {
  const { groupId: paramId } = useParams();
  const { user } = useAuth();
  const [groupId, setGroupId] = useState(paramId || "");
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [guides, setGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!groupId) return;

    async function load() {
      const [{ data: groupData }, { data: memberData }, { data: guideData }] = await Promise.all([
        supabase.from("travel_groups").select("*").eq("id", groupId).single(),
        supabase.from("group_members").select("*, users(name)").eq("group_id", groupId),
        supabase.from("guides").select("*, users(name)").eq("is_approved", true),
      ]);

      setGroup(groupData);
      setMembers(memberData || []);
      setRequests((memberData || []).filter((row) => row.status === "pending"));
      setGuides((guideData || []).filter((g) => !groupData?.destination || g.city === groupData.destination));
    }

    load();
  }, [groupId]);

  const isAdmin = useMemo(() => group?.created_by === user?.uid, [group?.created_by, user?.uid]);

  const handleDecision = async (request, status) => {
    await supabase.from("group_members").update({ status }).eq("id", request.id);
    await supabase.from("group_logs").insert({
      group_id: groupId,
      action: `member_${status}`,
      performed_by: user.uid,
      target_user: request.user_id,
      reason: `Request ${status} by admin`,
    });
    setRequests((current) => current.filter((item) => item.id !== request.id));
  };

  const bookGuide = async (payload) => {
    await supabase.from("guide_bookings").insert({
      ...payload,
      user_id: user.uid,
      status: "pending",
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div className="glass-card p-4">
        <h2 className="font-heading text-2xl">{group?.name || "Group Detail"}</h2>
        <p className="text-slate-300">{group?.destination} • {group?.travel_date}</p>
        {!paramId ? (
          <input
            className="mt-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            placeholder="Paste Group ID"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tabId) => (
          <button
            key={tabId}
            type="button"
            className={`rounded-full px-4 py-2 text-sm ${tab === tabId ? "bg-accent text-primary" : "bg-slate-800"}`}
            onClick={() => setTab(tabId)}
          >
            {tabId}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="glass-card p-4 text-sm">
          <p>{group?.description || "No description yet."}</p>
          <p className="mt-2 text-slate-300">Members: {members.length} / {group?.max_members || 0}</p>
        </div>
      ) : null}

      {tab === "members" ? (
        <div className="space-y-3">
          <div className="glass-card p-4">
            <h3 className="mb-2 font-heading text-lg">Members</h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="rounded-lg bg-slate-900/70 p-2 text-sm">
                  {member.users?.name || member.user_id} • {member.status}
                </div>
              ))}
            </div>
          </div>

          {isAdmin ? <JoinRequests requests={requests} onDecision={handleDecision} /> : null}
        </div>
      ) : null}

      {tab === "chat" ? <GroupChat groupId={groupId} /> : null}

      {tab === "guide" ? (
        <div className="space-y-3">
          <GuideList guides={guides} onView={setSelectedGuide} onBook={setSelectedGuide} />
          <GuideProfile guide={selectedGuide} />
          <BookGuide guide={selectedGuide} groupId={groupId} onBook={bookGuide} />
        </div>
      ) : null}
    </div>
  );
}
