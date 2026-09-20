-- Migration: ISO 25010 and IBM CSUQ System Evaluations, and Automated Data Processing columns

-- 1. Create table for system evaluations
CREATE TABLE IF NOT EXISTS public.system_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  evaluation_type text NOT NULL, -- 'iso_25010' or 'ibm_csuq'
  evaluator_role text NOT NULL DEFAULT 'citizen', -- 'expert_it', 'expert_civil_engineer', 'expert_gis', 'citizen', 'student'
  evaluator_name text,
  overall_mean double precision NOT NULL,
  scores jsonb NOT NULL, -- Key-value map of question/parameter scores
  parameter_means jsonb, -- Map of parameter -> mean for ISO 25010
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.system_evaluations TO authenticated, anon;
GRANT ALL ON public.system_evaluations TO service_role;
ALTER TABLE public.system_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can insert evaluation" ON public.system_evaluations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone authenticated or engineer can view evaluations" ON public.system_evaluations
  FOR SELECT TO authenticated USING (true);

-- 2. Add automated data processing fields to reports table (if not exists)
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS severity_score integer DEFAULT 30;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS auto_classified boolean DEFAULT true;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS automated_notes text;
