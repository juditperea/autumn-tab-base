-- 1) Añadir constraint de formato para username
ALTER TABLE public.profiles
ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,50}$');

-- 2) Función mejorada: trim + diferenciar "username enviado" vs "fallback"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_username TEXT;
  provided_username TEXT;
BEGIN
  provided_username := new.raw_user_meta_data->>'username';

  clean_username := COALESCE(provided_username, split_part(new.email, '@', 1));
  clean_username := trim(clean_username);

  IF clean_username IS NULL OR clean_username = '' THEN
    RAISE EXCEPTION 'Username cannot be empty';
  END IF;

  -- Si el usuario lo proporcionó y es inválido -> error (no lo tapes)
  IF provided_username IS NOT NULL AND NOT (clean_username ~ '^[a-zA-Z0-9_]{3,50}$') THEN
    RAISE EXCEPTION 'Invalid username format';
  END IF;

  -- Si NO lo proporcionó (fallback desde email) y es inválido -> genera uno válido
  IF provided_username IS NULL AND NOT (clean_username ~ '^[a-zA-Z0-9_]{3,50}$') THEN
    clean_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
  END IF;

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    clean_username,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );

  RETURN new;
END;
$$;