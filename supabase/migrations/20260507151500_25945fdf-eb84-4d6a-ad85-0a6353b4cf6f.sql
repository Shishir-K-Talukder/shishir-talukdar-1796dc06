CREATE TABLE IF NOT EXISTS public.analytics_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ga_measurement_id text NOT NULL DEFAULT '',
  gsc_verification text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read analytics_settings" ON public.analytics_settings FOR SELECT USING (true);
CREATE POLICY "Admins insert analytics_settings" ON public.analytics_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update analytics_settings" ON public.analytics_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete analytics_settings" ON public.analytics_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_analytics_settings_updated_at BEFORE UPDATE ON public.analytics_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.analytics_settings (ga_measurement_id, gsc_verification, enabled) VALUES ('', '', false);