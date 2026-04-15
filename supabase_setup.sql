-- ═══════════════════════════════════════════════════════════════════════
-- OUTFIELD — COMPLETE DATABASE SETUP
-- Run once in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. USERS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text,
  phone      text UNIQUE,
  role       text DEFAULT 'player',
  city       text,
  dob        text,
  age        int,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
-- INSERT covers both fresh signup and upsert (ON CONFLICT DO NOTHING) paths
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

-- Seed a users row for every existing auth user who signed up but has no profile yet.
-- Safe to run: inserts only if the row is missing. Remove this block after first run if desired.
INSERT INTO users (id, name, role)
  SELECT id, email, 'player'
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;

-- ── 2. GROUNDS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grounds (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  area          text,
  city          text,
  description   text,
  amenities     text,
  open_from     text DEFAULT '06:00',
  open_till     text DEFAULT '23:00',
  contact_phone text,
  rating        numeric(3,1) DEFAULT 0,
  img_url       text,
  latitude      numeric,
  longitude     numeric,
  status        text DEFAULT 'pending',
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE grounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grounds_select" ON grounds;
DROP POLICY IF EXISTS "grounds_insert" ON grounds;
DROP POLICY IF EXISTS "grounds_update" ON grounds;
CREATE POLICY "grounds_select" ON grounds FOR SELECT USING (status = 'live' OR auth.uid() = owner_id);
CREATE POLICY "grounds_insert" ON grounds FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "grounds_update" ON grounds FOR UPDATE USING (auth.uid() = owner_id);

-- ── 3. COURTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ground_id          uuid REFERENCES grounds(id) ON DELETE CASCADE,
  name               text NOT NULL,
  sports             text,
  surface_type       text,
  capacity           int DEFAULT 22,
  price_base         numeric DEFAULT 2000,
  price_peak         numeric DEFAULT 2500,
  slot_duration_mins int DEFAULT 120,
  notes              text,
  pricing_type       text DEFAULT 'fixed',
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE courts ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'fixed';
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "courts_select" ON courts;
DROP POLICY IF EXISTS "courts_owner"  ON courts;
CREATE POLICY "courts_select" ON courts FOR SELECT USING (true);
CREATE POLICY "courts_owner"  ON courts FOR ALL USING (
  EXISTS (SELECT 1 FROM grounds g WHERE g.id = courts.ground_id AND g.owner_id = auth.uid())
);

-- ── 4. BOOKINGS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id       uuid REFERENCES courts(id) ON DELETE SET NULL,
  player_id      uuid REFERENCES users(id) ON DELETE CASCADE,
  booking_date   text NOT NULL,
  start_time     text NOT NULL,
  end_time       text NOT NULL,
  total_price    numeric DEFAULT 0,
  player_count   int DEFAULT 1,
  payment_method text DEFAULT 'cash',
  status         text DEFAULT 'confirmed',
  booking_ref    text,
  lfp_on         boolean DEFAULT false,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_player_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_player_select" ON bookings;
DROP POLICY IF EXISTS "bookings_player_update" ON bookings;
DROP POLICY IF EXISTS "bookings_owner_select"  ON bookings;
CREATE POLICY "bookings_player_insert" ON bookings FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "bookings_player_select" ON bookings FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "bookings_player_update" ON bookings FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "bookings_owner_select"  ON bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courts c
    JOIN grounds g ON g.id = c.ground_id
    WHERE c.id = bookings.court_id AND g.owner_id = auth.uid()
  )
);

-- ── 5. REVIEWS ───────────────────────────────────────────────────────
-- This table was missing from the schema but is used by the ratings modal.
CREATE TABLE IF NOT EXISTS reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ground_id  uuid REFERENCES grounds(id) ON DELETE CASCADE,
  player_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ground_id, player_id)
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = player_id);

-- ── 6. FAVOURITES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favourites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ground_id  uuid REFERENCES grounds(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, ground_id)
);
ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favourites_select" ON favourites;
DROP POLICY IF EXISTS "favourites_insert" ON favourites;
DROP POLICY IF EXISTS "favourites_delete" ON favourites;
CREATE POLICY "favourites_select" ON favourites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favourites_insert" ON favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favourites_delete" ON favourites FOR DELETE USING (auth.uid() = user_id);

-- ── 7. ANNOUNCEMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ground_id  uuid REFERENCES grounds(id) ON DELETE CASCADE,
  owner_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message    text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_select" ON announcements;
DROP POLICY IF EXISTS "announcements_insert" ON announcements;
DROP POLICY IF EXISTS "announcements_delete" ON announcements;
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "announcements_insert" ON announcements FOR INSERT WITH CHECK (auth.uid() = owner_id OR true);
CREATE POLICY "announcements_delete" ON announcements FOR DELETE USING (auth.uid() = owner_id);

-- ── 8. BLOCKED SLOTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_slots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id   uuid REFERENCES courts(id) ON DELETE CASCADE,
  ground_id  uuid REFERENCES grounds(id) ON DELETE CASCADE,
  owner_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date       text,
  start_time text,
  end_time   text,
  reason     text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blocked_slots_select" ON blocked_slots;
DROP POLICY IF EXISTS "blocked_slots_insert" ON blocked_slots;
DROP POLICY IF EXISTS "blocked_slots_delete" ON blocked_slots;
CREATE POLICY "blocked_slots_select" ON blocked_slots FOR SELECT USING (true);
CREATE POLICY "blocked_slots_insert" ON blocked_slots FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "blocked_slots_delete" ON blocked_slots FOR DELETE USING (auth.uid() = owner_id);

-- ── 9. FEEDBACK ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name  text,
  user_email text,
  type       text,
  message    text NOT NULL,
  screen     text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feedback_insert" ON feedback;
DROP POLICY IF EXISTS "feedback_select" ON feedback;
CREATE POLICY "feedback_insert" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "feedback_select" ON feedback FOR SELECT USING (true);

-- ── 10. CHAT ROOMS ───────────────────────────────────────────────────
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
CREATE TABLE IF NOT EXISTS chat_rooms (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name        text,
  requester_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name   text,
  matchmaking_type text DEFAULT 'players',
  ground_name      text,
  sport            text,
  date             text,
  time             text,
  request_label    text,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants read rooms"   ON chat_rooms;
DROP POLICY IF EXISTS "Participants insert rooms" ON chat_rooms;
CREATE POLICY "Participants read rooms"   ON chat_rooms FOR SELECT USING (auth.uid() = host_id OR auth.uid() = requester_id);
CREATE POLICY "Participants insert rooms" ON chat_rooms FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- ── 11. CHAT MESSAGES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name text,
  message     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants read messages" ON chat_messages;
DROP POLICY IF EXISTS "Participants send messages" ON chat_messages;
CREATE POLICY "Participants read messages" ON chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = chat_messages.room_id
      AND (host_id = auth.uid() OR requester_id = auth.uid())
  )
);
CREATE POLICY "Participants send messages" ON chat_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = chat_messages.room_id
      AND (host_id = auth.uid() OR requester_id = auth.uid())
  )
);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- END OF SETUP SCRIPT
-- ═══════════════════════════════════════════════════════════════════════
