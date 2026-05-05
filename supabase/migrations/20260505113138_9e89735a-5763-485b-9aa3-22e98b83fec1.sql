CREATE TABLE IF NOT EXISTS public.github_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner TEXT NOT NULL DEFAULT '',
  repo TEXT NOT NULL DEFAULT '',
  branch TEXT NOT NULL DEFAULT 'main',
  pat TEXT NOT NULL DEFAULT '',
  uploads_path TEXT NOT NULL DEFAULT 'public/uploads',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed a single row if empty
INSERT INTO public.github_settings (owner, repo, branch)
SELECT '', '', 'main'
WHERE NOT EXISTS (SELECT 1 FROM public.github_settings);

ALTER TABLE public.github_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view github settings"
ON public.github_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update github settings"
ON public.github_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert github settings"
ON public.github_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));