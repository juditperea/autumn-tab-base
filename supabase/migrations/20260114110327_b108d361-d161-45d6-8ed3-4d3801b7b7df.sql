-- Add theme_color to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_color text DEFAULT 'orange';

-- Add reading challenge columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reading_goal integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reading_goal_year integer DEFAULT NULL;

-- Create favorite_books table
CREATE TABLE public.favorite_books (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  book_id uuid NOT NULL,
  position integer NOT NULL CHECK (position >= 1 AND position <= 4),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, position),
  UNIQUE(user_id, book_id)
);

-- Enable RLS
ALTER TABLE public.favorite_books ENABLE ROW LEVEL SECURITY;

-- Policies for favorite_books
CREATE POLICY "Favorite books are viewable by everyone"
ON public.favorite_books FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own favorite books"
ON public.favorite_books FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite books"
ON public.favorite_books FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite books"
ON public.favorite_books FOR DELETE
USING (auth.uid() = user_id);