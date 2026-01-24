-- Add custom_cover_url column to user_books for personal cover images
ALTER TABLE public.user_books 
ADD COLUMN custom_cover_url text;

-- Create storage bucket for book covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own covers
CREATE POLICY "Users can upload their own book covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'book-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own covers
CREATE POLICY "Users can update their own book covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'book-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own covers
CREATE POLICY "Users can delete their own book covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'book-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public read access for covers
CREATE POLICY "Book covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');