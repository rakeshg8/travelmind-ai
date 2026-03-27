import { Link } from "react-router-dom";
import { Users, User } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="bg-hero min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="text-center">
          <h1 className="mb-3 font-heading text-4xl md:text-6xl">Your AI Travel Companion</h1>
          <p className="mx-auto max-w-3xl text-base text-slate-300 md:text-lg">
            Solo or together - TravelMind handles disruptions, finds hidden gems, and connects you with fellow
            travelers.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="glass-card animate-slide-up p-6">
            <div className="mb-4 flex items-center gap-3 text-accent">
              <User className="h-8 w-8" />
              <h2 className="font-heading text-2xl">Solo Traveller</h2>
            </div>
            <p className="mb-6 text-slate-300">
              AI handles disruptions. Proactive suggestions. Find travel buddies.
            </p>
            <Link
              to="/solo"
              className="inline-block rounded-xl bg-accent px-5 py-3 font-semibold text-primary transition hover:scale-105"
            >
              Start Solo Journey
            </Link>
          </article>

          <article className="glass-card animate-slide-up p-6 [animation-delay:200ms]">
            <div className="mb-4 flex items-center gap-3 text-sky-300">
              <Users className="h-8 w-8" />
              <h2 className="font-heading text-2xl">Group Travel</h2>
            </div>
            <p className="mb-6 text-slate-300">
              Create groups, book guides, coordinate seamlessly.
            </p>
            <Link
              to="/group"
              className="inline-block rounded-xl bg-sky-400 px-5 py-3 font-semibold text-primary transition hover:scale-105"
            >
              Explore Groups
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
