
ALTER TABLE public.research_projects REPLICA IDENTITY FULL;
ALTER TABLE public.publications REPLICA IDENTITY FULL;
ALTER TABLE public.collaborations REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.research_projects;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.publications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.collaborations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END$$;
