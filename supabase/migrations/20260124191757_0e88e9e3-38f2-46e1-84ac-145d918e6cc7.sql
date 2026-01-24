-- Create clubs table
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create club members table
CREATE TABLE public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- Create club messages table
CREATE TABLE public.club_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  contains_spoiler BOOLEAN NOT NULL DEFAULT false,
  reply_to_id UUID REFERENCES public.club_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create club invitations table for private clubs
CREATE TABLE public.club_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, invited_user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_invitations ENABLE ROW LEVEL SECURITY;

-- Helper function to check club membership
CREATE OR REPLACE FUNCTION public.is_club_member(_user_id UUID, _club_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE user_id = _user_id AND club_id = _club_id
  )
$$;

-- Helper function to check club admin/owner
CREATE OR REPLACE FUNCTION public.is_club_admin(_user_id UUID, _club_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE user_id = _user_id AND club_id = _club_id AND role IN ('owner', 'admin')
  )
$$;

-- Clubs RLS policies
CREATE POLICY "Public clubs are viewable by everyone"
ON public.clubs FOR SELECT
USING (is_public = true);

CREATE POLICY "Private clubs viewable by members"
ON public.clubs FOR SELECT
USING (public.is_club_member(auth.uid(), id));

CREATE POLICY "Users can create clubs"
ON public.clubs FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Club admins can update club"
ON public.clubs FOR UPDATE
USING (public.is_club_admin(auth.uid(), id));

CREATE POLICY "Club owner can delete club"
ON public.clubs FOR DELETE
USING (auth.uid() = owner_id);

-- Club members RLS policies
CREATE POLICY "Club members are viewable by club members"
ON public.club_members FOR SELECT
USING (public.is_club_member(auth.uid(), club_id));

CREATE POLICY "Users can join public clubs"
ON public.club_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  (SELECT is_public FROM public.clubs WHERE id = club_id) = true
);

CREATE POLICY "Club admins can add members"
ON public.club_members FOR INSERT
WITH CHECK (public.is_club_admin(auth.uid(), club_id));

CREATE POLICY "Users can leave clubs"
ON public.club_members FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Club admins can remove members"
ON public.club_members FOR DELETE
USING (public.is_club_admin(auth.uid(), club_id));

-- Club messages RLS policies
CREATE POLICY "Club messages viewable by members"
ON public.club_messages FOR SELECT
USING (public.is_club_member(auth.uid(), club_id));

CREATE POLICY "Club members can send messages"
ON public.club_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  public.is_club_member(auth.uid(), club_id)
);

CREATE POLICY "Users can edit own messages"
ON public.club_messages FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
ON public.club_messages FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Club admins can delete any message"
ON public.club_messages FOR DELETE
USING (public.is_club_admin(auth.uid(), club_id));

-- Club invitations RLS policies
CREATE POLICY "Users can see their invitations"
ON public.club_invitations FOR SELECT
USING (invited_user_id = auth.uid() OR invited_by = auth.uid());

CREATE POLICY "Club admins can see club invitations"
ON public.club_invitations FOR SELECT
USING (public.is_club_admin(auth.uid(), club_id));

CREATE POLICY "Club admins can create invitations"
ON public.club_invitations FOR INSERT
WITH CHECK (
  auth.uid() = invited_by AND 
  public.is_club_admin(auth.uid(), club_id)
);

CREATE POLICY "Invited users can update invitation status"
ON public.club_invitations FOR UPDATE
USING (invited_user_id = auth.uid())
WITH CHECK (invited_user_id = auth.uid());

CREATE POLICY "Club admins can delete invitations"
ON public.club_invitations FOR DELETE
USING (public.is_club_admin(auth.uid(), club_id));

-- Trigger to auto-add owner as member when club is created
CREATE OR REPLACE FUNCTION public.add_club_owner_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.club_members (club_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_club_created
AFTER INSERT ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION public.add_club_owner_as_member();

-- Trigger to update member count
CREATE OR REPLACE FUNCTION public.update_club_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clubs SET member_count = member_count - 1 WHERE id = OLD.club_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_club_member_change
AFTER INSERT OR DELETE ON public.club_members
FOR EACH ROW
EXECUTE FUNCTION public.update_club_member_count();

-- Enable realtime for club messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_messages;

-- Create indexes for performance
CREATE INDEX idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX idx_club_members_user_id ON public.club_members(user_id);
CREATE INDEX idx_club_messages_club_id ON public.club_messages(club_id);
CREATE INDEX idx_club_messages_created_at ON public.club_messages(created_at DESC);
CREATE INDEX idx_clubs_is_public ON public.clubs(is_public);
CREATE INDEX idx_clubs_owner_id ON public.clubs(owner_id);