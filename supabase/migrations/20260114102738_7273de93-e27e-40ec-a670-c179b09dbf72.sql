-- Create follows table for friend/following system
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create activity_feed table to store user activities
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('rated_book', 'reviewed_book', 'started_reading', 'finished_book', 'joined_club')),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  rating DECIMAL(3,1),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);
CREATE INDEX idx_activities_user ON public.activities(user_id);
CREATE INDEX idx_activities_created ON public.activities(created_at DESC);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for follows
CREATE POLICY "Users can view all follows" 
ON public.follows FOR SELECT 
USING (true);

CREATE POLICY "Users can follow others" 
ON public.follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
ON public.follows FOR DELETE 
USING (auth.uid() = follower_id);

-- RLS policies for activities
CREATE POLICY "Activities are viewable by everyone" 
ON public.activities FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own activities" 
ON public.activities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" 
ON public.activities FOR DELETE 
USING (auth.uid() = user_id);

-- Function to automatically create activity when user rates a book
CREATE OR REPLACE FUNCTION public.create_rating_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create activity if there's a rating
  IF NEW.rating IS NOT NULL THEN
    -- Check if activity already exists for this user_book
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.rating IS NULL OR OLD.rating != NEW.rating)) THEN
      INSERT INTO public.activities (user_id, activity_type, book_id, rating)
      VALUES (NEW.user_id, 'rated_book', NEW.book_id, NEW.rating)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  -- Create activity when book status changes to 'reading' or 'read'
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    IF NEW.status = 'reading' THEN
      INSERT INTO public.activities (user_id, activity_type, book_id)
      VALUES (NEW.user_id, 'started_reading', NEW.book_id);
    ELSIF NEW.status = 'read' THEN
      INSERT INTO public.activities (user_id, activity_type, book_id, rating)
      VALUES (NEW.user_id, 'finished_book', NEW.book_id, NEW.rating);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create activity when user writes a review
CREATE OR REPLACE FUNCTION public.create_review_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, activity_type, book_id, review_id)
  VALUES (NEW.user_id, 'reviewed_book', NEW.book_id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER on_user_book_change
  AFTER INSERT OR UPDATE ON public.user_books
  FOR EACH ROW
  EXECUTE FUNCTION public.create_rating_activity();

CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.create_review_activity();

-- Add follower/following counts to profiles (computed via queries, no need for columns)