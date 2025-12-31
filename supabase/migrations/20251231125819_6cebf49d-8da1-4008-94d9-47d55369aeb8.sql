-- Drop the trigger that depends on rating column
DROP TRIGGER IF EXISTS update_book_rating_on_user_book_change ON public.user_books;

-- Fix rating column to allow 10.0 (DECIMAL(3,1) instead of DECIMAL(2,1))
ALTER TABLE public.user_books 
  ALTER COLUMN rating TYPE DECIMAL(3,1);

-- Recreate the trigger
CREATE TRIGGER update_book_rating_on_user_book_change
  AFTER INSERT OR UPDATE OF rating OR DELETE
  ON public.user_books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_book_average_rating();

-- Add WITH CHECK to UPDATE policies for user_books
DROP POLICY IF EXISTS "Users can update their own user_books" ON public.user_books;
CREATE POLICY "Users can update their own user_books" 
  ON public.user_books FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add WITH CHECK to UPDATE policies for reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" 
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add WITH CHECK to UPDATE policies for review_votes
DROP POLICY IF EXISTS "Users can update their own votes" ON public.review_votes;
CREATE POLICY "Users can update their own votes" 
  ON public.review_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);