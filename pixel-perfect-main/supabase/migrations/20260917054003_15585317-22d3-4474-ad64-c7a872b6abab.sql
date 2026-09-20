CREATE TYPE public.app_role AS ENUM ('citizen','engineer');
CREATE TYPE public.damage_type AS ENUM ('pothole','road_crack','surface_erosion','uneven_pavement','road_subsidence','other');
CREATE TYPE public.severity_level AS ENUM ('low','medium','high','critical');
CREATE TYPE public.report_status AS ENUM ('submitted','under_review','verified','scheduled','in_progress','completed','rejected');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'engineer'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'engineer'));

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text NOT NULL UNIQUE DEFAULT ('RDR-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
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
  status public.report_status NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or engineer all reports" ON public.reports FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'engineer'));
CREATE POLICY "Citizens create own reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Engineers update reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'engineer')) WITH CHECK (public.has_role(auth.uid(),'engineer'));
CREATE POLICY "Engineers delete reports" ON public.reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'engineer'));

CREATE TABLE public.maintenance_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  status public.report_status NOT NULL,
  engineer_notes text,
  repair_date date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.maintenance_updates TO authenticated;
GRANT ALL ON public.maintenance_updates TO service_role;
ALTER TABLE public.maintenance_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read updates for visible reports" ON public.maintenance_updates FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'engineer') OR EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.user_id = auth.uid())
);
CREATE POLICY "Engineers add updates" ON public.maintenance_updates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'engineer'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Engineers create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'engineer'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.email,''), NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'citizen') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.on_report_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE label text;
BEGIN
  NEW.updated_at := now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.maintenance_updates (report_id, status, created_by) VALUES (NEW.id, NEW.status, auth.uid());
    label := CASE NEW.status
      WHEN 'under_review' THEN 'is now under review'
      WHEN 'verified' THEN 'has been verified'
      WHEN 'scheduled' THEN 'has been scheduled for repair'
      WHEN 'in_progress' THEN 'repair is now in progress'
      WHEN 'completed' THEN 'repair has been completed'
      WHEN 'rejected' THEN 'has been rejected'
      ELSE 'was updated' END;
    INSERT INTO public.notifications (user_id, report_id, message)
    VALUES (NEW.user_id, NEW.id, 'Report ' || NEW.reference_code || ' ' || label || '.');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER reports_status_change BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.on_report_status_change();

CREATE OR REPLACE FUNCTION public.on_report_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.maintenance_updates (report_id, status, created_by) VALUES (NEW.id, NEW.status, NEW.user_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER reports_created AFTER INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.on_report_created();

CREATE POLICY "Authenticated read damage photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'damage-photos');
CREATE POLICY "Authenticated upload damage photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'damage-photos');