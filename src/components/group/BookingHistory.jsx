export default function BookingHistory({ bookings, onRate }) {
  return (
    <div className="space-y-2">
      {bookings.map((booking) => (
        <div key={booking.id} className="glass-card flex items-center justify-between p-3">
          <div>
            <p className="font-medium">Guide: {booking.guides?.users?.name || booking.guide_id}</p>
            <p className="text-sm text-slate-300">Status: {booking.status}</p>
          </div>
          {booking.status === "completed" ? (
            <button
              className="rounded-lg bg-warning/20 px-3 py-2 text-warning"
              type="button"
              onClick={() => onRate(booking)}
            >
              Rate Guide
            </button>
          ) : null}
        </div>
      ))}
      {!bookings.length ? <p className="text-sm text-slate-400">No bookings yet.</p> : null}
    </div>
  );
}
