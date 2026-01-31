-- Create table for activity likes
CREATE TABLE public.activity_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

-- Create table for activity comments
CREATE TABLE public.activity_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

-- Activity likes policies
CREATE POLICY "Activity likes are viewable by everyone"
ON public.activity_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like activities"
ON public.activity_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike activities"
ON public.activity_likes FOR DELETE
USING (auth.uid() = user_id);

-- Activity comments policies
CREATE POLICY "Activity comments are viewable by everyone"
ON public.activity_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON public.activity_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.activity_comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.activity_comments FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on activity_comments
CREATE TRIGGER update_activity_comments_updated_at
BEFORE UPDATE ON public.activity_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();