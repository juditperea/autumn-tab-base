-- Fix security issues: Add profile visibility and update RLS policies

-- 1. Add visibility column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
CHECK (visibility IN ('public', 'friends_only', 'private'));

-- 2. Fix user_books RLS - Allow viewing based on profile visibility
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own user_books" ON public.user_books;

-- Users can always view their own books
CREATE POLICY "Users can view their own user_books"
ON public.user_books FOR SELECT
USING (auth.uid() = user_id);

-- View books of users with public profiles (authenticated users only)
CREATE POLICY "View books of public profiles"
ON public.user_books FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_books.user_id
    AND profiles.visibility = 'public'
  )
);

-- View books of followed users with friends_only visibility
CREATE POLICY "View books of followed users"
ON public.user_books FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.follows
    WHERE follows.following_id = user_books.user_id
    AND follows.follower_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_books.user_id
    AND profiles.visibility IN ('public', 'friends_only')
  )
);

-- 3. Fix activities RLS - Restrict based on profile visibility
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Activities are viewable by everyone" ON public.activities;

-- Users can view their own activities
CREATE POLICY "Users can view own activities"
ON public.activities FOR SELECT
USING (auth.uid() = user_id);

-- View activities from public profiles (authenticated users only)
CREATE POLICY "View activities from public profiles"
ON public.activities FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = activities.user_id
    AND profiles.visibility = 'public'
  )
);

-- View activities from followed users
CREATE POLICY "View activities from followed users"
ON public.activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.follows
    WHERE follows.following_id = activities.user_id
    AND follows.follower_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = activities.user_id
    AND profiles.visibility IN ('public', 'friends_only')
  )
);