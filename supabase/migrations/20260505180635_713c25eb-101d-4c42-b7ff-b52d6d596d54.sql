
-- =========================================================
-- GITHUB SETTINGS: admin-only read (PAT must not leak)
-- =========================================================
DROP POLICY IF EXISTS "Admins can view github settings" ON public.github_settings;
CREATE POLICY "Admins can view github settings"
ON public.github_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- SMTP SETTINGS: admin-only for all operations
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can read smtp_settings" ON public.smtp_settings;
DROP POLICY IF EXISTS "Authenticated users can update smtp_settings" ON public.smtp_settings;
DROP POLICY IF EXISTS "Authenticated users can insert smtp_settings" ON public.smtp_settings;
DROP POLICY IF EXISTS "Authenticated users can delete smtp_settings" ON public.smtp_settings;

CREATE POLICY "Admins read smtp_settings" ON public.smtp_settings
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert smtp_settings" ON public.smtp_settings
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update smtp_settings" ON public.smtp_settings
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete smtp_settings" ON public.smtp_settings
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- USER ROLES: prevent admin enumeration
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Helper: replace permissive write policies with admin-only
-- =========================================================
-- site_content
DROP POLICY IF EXISTS "Authenticated users can insert site_content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated users can update site_content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated users can delete site_content" ON public.site_content;
CREATE POLICY "Admins insert site_content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update site_content" ON public.site_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete site_content" ON public.site_content FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- site_metadata
DROP POLICY IF EXISTS "Authenticated users can insert site_metadata" ON public.site_metadata;
DROP POLICY IF EXISTS "Authenticated users can update site_metadata" ON public.site_metadata;
DROP POLICY IF EXISTS "Authenticated users can delete site_metadata" ON public.site_metadata;
CREATE POLICY "Admins insert site_metadata" ON public.site_metadata FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update site_metadata" ON public.site_metadata FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete site_metadata" ON public.site_metadata FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- site_images
DROP POLICY IF EXISTS "Authenticated users can insert site_images" ON public.site_images;
DROP POLICY IF EXISTS "Authenticated users can update site_images" ON public.site_images;
DROP POLICY IF EXISTS "Authenticated users can delete site_images" ON public.site_images;
CREATE POLICY "Admins insert site_images" ON public.site_images FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update site_images" ON public.site_images FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete site_images" ON public.site_images FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- blog_posts
DROP POLICY IF EXISTS "Authenticated users can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can delete blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can read all blog posts" ON public.blog_posts;
CREATE POLICY "Admins read all blog posts" ON public.blog_posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert blog posts" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update blog posts" ON public.blog_posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete blog posts" ON public.blog_posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- blog_categories
DROP POLICY IF EXISTS "Authenticated users can insert blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Authenticated users can update blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Authenticated users can delete blog categories" ON public.blog_categories;
CREATE POLICY "Admins insert blog categories" ON public.blog_categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update blog categories" ON public.blog_categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete blog categories" ON public.blog_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- research_projects
DROP POLICY IF EXISTS "Authenticated users can insert research_projects" ON public.research_projects;
DROP POLICY IF EXISTS "Authenticated users can update research_projects" ON public.research_projects;
DROP POLICY IF EXISTS "Authenticated users can delete research_projects" ON public.research_projects;
CREATE POLICY "Admins insert research_projects" ON public.research_projects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update research_projects" ON public.research_projects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete research_projects" ON public.research_projects FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- publications
DROP POLICY IF EXISTS "Authenticated users can insert publications" ON public.publications;
DROP POLICY IF EXISTS "Authenticated users can update publications" ON public.publications;
DROP POLICY IF EXISTS "Authenticated users can delete publications" ON public.publications;
CREATE POLICY "Admins insert publications" ON public.publications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update publications" ON public.publications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete publications" ON public.publications FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- collaborations
DROP POLICY IF EXISTS "Authenticated users can insert collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Authenticated users can update collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Authenticated users can delete collaborations" ON public.collaborations;
CREATE POLICY "Admins insert collaborations" ON public.collaborations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update collaborations" ON public.collaborations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete collaborations" ON public.collaborations FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ad_placements
DROP POLICY IF EXISTS "Authenticated users can insert ad placements" ON public.ad_placements;
DROP POLICY IF EXISTS "Authenticated users can update ad placements" ON public.ad_placements;
DROP POLICY IF EXISTS "Authenticated users can delete ad placements" ON public.ad_placements;
CREATE POLICY "Admins insert ad placements" ON public.ad_placements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update ad placements" ON public.ad_placements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete ad placements" ON public.ad_placements FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- contact_submissions: admin-only read/update/delete (insert remains public)
DROP POLICY IF EXISTS "Authenticated users can read submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can update submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can delete submissions" ON public.contact_submissions;
CREATE POLICY "Admins read submissions" ON public.contact_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update submissions" ON public.contact_submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete submissions" ON public.contact_submissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- page_views: admin-only read/delete (insert remains public)
DROP POLICY IF EXISTS "Authenticated users can read page views" ON public.page_views;
DROP POLICY IF EXISTS "Authenticated users can delete page views" ON public.page_views;
CREATE POLICY "Admins read page views" ON public.page_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete page views" ON public.page_views FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- STORAGE: site-images bucket — admin-only writes
-- =========================================================
DROP POLICY IF EXISTS "Public read site-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload site-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update site-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete site-images" ON storage.objects;

CREATE POLICY "Public read site-images" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'site-images');
CREATE POLICY "Admins upload site-images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update site-images" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'site-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete site-images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'site-images' AND public.has_role(auth.uid(),'admin'));

-- =========================================================
-- Restrict EXECUTE on SECURITY DEFINER functions
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public;
