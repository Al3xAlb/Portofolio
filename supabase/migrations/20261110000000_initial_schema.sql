-- Schema for Little Masonry Studio / Alex Alb Portfolio

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Contact Messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date,
  is_private boolean NOT NULL DEFAULT false,
  cover_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Event Access Keys
CREATE TABLE IF NOT EXISTS public.event_access_keys (
  event_id uuid PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  access_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Event Files
CREATE TABLE IF NOT EXISTS public.event_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  caption text,
  caption_generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Portfolio Photos
CREATE TABLE IF NOT EXISTS public.portfolio_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  source_url text,
  storage_path text,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events (event_date DESC NULLS LAST, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_files_event_id ON public.event_files (event_id);
CREATE INDEX IF NOT EXISTS idx_event_files_sort_order ON public.event_files (event_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_project_id ON public.portfolio_photos (project_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_created_at ON public.portfolio_photos (created_at ASC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_role, _user_id);
$$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_access_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to ensure clean apply
DO $$ BEGIN
  -- contact_messages
  DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
  DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
  DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
  DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;

  -- events
  DROP POLICY IF EXISTS "Public can view public events or admins can view all" ON public.events;
  DROP POLICY IF EXISTS "Admins can manage events" ON public.events;

  -- event_access_keys
  DROP POLICY IF EXISTS "Admins can manage event access keys" ON public.event_access_keys;

  -- event_files
  DROP POLICY IF EXISTS "Public can view files for public events or admins can view all" ON public.event_files;
  DROP POLICY IF EXISTS "Admins can manage event files" ON public.event_files;

  -- portfolio_photos
  DROP POLICY IF EXISTS "Anyone can view portfolio photos" ON public.portfolio_photos;
  DROP POLICY IF EXISTS "Admins can insert portfolio photos" ON public.portfolio_photos;
  DROP POLICY IF EXISTS "Admins can update portfolio photos" ON public.portfolio_photos;
  DROP POLICY IF EXISTS "Admins can delete portfolio photos" ON public.portfolio_photos;

  -- user_roles
  DROP POLICY IF EXISTS "Users can read own role or admins can read all" ON public.user_roles;
END $$;

-- Policies for contact_messages
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.has_role('admin', auth.uid()));

CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (public.has_role('admin', auth.uid()));

CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (public.has_role('admin', auth.uid()));

-- Policies for events
CREATE POLICY "Public can view public events or admins can view all"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (is_private = false OR (auth.role() = 'authenticated' AND public.has_role('admin', auth.uid())));

CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  TO authenticated
  USING (public.has_role('admin', auth.uid()))
  WITH CHECK (public.has_role('admin', auth.uid()));

-- Policies for event_access_keys
CREATE POLICY "Admins can manage event access keys"
  ON public.event_access_keys FOR ALL
  TO authenticated
  USING (public.has_role('admin', auth.uid()))
  WITH CHECK (public.has_role('admin', auth.uid()));

-- Policies for event_files
CREATE POLICY "Public can view files for public events or admins can view all"
  ON public.event_files FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_files.event_id
        AND (events.is_private = false OR (auth.role() = 'authenticated' AND public.has_role('admin', auth.uid())))
    )
  );

CREATE POLICY "Admins can manage event files"
  ON public.event_files FOR ALL
  TO authenticated
  USING (public.has_role('admin', auth.uid()))
  WITH CHECK (public.has_role('admin', auth.uid()));

-- Policies for portfolio_photos
CREATE POLICY "Anyone can view portfolio photos"
  ON public.portfolio_photos FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert portfolio photos"
  ON public.portfolio_photos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role('admin', auth.uid()));

CREATE POLICY "Admins can update portfolio photos"
  ON public.portfolio_photos FOR UPDATE
  TO authenticated
  USING (public.has_role('admin', auth.uid()))
  WITH CHECK (public.has_role('admin', auth.uid()));

CREATE POLICY "Admins can delete portfolio photos"
  ON public.portfolio_photos FOR DELETE
  TO authenticated
  USING (public.has_role('admin', auth.uid()));

-- Policies for user_roles
CREATE POLICY "Users can read own role or admins can read all"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role('admin', auth.uid()));

-- Storage Buckets Configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-photos', 'portfolio-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-files', 'event-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage Policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view portfolio photos" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can manage portfolio photo objects" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view public event files or admins can view all" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can manage event files objects" ON storage.objects;
END $$;

CREATE POLICY "Public can view portfolio photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'portfolio-photos');

CREATE POLICY "Admins can manage portfolio photo objects"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'portfolio-photos' AND public.has_role('admin', auth.uid()))
  WITH CHECK (bucket_id = 'portfolio-photos' AND public.has_role('admin', auth.uid()));

CREATE POLICY "Public can view public event files or admins can view all"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'event-files' AND (
      public.has_role('admin', auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id::text = (storage.foldername(name))[1]
          AND events.is_private = false
      )
    )
  );

CREATE POLICY "Admins can manage event files objects"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'event-files' AND public.has_role('admin', auth.uid()))
  WITH CHECK (bucket_id = 'event-files' AND public.has_role('admin', auth.uid()));
