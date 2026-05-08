
-- Simple: just add a text category column to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
