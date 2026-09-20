-- ==============================================================================
-- BORONGAN ROADWATCH: COMPLETE SUPABASE PRODUCTION DATABASE SCHEMA
-- City Government of Borongan · City Engineering Office · DPWH Partnership
-- ==============================================================================
-- This script contains all necessary types, tables, row-level security (RLS)
-- policies, storage bucket configurations, and automated triggers.
-- To apply: Copy and paste this script directly into your Supabase SQL Editor.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUM TYPES
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('citizen', 'engineer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.damage_type AS ENUM (
    'pothole',
    'road_crack',
    'surface_erosion',
    'uneven_pavement',
    'road_subsidence',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.severity_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM (
    'submitted',
    'under_review',
    'verified',
    'scheduled',
    'in_progress',
    'completed',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  role public.app_role NOT NULL DEFAULT 'citizen',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. USER ROLES TABLE (RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'citizen',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 5. ROLE CHECK FUNCTION (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role
  );
$$;

-- 6. ROAD DAMAGE REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text NOT NULL UNIQUE DEFAULT ('RDR-' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 6))),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  road_name text NOT NULL,
  barangay text NOT NULL,
  photo_url text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  damage_type public.damage_type NOT NULL DEFAULT 'other',
  severity_level public.severity_level NOT NULL DEFAULT 'low',
  severity_score integer DEFAULT 30,
  auto_classified boolean DEFAULT true,
  automated_notes text,
  status public.report_status NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create spatial index coordinates & filters for high-speed GIS queries
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_barangay ON public.reports(barangay);
CREATE INDEX IF NOT EXISTS idx_reports_coords ON public.reports(latitude, longitude);

-- 7. MAINTENANCE UPDATES & AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.maintenance_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  status public.report_status NOT NULL,
  engineer_notes text,
  repair_date date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_maintenance_report_id ON public.maintenance_updates(report_id);

-- 8. CITIZEN NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ==============================================================================
-- 9. AUTOMATED DATABASE TRIGGERS & PROCEDURES
-- ==============================================================================

-- A. Automatically create profile & citizen role on user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'phone',
    'citizen'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Automatically create first audit log entry upon report submission
CREATE OR REPLACE FUNCTION public.on_report_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.maintenance_updates (report_id, status, created_by)
  VALUES (NEW.id, NEW.status, NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_created ON public.reports;
CREATE TRIGGER reports_created
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.on_report_created();

-- C. Automatically update timestamp, record history, and notify citizen on status changes
CREATE OR REPLACE FUNCTION public.on_report_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  status_label text;
BEGIN
  NEW.updated_at := now();

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.maintenance_updates (report_id, status, created_by)
    VALUES (NEW.id, NEW.status, auth.uid());

    status_label := CASE NEW.status
      WHEN 'under_review' THEN 'is now under review by City Engineers'
      WHEN 'verified' THEN 'has been verified on-site'
      WHEN 'scheduled' THEN 'has been scheduled for repair'
      WHEN 'in_progress' THEN 'is actively under repair'
      WHEN 'completed' THEN 'has been successfully repaired'
      WHEN 'rejected' THEN 'could not be verified or is outside scope'
      ELSE 'status was updated'
    END;

    INSERT INTO public.notifications (user_id, report_id, message)
    VALUES (
      NEW.user_id,
      NEW.id,
      'Incident ' || NEW.reference_code || ' (' || NEW.road_name || ') ' || status_label || '.'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_status_change ON public.reports;
CREATE TRIGGER reports_status_change
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.on_report_status_change();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'engineer'));

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- User Roles Policies
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'engineer'));

-- Reports Policies
DROP POLICY IF EXISTS "Read own or engineer all reports" ON public.reports;
CREATE POLICY "Read own or engineer all reports" ON public.reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'engineer'));

DROP POLICY IF EXISTS "Public read verified reports for map" ON public.reports;
CREATE POLICY "Public read verified reports for map" ON public.reports
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "Citizens create own reports" ON public.reports;
CREATE POLICY "Citizens create own reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Engineers update reports" ON public.reports;
CREATE POLICY "Engineers update reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'engineer'))
  WITH CHECK (public.has_role(auth.uid(), 'engineer'));

DROP POLICY IF EXISTS "Engineers delete reports" ON public.reports;
CREATE POLICY "Engineers delete reports" ON public.reports
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'engineer'));

-- Maintenance Updates Policies
DROP POLICY IF EXISTS "Read updates for visible reports" ON public.maintenance_updates;
CREATE POLICY "Read updates for visible reports" ON public.maintenance_updates
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'engineer') OR
    EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Engineers add updates" ON public.maintenance_updates;
CREATE POLICY "Engineers add updates" ON public.maintenance_updates
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'engineer'));

-- Notifications Policies
DROP POLICY IF EXISTS "Read own notifications" ON public.notifications;
CREATE POLICY "Read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Update own notifications" ON public.notifications;
CREATE POLICY "Update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Engineers create notifications" ON public.notifications;
CREATE POLICY "Engineers create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'engineer'));

-- ==============================================================================
-- 11. STORAGE BUCKET CONFIGURATION (DAMAGE PHOTOS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('damage-photos', 'damage-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read damage photos" ON storage.objects;
CREATE POLICY "Public read damage photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'damage-photos');

DROP POLICY IF EXISTS "Authenticated upload damage photos" ON storage.objects;
CREATE POLICY "Authenticated upload damage photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'damage-photos');

DROP POLICY IF EXISTS "Authenticated update own damage photos" ON storage.objects;
CREATE POLICY "Authenticated update own damage photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'damage-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ==============================================================================
-- 12. PERMISSIONS GRANT
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Revoke dangerous direct execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_report_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_report_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- ==============================================================================
-- 13. OPTIONAL: HELPER TO PROMOTE AN ACCOUNT TO CITY ENGINEER
-- ==============================================================================
-- Replace with the engineer's email address after they register:
--
-- UPDATE public.profiles SET role = 'engineer' WHERE email = 'engineer@borongan.gov.ph';
-- INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'engineer' FROM auth.users WHERE email = 'engineer@borongan.gov.ph'
--   ON CONFLICT (user_id, role) DO NOTHING;
-- ==============================================================================
