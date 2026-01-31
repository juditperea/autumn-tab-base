-- Enable realtime for notification-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_comments;