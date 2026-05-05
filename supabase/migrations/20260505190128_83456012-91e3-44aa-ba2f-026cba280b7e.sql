
-- Remove overly broad authenticated storage policies (admin policies remain)
DROP POLICY IF EXISTS "Authenticated users can upload site images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update site images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete site images" ON storage.objects;

-- Remove duplicate public read (keep "Public read site-images")
DROP POLICY IF EXISTS "Anyone can view site images" ON storage.objects;

-- Restrict has_role function execution (RLS policies still work as definer)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
