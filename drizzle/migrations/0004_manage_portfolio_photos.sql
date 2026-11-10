CREATE TABLE public.portfolio_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL CHECK (char_length(project_id) BETWEEN 1 AND 100),
  source_url TEXT,
  storage_path TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (source_url IS NOT NULL AND storage_path IS NULL AND is_hidden)
    OR (source_url IS NULL AND storage_path IS NOT NULL AND NOT is_hidden)
  )
);

CREATE UNIQUE INDEX portfolio_photos_source_url_idx
ON public.portfolio_photos(project_id, source_url)
WHERE source_url IS NOT NULL;
CREATE UNIQUE INDEX portfolio_photos_storage_path_idx
ON public.portfolio_photos(storage_path)
WHERE storage_path IS NOT NULL;

GRANT SELECT ON public.portfolio_photos TO anon, authenticated;
GRANT INSERT, DELETE ON public.portfolio_photos TO authenticated;
GRANT ALL ON public.portfolio_photos TO service_role;
ALTER TABLE public.portfolio_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio photo changes are visible to everyone"
ON public.portfolio_photos FOR SELECT TO anon, authenticated
USING (true);
CREATE POLICY "Admins can manage portfolio photo changes"
ON public.portfolio_photos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-photos',
  'portfolio-photos',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Portfolio photos are publicly readable"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'portfolio-photos');
CREATE POLICY "Admins can upload portfolio photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'portfolio-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update portfolio photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'portfolio-photos' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'portfolio-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete portfolio photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'portfolio-photos' AND public.has_role(auth.uid(), 'admin'));
