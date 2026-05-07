-- AI provider settings
CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'lovable',
  api_key text NOT NULL DEFAULT '',
  base_url text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read ai_settings" ON public.ai_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert ai_settings" ON public.ai_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update ai_settings" ON public.ai_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete ai_settings" ON public.ai_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Plagiarism provider settings
CREATE TABLE public.plagiarism_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'copyscape',
  api_key text NOT NULL DEFAULT '',
  api_username text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plagiarism_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read plagiarism_settings" ON public.plagiarism_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert plagiarism_settings" ON public.plagiarism_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update plagiarism_settings" ON public.plagiarism_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete plagiarism_settings" ON public.plagiarism_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Blog post revision history
CREATE TABLE public.blog_post_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  seo_title text NOT NULL DEFAULT '',
  focus_keyword text NOT NULL DEFAULT '',
  cover_image_url text,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_revisions_post_created ON public.blog_post_revisions(post_id, created_at DESC);
ALTER TABLE public.blog_post_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read revisions" ON public.blog_post_revisions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert revisions" ON public.blog_post_revisions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete revisions" ON public.blog_post_revisions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));