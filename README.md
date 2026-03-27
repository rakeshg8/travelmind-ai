# TravelMind AI

TravelMind AI is a production-focused hackathon application for IdeaVerse'26 at IIIT Sricity.

## Stack
- React 18 + Vite + React Router v6
- Tailwind CSS v3 (dark design system)
- Firebase Auth (Email/Password + Google)
- Supabase PostgreSQL + pgvector + Realtime
- Cohere embeddings (`embed-english-v3.0`)
- OpenRouter (`mistralai/mistral-7b-instruct`)
- AviationStack flight monitoring
- OpenStreetMap Nominatim (location-ready integration point)

## Project Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill all `VITE_*` values.
3. In Supabase SQL editor, run `supabase/schema.sql`.
4. Start app:
   ```bash
   npm run dev
   ```

## API Keys
All runtime config is loaded from Vite environment variables (`VITE_*`) via `src/config/keys.js`.

## Vercel Deployment Notes
1. In Vercel Project Settings > Environment Variables, add every variable from `.env.example`.
2. Use `npm run build` as the build command.
3. Ensure your deployed domain is added to Firebase Auth Authorized Domains.
4. Ensure your deployed domain is added in OpenRouter app/referrer settings (if enforced).
5. For demo mode with Firebase Auth + Supabase tables, keep the demo RLS policies enabled for the trip tables.

## Live Flight Monitoring (Important)
- The Simulate Disruption button always generates mock disruptions for demo/testing.
- Real flight-based disruption alerts come only from flight monitoring checks.
- The flight proxy route is `api/flight-status.js` and requires server env `AVIATIONSTACK_KEY`.

Local development options:
1. Preferred: run with Vercel runtime so `/api/*` works locally:
   - `npx vercel dev`
2. Or run `npm run dev` and set `VITE_FLIGHT_PROXY_BASE_URL=https://your-app.vercel.app` in `.env.local`.

If `/api/flight-status` is missing locally, the app now reports a clear diagnostic message in monitor details.

Important security note:
- `VITE_*` variables are embedded into client bundles and are visible in the browser.
- Supabase anon key is expected to be public, but provider API keys (Cohere/OpenRouter/AviationStack) are not truly secret in a pure frontend app.
- For production hardening, move provider calls to a backend or serverless API route and keep private keys server-side.

## Database Seeding
- `src/utils/cityData.js` contains curated data for 6 Indian cities.
- On app startup, `embedAndSeedKnowledge()` runs once and inserts embeddings into `place_knowledge` if table is empty.

## Auth + Profile
- Signup supports name, phone, travel style, and interests.
- On successful signup/login, user profile is upserted in `users` with Firebase UID.

## Demo Script For Judges
1. Open landing page and show dual-mode UX.
2. Toggle `Demo Mode` in navbar.
3. Login and enter `Solo Dashboard`.
4. Run trip setup with a destination and optional flight number.
5. Click `Simulate Disruption` to show live agent reasoning:
   - Disruption detected
   - Analyzing options
   - Found alternatives
   - Recommendation ready
6. Trigger `Get Suggestions` for proactive personalized cards.
7. Trigger `Find Travel Buddies` for vector similarity matches.
8. Open floating AI Assistant and ask:
   - "What's a good budget dinner near my hotel in Bengaluru?"
9. Switch to `Group` dashboard:
   - Create group
   - Open group detail
   - Show realtime chat
   - View guide profiles and create booking
10. Open `/admin` as admin role and show moderation tables.

## Notes
- Realtime notifications subscribe per user in `NotificationContext`.
- Group chat uses Supabase Realtime subscriptions on `messages`.
- Disruption agent service is in `src/services/disruptionAgent.js` and includes simulation endpoint for demos.
- Live flight monitoring requires a backend proxy in production due to third-party API CORS constraints; demo uses simulation mode (`simulateDisruption()`).
