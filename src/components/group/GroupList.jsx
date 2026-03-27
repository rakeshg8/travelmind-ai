import GroupCard from "./GroupCard";

export default function GroupList({ groups, onOpen, memberGroupIds, onJoin, userId }) {
  if (!groups.length) {
    return <p className="text-sm text-slate-400">No groups found.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onOpen={onOpen}
          isMember={memberGroupIds ? memberGroupIds.has(group.id) || group.created_by === userId : true}
          onJoin={onJoin}
        />
      ))}
    </div>
  );
}
