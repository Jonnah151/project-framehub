/*
# FrameHub Smart Printing & Branding Platform — Core Schema

## Purpose
Multi-tenant platform for photography/videography bookings, printing & branding orders,
file uploads, mock payments, and notifications. Users have one of five roles:
Customer, Admin, Designer, Photographer, Delivery Staff.

## New Tables
1. `profiles` — extends auth.users with full_name, role, phone, avatar_url.
2. `services` — catalog of bookable/printable services (category, price, description).
3. `orders` — printing & branding orders placed by customers (status, assigned staff).
4. `order_files` — files attached to an order (uploaded to Supabase Storage).
5. `bookings` — photography/videography bookings (date, location, assigned photographer).
6. `payments` — mock payment records for orders and bookings.
7. `notifications` — in-app + mock email notifications per user.

## Security (RLS)
- `profiles`: owner can read/update own row; staff can read all.
- `services`: readable by all authenticated; only admins can write.
- `orders`: customers see own orders; staff see all; owner or admin can mutate.
- `order_files`: scoped through parent order ownership.
- `bookings`: customers see own bookings; staff see all.
- `payments`: customers see own payments; admins see all.
- `notifications`: each user sees only their own notifications.

## Notes
- `user_id` columns default to `auth.uid()` so client inserts omitting the owner succeed.
- Status enums constrain order/booking/payment states.
*/

-- ===== Enums =====
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'admin', 'designer', 'photographer', 'delivery');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM ('order', 'booking');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== Profiles =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'customer',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_staff_user() RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off, search_path = public AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin','designer','photographer','delivery')
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION is_admin_user() RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off, search_path = public AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION is_admin_or_photographer() RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off, search_path = public AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin','photographer')
  ) INTO result;
  RETURN result;
END;
$$;

DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON profiles;
CREATE POLICY "profiles_select_own_or_staff" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR is_staff_user()
  );

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (
    auth.uid() = id
    OR is_admin_user()
  ) WITH CHECK (
    auth.uid() = id
    OR is_admin_user()
  );

DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE
  TO authenticated USING (
    auth.uid() = id
    OR is_admin_user()
  );

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ===== Services =====
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_select_all" ON services;
CREATE POLICY "services_select_all" ON services FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "services_insert_admin" ON services;
CREATE POLICY "services_insert_admin" ON services FOR INSERT
  TO authenticated WITH CHECK (
    is_admin_user()
  );

DROP POLICY IF EXISTS "services_update_admin" ON services;
CREATE POLICY "services_update_admin" ON services FOR UPDATE
  TO authenticated USING (
    is_admin_user()
  );

DROP POLICY IF EXISTS "services_delete_admin" ON services;
CREATE POLICY "services_delete_admin" ON services FOR DELETE
  TO authenticated USING (
    is_admin_user()
  );

-- ===== Orders =====
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  status order_status NOT NULL DEFAULT 'pending',
  assigned_designer uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_delivery uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own_or_staff" ON orders;
CREATE POLICY "orders_select_own_or_staff" ON orders FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR is_staff_user()
  );

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_owner_or_admin" ON orders;
CREATE POLICY "orders_update_owner_or_admin" ON orders FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR is_admin_user()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR is_admin_user()
  );

DROP POLICY IF EXISTS "orders_delete_owner_or_admin" ON orders;
CREATE POLICY "orders_delete_owner_or_admin" ON orders FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id
    OR is_admin_user()
  );

-- ===== Order Files =====
CREATE TABLE IF NOT EXISTS order_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint DEFAULT 0,
  file_type text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_files_select_owner_or_staff" ON order_files;
CREATE POLICY "order_files_select_owner_or_staff" ON order_files FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_files.order_id
      AND (
        o.user_id = auth.uid()
        OR is_staff_user()
      )
    )
  );

DROP POLICY IF EXISTS "order_files_insert_owner" ON order_files;
CREATE POLICY "order_files_insert_owner" ON order_files FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_files.order_id AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_files_delete_owner_or_admin" ON order_files;
CREATE POLICY "order_files_delete_owner_or_admin" ON order_files FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_files.order_id
      AND (
        o.user_id = auth.uid()
        OR is_admin_user()
      )
    )
  );

-- ===== Bookings =====
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  service_name text NOT NULL DEFAULT '',
  booking_date date NOT NULL,
  booking_time time NOT NULL DEFAULT '09:00',
  location text NOT NULL DEFAULT '',
  status booking_status NOT NULL DEFAULT 'pending',
  assigned_photographer uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_own_or_staff" ON bookings;
CREATE POLICY "bookings_select_own_or_staff" ON bookings FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR is_staff_user()
  );

DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;
CREATE POLICY "bookings_insert_own" ON bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookings_update_owner_or_admin" ON bookings;
CREATE POLICY "bookings_update_owner_or_admin" ON bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR is_admin_or_photographer()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR is_admin_or_photographer()
  );

DROP POLICY IF EXISTS "bookings_delete_owner_or_admin" ON bookings;
CREATE POLICY "bookings_delete_owner_or_admin" ON bookings FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id
    OR is_admin_user()
  );

-- ===== Payments =====
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_type payment_type NOT NULL,
  reference_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status payment_status NOT NULL DEFAULT 'pending',
  method text NOT NULL DEFAULT 'mock_card',
  transaction_id text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own_or_admin" ON payments;
CREATE POLICY "payments_select_own_or_admin" ON payments FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR is_admin_user()
  );

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_update_own_or_admin" ON payments;
CREATE POLICY "payments_update_own_or_admin" ON payments FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR is_admin_user()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR is_admin_user()
  );

-- ===== Notifications =====
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own_or_admin" ON notifications;
CREATE POLICY "notifications_insert_own_or_admin" ON notifications FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR is_admin_user()
  );

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== Indexes =====
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_files_order_id ON order_files(order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ===== updated_at trigger =====
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_bookings_updated ON bookings;
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===== Storage bucket for order files =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-files', 'order-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "order_files_storage_select" ON storage.objects;
CREATE POLICY "order_files_storage_select" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'order-files');

DROP POLICY IF EXISTS "order_files_storage_insert" ON storage.objects;
CREATE POLICY "order_files_storage_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'order-files');

DROP POLICY IF EXISTS "order_files_storage_delete" ON storage.objects;
CREATE POLICY "order_files_storage_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'order-files');