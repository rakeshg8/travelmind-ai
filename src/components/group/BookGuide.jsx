import { useState } from "react";

export default function BookGuide({ guide, groupId, onBook }) {
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const handleBook = async () => {
    if (!date) {
      setError("Please select a date");
      return;
    }
    setError("");
    await onBook({ guide_id: guide.id, group_id: groupId, booking_date: date });
  };

  if (!guide) {
    return null;
  }

  return (
    <div className="glass-card p-4">
      <h4 className="mb-2 font-heading">Book {guide.user?.name || "Guide"}</h4>
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setError("");
          }}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
        />
        <button
          type="button"
          className="rounded-lg bg-accent px-3 py-2 text-primary"
          onClick={handleBook}
        >
          Confirm Booking
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
