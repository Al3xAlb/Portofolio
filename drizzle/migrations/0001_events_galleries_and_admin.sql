-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- The very first account to sign in becomes the site owner (admin)
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  event_date DATE,
  is_private BOOLEAN NOT NULL DEFAULT false,
  cover_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public events are visible to everyone"
ON public.events FOR SELECT TO anon, authenticated
USING (is_private = false);
CREATE POLICY "Admins can view all events"
ON public.events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Event files
CREATE TABLE public.event_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX event_files_event_id_idx ON public.event_files(event_id, sort_order);
GRANT SELECT ON public.event_files TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_files TO authenticated;
GRANT ALL ON public.event_files TO service_role;
ALTER TABLE public.event_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Files of public events are visible to everyone"
ON public.event_files FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_private = false));
CREATE POLICY "Admins can view all event files"
ON public.event_files FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can add event files"
ON public.event_files FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update event files"
ON public.event_files FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete event files"
ON public.event_files FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Access keys for private events (admin only; looked up server-side when a visitor unlocks)
CREATE TABLE public.event_access_keys (
  event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  access_key TEXT NOT NULL UNIQUE CHECK (char_length(access_key) BETWEEN 8 AND 64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_access_keys TO authenticated;
GRANT ALL ON public.event_access_keys TO service_role;
ALTER TABLE public.event_access_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access keys"
ON public.event_access_keys FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create access keys"
ON public.event_access_keys FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update access keys"
ON public.event_access_keys FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete access keys"
ON public.event_access_keys FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Storage: files live under event-files/<event_id>/...
CREATE POLICY "Public event files are readable by everyone"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'event-files'
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id::text = (storage.foldername(name))[1] AND e.is_private = false
  )
);
CREATE POLICY "Admins can read all event files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'event-files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can upload event files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update event files in storage"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'event-files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete event files in storage"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'event-files' AND public.has_role(auth.uid(), 'admin'));