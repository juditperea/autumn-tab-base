-- ===========================================
-- PHASE 2: Book Database Schema
-- ===========================================

-- 1. Create reading_status enum
CREATE TYPE public.reading_status AS ENUM ('to_read', 'reading', 'read', 'dnf');

-- ===========================================
-- 2. BOOKS TABLE (Read-only for users)
-- ===========================================
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  cover_url TEXT,
  isbn10 TEXT,
  isbn13 TEXT UNIQUE,
  genres TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'es',
  page_count INTEGER,
  published_year INTEGER,
  average_rating DECIMAL(3,1) DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Books are publicly readable
CREATE POLICY "Books are viewable by everyone"
ON public.books FOR SELECT
USING (true);

-- No INSERT/UPDATE/DELETE policies for regular users
-- Only service_role can modify books (via Edge Functions)

-- ===========================================
-- 3. USER_BOOKS TABLE (User's shelves)
-- ===========================================
CREATE TABLE public.user_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  status public.reading_status NOT NULL DEFAULT 'to_read',
  rating DECIMAL(2,1) CHECK (rating IS NULL OR (rating >= 1.0 AND rating <= 10.0)),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  progress_pages INTEGER DEFAULT 0,
  started_at DATE,
  finished_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Enable RLS
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;

-- Users can view their own books
CREATE POLICY "Users can view their own user_books"
ON public.user_books FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own books
CREATE POLICY "Users can add books to their shelf"
ON public.user_books FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own books
CREATE POLICY "Users can update their own user_books"
ON public.user_books FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own books
CREATE POLICY "Users can remove books from their shelf"
ON public.user_books FOR DELETE
USING (auth.uid() = user_id);

-- ===========================================
-- 4. REVIEWS TABLE
-- ===========================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 5000),
  contains_spoiler BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'es',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are publicly readable
CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
USING (true);

-- Users can create their own reviews
CREATE POLICY "Users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

-- ===========================================
-- 5. REVIEW_VOTES TABLE
-- ===========================================
CREATE TABLE public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, review_id)
);

-- Enable RLS
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Votes are publicly readable (for counting)
CREATE POLICY "Review votes are viewable by everyone"
ON public.review_votes FOR SELECT
USING (true);

-- Users can create their own votes
CREATE POLICY "Users can vote on reviews"
ON public.review_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update their own votes"
ON public.review_votes FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can remove their votes"
ON public.review_votes FOR DELETE
USING (auth.uid() = user_id);

-- ===========================================
-- 6. TRIGGERS
-- ===========================================

-- Trigger for books updated_at
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for user_books updated_at
CREATE TRIGGER update_user_books_updated_at
BEFORE UPDATE ON public.user_books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for reviews updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- 7. Function to update book average rating
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_book_average_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.books
  SET 
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM public.user_books
      WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
      AND rating IS NOT NULL
    ),
    ratings_count = (
      SELECT COUNT(*)
      FROM public.user_books
      WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
      AND rating IS NOT NULL
    )
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update average rating when user_books changes
CREATE TRIGGER update_book_rating_on_user_book_change
AFTER INSERT OR UPDATE OF rating OR DELETE ON public.user_books
FOR EACH ROW
EXECUTE FUNCTION public.update_book_average_rating();

-- ===========================================
-- 8. INDEXES for performance
-- ===========================================
CREATE INDEX idx_books_isbn13 ON public.books(isbn13);
CREATE INDEX idx_books_genres ON public.books USING GIN(genres);
CREATE INDEX idx_user_books_user_id ON public.user_books(user_id);
CREATE INDEX idx_user_books_book_id ON public.user_books(book_id);
CREATE INDEX idx_user_books_status ON public.user_books(status);
CREATE INDEX idx_reviews_book_id ON public.reviews(book_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_review_votes_review_id ON public.review_votes(review_id);

-- ===========================================
-- 9. MOCK DATA - Popular Books
-- ===========================================
INSERT INTO public.books (title, authors, description, cover_url, isbn13, genres, language, page_count, published_year, source) VALUES
(
  'Cien años de soledad',
  ARRAY['Gabriel García Márquez'],
  'La saga de la familia Buendía en el mítico pueblo de Macondo. Una obra maestra del realismo mágico que narra siete generaciones de una estirpe condenada a cien años de soledad.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327881361i/320.jpg',
  '9780307474728',
  ARRAY['Ficción', 'Realismo mágico', 'Clásicos'],
  'es',
  417,
  1967,
  'manual'
),
(
  '1984',
  ARRAY['George Orwell'],
  'En un futuro distópico, Winston Smith trabaja para el Ministerio de la Verdad reescribiendo la historia. Una crítica atemporal al totalitarismo y la vigilancia masiva.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg',
  '9780451524935',
  ARRAY['Ficción', 'Distopía', 'Ciencia ficción', 'Clásicos'],
  'en',
  328,
  1949,
  'manual'
),
(
  'El señor de los anillos: La comunidad del anillo',
  ARRAY['J.R.R. Tolkien'],
  'Frodo Bolsón hereda el Anillo Único y debe emprender un viaje para destruirlo en las llamas del Monte del Destino, antes de que el Señor Oscuro lo recupere.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654215925i/61215351.jpg',
  '9780618640157',
  ARRAY['Fantasía', 'Aventura', 'Clásicos'],
  'en',
  423,
  1954,
  'manual'
),
(
  'Harry Potter y la piedra filosofal',
  ARRAY['J.K. Rowling'],
  'Harry Potter descubre en su undécimo cumpleaños que es un mago y es admitido en Hogwarts, la escuela de magia y hechicería más prestigiosa del mundo.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1598823299i/42844155.jpg',
  '9788478884452',
  ARRAY['Fantasía', 'Juvenil', 'Aventura'],
  'es',
  309,
  1997,
  'manual'
),
(
  'El principito',
  ARRAY['Antoine de Saint-Exupéry'],
  'Un piloto varado en el desierto del Sahara conoce a un pequeño príncipe venido de un asteroide. Una fábula poética sobre el amor, la amistad y el sentido de la vida.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1367545443i/157993.jpg',
  '9780156012195',
  ARRAY['Ficción', 'Fábula', 'Clásicos', 'Infantil'],
  'es',
  96,
  1943,
  'manual'
),
(
  'Don Quijote de la Mancha',
  ARRAY['Miguel de Cervantes'],
  'Las aventuras de un hidalgo manchego que, enloquecido por los libros de caballería, decide convertirse en caballero andante junto a su escudero Sancho Panza.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1546112331i/3836.jpg',
  '9788420412146',
  ARRAY['Ficción', 'Clásicos', 'Aventura', 'Sátira'],
  'es',
  1056,
  1605,
  'manual'
),
(
  'Orgullo y prejuicio',
  ARRAY['Jane Austen'],
  'Elizabeth Bennet y el orgulloso señor Darcy se conocen en la Inglaterra rural del siglo XIX. Una historia de amor que supera los prejuicios sociales y personales.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320399351i/1885.jpg',
  '9780141439518',
  ARRAY['Romance', 'Ficción', 'Clásicos'],
  'en',
  432,
  1813,
  'manual'
),
(
  'Dune',
  ARRAY['Frank Herbert'],
  'En el desértico planeta Arrakis, Paul Atreides lucha por el control de la especia melange, la sustancia más valiosa del universo. Política, religión y ecología se entrelazan en esta épica espacial.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg',
  '9780441172719',
  ARRAY['Ciencia ficción', 'Fantasía', 'Aventura'],
  'en',
  688,
  1965,
  'manual'
),
(
  'Los juegos del hambre',
  ARRAY['Suzanne Collins'],
  'En la nación de Panem, Katniss Everdeen se ofrece voluntaria para participar en los Juegos del Hambre, una competición televisada donde solo puede quedar un superviviente.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1586722975i/2767052.jpg',
  '9780439023481',
  ARRAY['Distopía', 'Juvenil', 'Ciencia ficción', 'Aventura'],
  'en',
  374,
  2008,
  'manual'
),
(
  'El nombre del viento',
  ARRAY['Patrick Rothfuss'],
  'Kvothe, el hombre más famoso del mundo, narra su historia: de huérfano y mendigo a legendario mago y músico. El primer día de una épica narración en tres partes.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1270352123i/186074.jpg',
  '9780756404741',
  ARRAY['Fantasía', 'Aventura', 'Épica'],
  'en',
  662,
  2007,
  'manual'
),
(
  'Matar a un ruiseñor',
  ARRAY['Harper Lee'],
  'En el profundo sur de Estados Unidos durante la Gran Depresión, la joven Scout Finch observa cómo su padre, el abogado Atticus Finch, defiende a un hombre negro acusado injustamente.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg',
  '9780060935467',
  ARRAY['Ficción', 'Clásicos', 'Drama'],
  'en',
  324,
  1960,
  'manual'
),
(
  'La sombra del viento',
  ARRAY['Carlos Ruiz Zafón'],
  'Barcelona, 1945. Daniel Sempere descubre un libro maldito que cambiará su vida y lo arrastrará a un laberinto de intrigas y secretos enterrados en el alma oscura de la ciudad.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1344267771i/1232.jpg',
  '9788408163435',
  ARRAY['Misterio', 'Ficción histórica', 'Romance'],
  'es',
  565,
  2001,
  'manual'
),
(
  'El alquimista',
  ARRAY['Paulo Coelho'],
  'Santiago, un joven pastor andaluz, emprende un viaje desde España hasta las pirámides de Egipto en busca de un tesoro. Una fábula sobre seguir nuestros sueños.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg',
  '9780062315007',
  ARRAY['Ficción', 'Fábula', 'Aventura', 'Espiritual'],
  'es',
  208,
  1988,
  'manual'
),
(
  'Crimen y castigo',
  ARRAY['Fiódor Dostoyevski'],
  'Raskólnikov, un estudiante pobre de San Petersburgo, comete un asesinato y debe enfrentarse a las consecuencias psicológicas y morales de su acto.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1382846449i/7144.jpg',
  '9780143058144',
  ARRAY['Ficción', 'Clásicos', 'Psicológico', 'Drama'],
  'ru',
  671,
  1866,
  'manual'
),
(
  'Rayuela',
  ARRAY['Julio Cortázar'],
  'Horacio Oliveira busca el sentido de la vida entre París y Buenos Aires. Una novela revolucionaria que puede leerse de múltiples formas.',
  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327911892i/53413.jpg',
  '9788437604572',
  ARRAY['Ficción', 'Experimental', 'Clásicos latinoamericanos'],
  'es',
  600,
  1963,
  'manual'
);