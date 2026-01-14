-- Add foreign key relationships for favorite_books
ALTER TABLE public.favorite_books
ADD CONSTRAINT favorite_books_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.favorite_books
ADD CONSTRAINT favorite_books_book_id_fkey
FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;