-- Add hidden column to videos table for hiding projects from public view
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;
