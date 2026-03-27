CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'guide', 'admin')),
  bio TEXT,
  interests TEXT[],
  preferred_destinations TEXT[],
  travel_style TEXT CHECK (travel_style IN ('budget','mid','luxury')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE travel_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  travel_date DATE NOT NULL,
  description TEXT,
  max_members INT DEFAULT 10,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES travel_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES travel_groups(id),
  action TEXT NOT NULL,
  performed_by UUID REFERENCES users(id),
  target_user UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  city TEXT NOT NULL,
  experience_years INT,
  languages TEXT[],
  price_per_day NUMERIC,
  bio TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  avg_rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guide_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES guides(id),
  group_id UUID REFERENCES travel_groups(id),
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected','completed')),
  booking_date DATE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES travel_groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info','alert','disruption','suggestion','match')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE solo_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  destination TEXT NOT NULL,
  travel_date DATE,
  budget_range TEXT CHECK (budget_range IN ('budget','mid','luxury')),
  interests TEXT[],
  travel_purpose TEXT CHECK (travel_purpose IN ('leisure','business','adventure','cultural')),
  gender_pref TEXT CHECK (gender_pref IN ('any','male','female')),
  profile_embedding VECTOR(1024),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE place_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  place_name TEXT,
  category TEXT CHECK (category IN ('restaurant','cafe','sightseeing','activity','transport','safety','lounge')),
  description TEXT,
  address TEXT,
  budget_level TEXT CHECK (budget_level IN ('budget','mid','luxury')),
  best_time TEXT,
  tags TEXT[],
  content_embedding VECTOR(1024),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE active_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  flight_number TEXT,
  origin TEXT,
  destination TEXT,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','delayed','cancelled','completed')),
  itinerary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION match_places(
  query_embedding VECTOR(1024),
  match_city TEXT,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID, city TEXT, place_name TEXT, category TEXT,
  description TEXT, address TEXT, budget_level TEXT,
  best_time TEXT, tags TEXT[], similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.city, p.place_name, p.category,
         p.description, p.address, p.budget_level,
         p.best_time, p.tags,
         1 - (p.content_embedding <=> query_embedding) AS similarity
  FROM place_knowledge p
  WHERE p.city ILIKE match_city
  ORDER BY p.content_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_solo_travelers(
  query_embedding VECTOR(1024),
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID, user_id TEXT, destination TEXT, travel_date DATE,
  budget_range TEXT, interests TEXT[], travel_purpose TEXT,
  gender_pref TEXT, similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.user_id, p.destination, p.travel_date,
         p.budget_range, p.interests, p.travel_purpose,
         p.gender_pref,
         1 - (p.profile_embedding <=> query_embedding) AS similarity
  FROM solo_posts p
  WHERE p.is_active = TRUE
    AND (
      p.gender_pref = 'any'
      OR p.gender_pref IS NULL
      OR p.gender_pref = (
        SELECT p_sub.gender_pref
        FROM solo_posts p_sub
        WHERE p_sub.user_id = auth.uid()
        LIMIT 1
      )
    )
  ORDER BY p.profile_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u WHERE u.id = uid AND u.role = 'admin'
  );
$$;

CREATE INDEX IF NOT EXISTS idx_place_knowledge_embedding
ON place_knowledge USING ivfflat (content_embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_solo_posts_embedding
ON solo_posts USING ivfflat (profile_embedding vector_cosine_ops)
WITH (lists = 100);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_access ON users
FOR ALL
USING (auth.uid() = id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = id OR is_admin(auth.uid()));

CREATE POLICY groups_member_read ON travel_groups
FOR SELECT
USING (
  is_admin(auth.uid()) OR
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = travel_groups.id
      AND gm.user_id = auth.uid()
      AND gm.status = 'approved'
  )
);

CREATE POLICY groups_owner_write ON travel_groups
FOR ALL
USING (created_by = auth.uid() OR is_admin(auth.uid()))
WITH CHECK (created_by = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY group_members_access ON group_members
FOR ALL
USING (
  is_admin(auth.uid()) OR
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM travel_groups tg
    WHERE tg.id = group_members.group_id
      AND tg.created_by = auth.uid()
  )
)
WITH CHECK (
  is_admin(auth.uid()) OR
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM travel_groups tg
    WHERE tg.id = group_members.group_id
      AND tg.created_by = auth.uid()
  )
);

CREATE POLICY group_logs_read ON group_logs
FOR SELECT
USING (
  is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_logs.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'approved'
  )
);

CREATE POLICY group_logs_write ON group_logs
FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM travel_groups tg
    WHERE tg.id = group_logs.group_id
      AND tg.created_by = auth.uid()
  )
);

CREATE POLICY guides_public_read ON guides
FOR SELECT
USING (is_approved = true OR is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY guides_owner_admin_write ON guides
FOR ALL
USING (user_id = auth.uid() OR is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY guide_bookings_access ON guide_bookings
FOR ALL
USING (
  is_admin(auth.uid()) OR user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM travel_groups tg
    WHERE tg.id = guide_bookings.group_id
      AND tg.created_by = auth.uid()
  )
)
WITH CHECK (
  is_admin(auth.uid()) OR user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM travel_groups tg
    WHERE tg.id = guide_bookings.group_id
      AND tg.created_by = auth.uid()
  )
);

CREATE POLICY messages_group_members ON messages
FOR ALL
USING (
  is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = messages.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'approved'
  )
)
WITH CHECK (
  sender_id = auth.uid() OR is_admin(auth.uid())
);

CREATE POLICY notifications_self_access ON notifications
FOR ALL
USING (user_id = auth.uid() OR is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY solo_posts_self_access ON solo_posts
FOR ALL
USING (user_id = auth.uid() OR is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY place_knowledge_read_all ON place_knowledge
FOR SELECT
USING (true);

CREATE POLICY place_knowledge_admin_write ON place_knowledge
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY active_trips_self_access ON active_trips
FOR ALL
USING (user_id = auth.uid() OR is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

-- Multi-stop trip planner tables (active_trips kept for backward compatibility)
CREATE TABLE IF NOT EXISTS trip_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'My Trip',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_budget NUMERIC,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES trip_plans(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  stop_order INTEGER NOT NULL,
  city TEXT NOT NULL,
  destination_detail TEXT,
  arrival_date DATE,
  departure_date DATE,
  flight_number TEXT,
  flight_status TEXT DEFAULT 'scheduled' CHECK (flight_status IN ('scheduled','delayed','cancelled','completed')),
  flight_delay_minutes INTEGER DEFAULT 0,
  purpose TEXT CHECK (purpose IN ('leisure','business','adventure','cultural','transit')),
  budget_for_stop NUMERIC,
  preferences TEXT[],
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES trip_plans(id) ON DELETE CASCADE,
  stop_id UUID REFERENCES trip_stops(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  item_order INTEGER NOT NULL,
  item_type TEXT CHECK (item_type IN ('flight','activity','food','sightseeing','hotel','transport','free_time','meeting')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  duration_minutes INTEGER,
  budget_estimate NUMERIC,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  is_ai_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trip_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own trip_plans" ON trip_plans
  FOR ALL USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users manage own trip_stops" ON trip_stops
  FOR ALL USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users manage own trip_itinerary_items" ON trip_itinerary_items
  FOR ALL USING (user_id::text = auth.uid()::text);

-- Demo mode policies for Firebase Auth integration (Supabase auth.uid() is null with Firebase tokens)
GRANT ALL ON trip_plans TO anon, authenticated;
GRANT ALL ON trip_stops TO anon, authenticated;
GRANT ALL ON trip_itinerary_items TO anon, authenticated;

DROP POLICY IF EXISTS "Users manage own trip_plans" ON trip_plans;
DROP POLICY IF EXISTS "Users manage own trip_stops" ON trip_stops;
DROP POLICY IF EXISTS "Users manage own trip_itinerary_items" ON trip_itinerary_items;

CREATE POLICY trip_plans_demo_all_access ON trip_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY trip_stops_demo_all_access ON trip_stops
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY trip_itinerary_items_demo_all_access ON trip_itinerary_items
  FOR ALL
  USING (true)
  WITH CHECK (true);
