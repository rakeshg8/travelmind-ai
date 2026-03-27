export default function JoinRequests({ requests, onDecision }) {
  if (!requests.length) {
    return <p className="text-sm text-slate-400">No pending requests.</p>;
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => (
        <div key={request.id} className="glass-card flex items-center justify-between p-3">
          <div>
            <p className="font-medium">{request.users?.name || request.user_id}</p>
            <p className="text-xs text-slate-400">Requested to join</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-success/20 px-3 py-1 text-success"
              onClick={() => onDecision(request, "approved")}
            >
              Approve
            </button>
            <button
              type="button"
              className="rounded bg-danger/20 px-3 py-1 text-danger"
              onClick={() => onDecision(request, "rejected")}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
