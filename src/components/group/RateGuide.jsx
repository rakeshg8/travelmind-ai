import { useState } from "react";

export default function RateGuide({ booking, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  if (!booking) {
    return null;
  }

  return (
    <div className="glass-card p-4">
      <h4 className="font-heading">Rate Guide</h4>
      <div className="mt-2 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`rounded px-2 py-1 ${rating >= n ? "bg-warning text-primary" : "bg-slate-700"}`}
          >
            {n}
          </button>
        ))}
      </div>
      <textarea
        className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Write your review"
      />
      <button
        type="button"
        className="mt-2 rounded-lg bg-accent px-3 py-2 text-primary"
        onClick={() => onSubmit({ booking, rating, review })}
      >
        Submit Review
      </button>
    </div>
  );
}
