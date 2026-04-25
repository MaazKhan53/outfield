-- ═══════════════════════════════════════════════════════════════════════
-- OUTFIELD — COMPLETE DATABASE SETUP
-- Paste the entire file into Supabase SQL Editor and click Run.
-- Safe to re-run on an existing database — nothing is dropped except
-- old RLS policies which are immediately recreated below.
-- ═══════════════════════════════════════════════════════════════════════


-- ── 1. USERS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text,
  phone          text UNIQUE,
  role           text DEFAULT 'player',
  city           text,
  dob            text,
  age            int,
  payment_number text,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_number text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cancellation_count integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_softbanned boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cancel_strikes integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_until timestamptz;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
-- Players update own row; admins can update is_softbanned on any row via RPC below.
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

-- ── Admin RPC: unban a player (runs with SECURITY DEFINER to bypass RLS) ──────
CREATE OR REPLACE FUNCTION admin_unban_user(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT role FROM users WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE users SET is_softbanned = false, cancellation_count = 0 WHERE id = target_user_id;
END;
$$;

-- Create a profile row for any auth user who signed up before this table existed.
-- Runs safely on every re-run — inserts only missing rows.
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
  status            text DEFAULT 'pending',
  advance_required  int DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);
ALTER TABLE grounds ADD COLUMN IF NOT EXISTS advance_required int DEFAULT 0;
ALTER TABLE grounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grounds_select" ON grounds;
DROP POLICY IF EXISTS "grounds_insert" ON grounds;
DROP POLICY IF EXISTS "grounds_update" ON grounds;
-- Owners always see their own grounds regardless of status.
-- Players only see live grounds.
CREATE POLICY "grounds_select" ON grounds FOR SELECT USING (status = 'live' OR auth.uid() = owner_id);
CREATE POLICY "grounds_insert" ON grounds FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "grounds_update" ON grounds FOR UPDATE USING (auth.uid() = owner_id);

-- Trim leading/trailing whitespace from status on every write so that
-- manually-entered values like 'live\r\n' don't silently break RLS filters.
CREATE OR REPLACE FUNCTION trim_grounds_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.status := regexp_replace(NEW.status, '\s+$', '');
  NEW.status := regexp_replace(NEW.status, '^\s+', '');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_trim_grounds_status ON grounds;
CREATE TRIGGER trg_trim_grounds_status
  BEFORE INSERT OR UPDATE ON grounds
  FOR EACH ROW EXECUTE FUNCTION trim_grounds_status();


-- ── 3. COURTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ground_id          uuid REFERENCES grounds(id) ON DELETE CASCADE,
  name               text NOT NULL,
  sports             text,
  surface            text,
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
-- Everyone can read courts (needed for slot generation and ground detail screen).
CREATE POLICY "courts_select" ON courts FOR SELECT USING (true);
-- Owners can insert / update / delete their own courts.
CREATE POLICY "courts_owner" ON courts FOR ALL USING (
  EXISTS (SELECT 1 FROM grounds g WHERE g.id = courts.ground_id AND g.owner_id = auth.uid())
);


-- ── 4. BOOKINGS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id       uuid REFERENCES courts(id) ON DELETE SET NULL,
  player_id      uuid REFERENCES users(id)  ON DELETE CASCADE,
  booking_date   text NOT NULL,  -- stored as "Mon D" label (e.g. "Apr 20")
  start_time     text NOT NULL,
  end_time       text NOT NULL,
  total_price    numeric DEFAULT 0,
  player_count   int DEFAULT 1,
  payment_method  text DEFAULT 'cash',
  status          text DEFAULT 'confirmed',
  booking_ref     text,
  lfp_on          boolean DEFAULT false,
  transaction_id  text,
  advance_paid    numeric DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transaction_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS advance_paid numeric DEFAULT 0;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_player_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_player_select" ON bookings;
DROP POLICY IF EXISTS "bookings_player_update" ON bookings;
DROP POLICY IF EXISTS "bookings_owner_select"  ON bookings;
CREATE POLICY "bookings_player_insert" ON bookings FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "bookings_player_select" ON bookings FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "bookings_player_update" ON bookings FOR UPDATE USING (auth.uid() = player_id);
-- Owners can read all bookings for their courts (for the Register tab).
CREATE POLICY "bookings_owner_select" ON bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courts c
    JOIN grounds g ON g.id = c.ground_id
    WHERE c.id = bookings.court_id AND g.owner_id = auth.uid()
  )
);


-- ── 5. REVIEWS ───────────────────────────────────────────────────────
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
-- Only the owner sees their own announcements.
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (auth.uid() = owner_id);
-- Any logged-in user can insert (players trigger booking notifications to owners).
CREATE POLICY "announcements_insert" ON announcements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "announcements_delete" ON announcements FOR DELETE USING (auth.uid() = owner_id);


-- ── 8. BLOCKED SLOTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_slots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id   uuid REFERENCES courts(id)      ON DELETE CASCADE,
  ground_id  uuid REFERENCES grounds(id)     ON DELETE CASCADE,
  owner_id   uuid REFERENCES auth.users(id)  ON DELETE CASCADE,
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
-- Everyone can read blocked slots (needed so players see unavailable slots).
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
-- Anyone (including anonymous users) can submit feedback.
CREATE POLICY "feedback_insert" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "feedback_select" ON feedback FOR SELECT USING (true);


-- ── 10. CHAT ROOMS ───────────────────────────────────────────────────
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


-- ── 12. STORAGE BUCKET FOR GROUND PHOTOS ─────────────────────────────
-- Creates the bucket used by the owner listing form photo upload.
-- If it already exists this is a no-op.
INSERT INTO storage.buckets (id, name, public)
VALUES ('ground-images', 'ground-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "ground_images_select" ON storage.objects;
DROP POLICY IF EXISTS "ground_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "ground_images_delete" ON storage.objects;

CREATE POLICY "ground_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'ground-images');

CREATE POLICY "ground_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ground-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "ground_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'ground-images' AND auth.uid() IS NOT NULL);


-- ═══════════════════════════════════════════════════════════════════════
-- END OF SETUP SCRIPT
-- ═══════════════════════════════════════════════════════════════════════
