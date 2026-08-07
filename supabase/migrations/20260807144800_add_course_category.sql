-- Add category column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category text;
