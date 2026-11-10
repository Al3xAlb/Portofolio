ALTER TABLE public.event_files
  ADD COLUMN caption TEXT CHECK (caption IS NULL OR char_length(caption) <= 300),
  ADD COLUMN caption_generated_at TIMESTAMPTZ;