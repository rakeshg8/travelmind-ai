# TravelMind AI

TravelMind AI is a production-focused hackathon application for IdeaVerse'26 at IIIT Sricity.

## Stack
- **Frontend:** React 18 + Vite + React Router v6
- **Styling:** Tailwind CSS v3 (dark design system)
- **Auth:** Firebase (Email/Password + Google OAuth)
- **Database:** Supabase PostgreSQL + pgvector extension + Realtime subscriptions
- **Vector Search:** Cohere embeddings (`embed-english-v3.0`, 1024-dim)
- **LLM:** OpenRouter with automatic fallbacks (primary: `openai/gpt-oss-20b:free`)
- **Flight Status:** AviationStack (via serverless proxy `/api/flight-status`)
- **Location Services:** OpenStreetMap Nominatim (integration point)
- **HTTP Client:** Axios

## Project Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill all required `VITE_*` values:
     - Firebase credentials (VITE_FIREBASE_*)
     - Supabase URL and anon key (VITE_SUPABASE_*)
     - OpenRouter API key and model (VITE_OPENROUTER_*)
     - Cohere API key (VITE_COHERE_API_KEY)
   - For local flight API testing, set `VITE_FLIGHT_PROXY_BASE_URL` to your Vercel deployment URL

3. Configure database:
   - Create a Supabase project
   - In Supabase SQL editor, run `supabase/schema.sql`
   - Enable Realtime on tables: `messages`, `notifications`, `active_trips`
   - Configure RLS policies (included in schema.sql)

4. Start development server:
   ```bash
   npm run dev
   ```
   - Frontend opens on `http://localhost:5173`
   - For flight API testing, use `npx vercel dev` to simulate serverless functions locally

5. Build for production:
   ```bash
   npm run build
   ```

## API Keys & Configuration

All runtime config is loaded from Vite environment variables (`VITE_*`) via `src/config/keys.js`.

**Required Keys:**
- **Firebase:** API Key, Auth Domain, Project ID, App ID (get from Firebase Console)
- **Supabase:** Project URL, Anon Key (get from Supabase Settings)
- **OpenRouter:** API Key with credits (get from https://openrouter.ai)
- **Cohere:** API Key (get from https://cohere.com)
- **AviationStack:** API Key (get from https://aviationstack.com, free tier: 100 req/month)

## Vercel Deployment

**Prerequisites:**
- Vercel account connected to GitHub repo
- All API keys and credentials ready

**Deployment Steps:**

1. **Set Environment Variables in Vercel Console:**
   - Go to Project Settings > Environment Variables > Production
   - Add all variables from `.env.example`:
     ```
     VITE_FIREBASE_API_KEY
     VITE_FIREBASE_AUTH_DOMAIN
     VITE_FIREBASE_PROJECT_ID
     VITE_FIREBASE_APP_ID
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
     VITE_COHERE_API_KEY
     VITE_OPENROUTER_API_KEY
     VITE_OPENROUTER_MODEL=openai/gpt-oss-20b:free
     AVIATIONSTACK_KEY  ← Server-side secret for flight API proxy
     ```

2. **Configure Authorizations:**
   - Firebase Console > Authentication > Authorized domains → Add your Vercel domain
   - OpenRouter app settings → Add your domain to HTTP Referer whitelist (if enforced)

3. **Build & Deploy:**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Vercel auto-detects and deploys on Git push

4. **Verify Deployment:**
   - Check serverless function: `https://your-domain.vercel.app/api/flight-status?flight_iata=6E169`
   - Should return flight data or "scheduled" status
   - If 404: Server env `AVIATIONSTACK_KEY` not set in Vercel console

**Troubleshooting:**
- Flight API 404: Check `AVIATIONSTACK_KEY` in Vercel > Settings > Environment Variables
- LLM requests failing: Verify `VITE_OPENROUTER_API_KEY` has active credits
- Firebase login failing: Confirm domain in Firebase > Authentication > Authorized domains
- Chat not real-time: Ensure Supabase Realtime enabled on `messages` table

## Flight Monitoring & Disruption Handling

**Architecture:**
- Flight checks are **manual-trigger only** (user clicks "Check Live Flight Status" button)
- No polling to preserve AviationStack free-tier quota (100 req/month)
- Initial one-time check performed when trip stop is created
- All checks are against real flight data (no simulation in production)

**Flow:**
1. User adds flight number to trip stop
2. Initial live flight check is triggered automatically
3. User can manually click "Check Live Flight Status" button anytime
4. Disruption agent classifies status: cancelled/delayed/none
5. If disruption detected and LLM available:
   - Alternative flight options generated
   - Itinerary automatically reflowed
   - User notified with recommendation
6. Results logged in action log for transparency

**API Details:**
- Endpoint: `POST /api/flight-status?flight_iata=6E169`
- Vercel serverless function: `api/flight-status.js`
- Server-side API key: `AVIATIONSTACK_KEY` (never exposed to client)
- Response format: `{ status, details, departure_delay, eta, raw }`

**Local Development:**
- For testing with real flight API: `npx vercel dev` (simulates serverless environment)
- Or set `VITE_FLIGHT_PROXY_BASE_URL=https://your-vercel-deployment-url` in `.env`
- Without proxy configured, app displays clear diagnostic message

**Important Notes:**
- Free tier: 100 requests/month → conserve via manual triggers
- Manual checks encourage user engagement vs. silent background polling
- Fallback: If LLM unavailable, pre-computed alternatives shown

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

## Demo Script For Judges / Testers

**Solo Travel Mode:**
1. Open landing page at `/`
2. Click "Sign Up" and create account with travel profile (style, interests)
3. Enter `Solo Dashboard` 
4. Create a new trip:
   - Enter destination (e.g., "Bengaluru")
   - Add stops with dates
   - Enter a flight number (e.g., "6E169" for real flights or any string for mock status)
5. Flight monitoring demo:
   - Automatic initial check triggers on trip creation
   - Click "Check Live Flight Status" button to manually check
   - View action log showing real-time status checks
   - If disruption detected, watch agent reasoning:
     - Problem summary
     - 2-3 alternative flight options
     - Recommended action
6. Itinerary features:
   - View AI-generated activities per stop (Activities panel)
   - Budget breakdown per activity
   - Item types: transport, sightseeing, food, free_time
7. Travel buddy discovery:
   - Click "Find Travel Buddies"
   - App searches for compatible solo travelers using vector similarity
   - Shows match cards with compatibility score
   - Profiles based on shared interests + destination + budget

**AI Features:**
8. Get Suggestions:
   - Click "Suggest Activities for [Stop]"
   - AI generates personalized recommendations
   - Results include budget, category, and details
9. Floating AI Assistant (bottom-right):
   - Click icon to open chat panel
   - Ask location-specific questions: "What's good food in Bengaluru?"
   - Answers grounded in curated place knowledge (RAG)
   - Shows place names, addresses, budgets, best times

**Group Travel Mode:**
10. Switch to `Group Dashboard`
11. Create a travel group:
    - Set destination, travel date, description
    - Set max members
12. Find guides:
    - View available guides filtered by destination city
    - See guide profiles, experience, languages, rating
13. Real-time group chat:
    - Type messages and see others' messages in real-time
    - Chat persists in Supabase
    - Shows message author and timestamp
14. Book a guide:
    - Click "Book" on guide card
    - Select booking date
    - Manage bookings in Booking History
    - Rate and review completed bookings

**Admin Features:**
15. Open `/admin` (requires admin role in Supabase users table)
16. View:
    - All groups and members
    - Guide approval queue
    - Moderation logs (who performed what action)
    - Group activity statistics

## Architecture & Key Components

**Services (`src/services/`):**
- `authService.js` - Firebase email/password + Google auth, profile sync to Supabase
- `llmService.js` - OpenRouter LLM with fallback chain on 402/404/429 errors
- `cohereService.js` - Embedding generation + caching for performance
- `ragService.js` - Retrieval-augmented generation using place_knowledge + Cohere
- `disruptionAgent.js` - Flight monitoring, disruption classification, alternative generation
- `tripPlannerService.js` - Trip/stop/itinerary management, AI generation
- `matchingService.js` - Solo traveler matching via vector similarity search
- `flightService.js` - Flight status proxy client
- `notificationService.js` - Realtime notification subscriptions

**Pages (`src/pages/`):**
- `LandingPage.jsx` - Public homepage
- `LoginPage.jsx`, `SignupPage.jsx` - Auth flows
- `SoloPage.jsx` - Solo dashboard wrapper
- `GroupPage.jsx` - Group dashboard wrapper  
- `ProfilePage.jsx` - User profile editor
- `AdminPage.jsx` - Admin moderation (admin-only)

**Key Features:**
- **Real-time Flight Monitoring:** Fetch live status via AviationStack, auto-disrupt itinerary
- **Vector Similarity Matching:** Cohere embeddings + pgvector for buddy discovery
- **Retrieval-Augmented Generation (RAG):** Place knowledge base grounding for AI responses
- **Real-time Chat:** Supabase subscriptions on messages table for instant updates
- **Automatic Itinerary Reflow:** Update activities when flight disrupted

## LLM Models & Fallback Chain

**Primary Model:**
- `openai/gpt-oss-20b:free` (20 billion parameters, free tier)

**Automatic Fallbacks** (triggered on errors):
1. `openai/gpt-oss-120b:free` (120B, more powerful)
2. `meta-llama/llama-3.3-70b-instruct:free` (Meta's Llama)
3. `google/gemma-3-4b-it:free` (Google's lightweight model)
4. `qwen/qwen3-coder:free` (Alibaba's coder-tuned)
5. `mistralai/mistral-small-3.1-24b-instruct:free` (Mistral fallback)

**Error Handling:**
- 402 Insufficient Credits → Try next model
- 404 Model Unavailable → Try next model  
- 429 Rate Limited → Try next model
- 5xx Server Error → Try next model
- **Temperature:** 0.4 (deterministic, focused)

## Vector Search & Embeddings

**Cohere embed-english-v3.0:**
- Dimension: 1024
- Input types: `search_query` (user input), `search_document` (knowledge seeding)
- In-memory caching to avoid redundant API calls
- Rate-limit retry: Max 3 attempts with exponential backoff

**Database Optimization:**
- pgvector IVFFlat index on `place_knowledge.content_embedding`
- Lists: 100, Distance metric: cosine similarity
- Enables sub-100ms semantic search on 1000+ embeddings

**Knowledge Base:**
- Table: `place_knowledge` (restaurants, cafes, sightseeing, activities, transport, safety, lounges)
- Seeded on app startup from `src/utils/cityData.js` (6 Indian cities)
- Auto-embedded via `embedAndSeedKnowledge()` during initialization

## Database Schema Highlights

**Key Tables:**
- `users` - Firebase UID, profile, role (user/guide/admin)
- `travel_groups` - Group metadata, destination, travel date
- `group_members` - Membership with approval workflow
- `messages` - Real-time group chat
- `notifications` - Real-time alerts (disruption, suggestions, matches)
- `trip_plans` - Solo trip container
- `trip_stops` - Individual stops within a plan
- `trip_itinerary_items` - Activities per stop
- `solo_posts` - Travel buddy posts with embeddings
- `guides` - Guide profiles with booking history
- `place_knowledge` - Location data with embeddings (RAG source)
- `active_trips` - Flight tracking and disruption state

**RPC Functions:**
- `match_solo_travelers(embedding, count)` - Find compatible buddies
- `match_places(embedding, city, count)` - Find locations for RAG context
- `is_admin(uid)` - Check admin role

## Security & Privacy

- **RLS (Row Level Security):** All tables use RLS to enforce user-level access
- **Firebase Auth:** Email/password + Google OAuth with text-format UIDs
- **Supabase Anon Key:** Public by design, RLS prevents unauthorized access
- **Client-side Secrets:** `VITE_*` variables are visible in browser (expected for frontend-only apps)
- **Server-side Secrets:** `AVIATIONSTACK_KEY` kept server-side via Vercel env variables
- **Production Recommendation:** Move all AI provider calls to backend API layer for true security
