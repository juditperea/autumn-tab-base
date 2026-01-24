import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Club {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  owner_id: string;
  current_book_id: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
  current_book?: {
    id: string;
    title: string;
    cover_url: string | null;
    authors: string[];
  } | null;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  profile?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface ClubMessage {
  id: string;
  club_id: string;
  user_id: string;
  content: string;
  contains_spoiler: boolean;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Fetch all public clubs
export const usePublicClubs = () => {
  return useQuery({
    queryKey: ["clubs", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select(`
          *,
          current_book:books(id, title, cover_url, authors)
        `)
        .eq("is_public", true)
        .order("member_count", { ascending: false });

      if (error) throw error;
      return data as Club[];
    },
  });
};

// Fetch clubs where user is a member
export const useMyClubs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["clubs", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: memberData, error: memberError } = await supabase
        .from("club_members")
        .select("club_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;
      if (!memberData.length) return [];

      const clubIds = memberData.map((m) => m.club_id);

      const { data, error } = await supabase
        .from("clubs")
        .select(`
          *,
          current_book:books(id, title, cover_url, authors)
        `)
        .in("id", clubIds)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Club[];
    },
    enabled: !!user,
  });
};

// Fetch single club details
export const useClub = (clubId: string | undefined) => {
  return useQuery({
    queryKey: ["club", clubId],
    queryFn: async () => {
      if (!clubId) throw new Error("Club ID required");

      const { data, error } = await supabase
        .from("clubs")
        .select(`
          *,
          current_book:books(id, title, cover_url, authors)
        `)
        .eq("id", clubId)
        .single();

      if (error) throw error;
      return data as Club;
    },
    enabled: !!clubId,
  });
};

// Fetch club members
export const useClubMembers = (clubId: string | undefined) => {
  return useQuery({
    queryKey: ["club", clubId, "members"],
    queryFn: async () => {
      if (!clubId) throw new Error("Club ID required");

      const { data, error } = await supabase
        .from("club_members")
        .select("*")
        .eq("club_id", clubId)
        .order("joined_at");

      if (error) throw error;

      // Fetch profiles for each member
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((member) => ({
        ...member,
        role: member.role as "owner" | "admin" | "member",
        profile: profileMap.get(member.user_id) || undefined,
      })) as ClubMember[];
    },
    enabled: !!clubId,
  });
};

// Check if current user is member/admin
export const useClubMembership = (clubId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["club", clubId, "membership", user?.id],
    queryFn: async () => {
      if (!clubId || !user) return null;

      const { data, error } = await supabase
        .from("club_members")
        .select("*")
        .eq("club_id", clubId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ClubMember | null;
    },
    enabled: !!clubId && !!user,
  });
};

// Fetch club messages
export const useClubMessages = (clubId: string | undefined) => {
  return useQuery({
    queryKey: ["club", clubId, "messages"],
    queryFn: async () => {
      if (!clubId) throw new Error("Club ID required");

      const { data, error } = await supabase
        .from("club_messages")
        .select("*")
        .eq("club_id", clubId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch profiles for each message author
      const userIds = [...new Set(data.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((msg) => ({
        ...msg,
        profile: profileMap.get(msg.user_id) || undefined,
      })) as ClubMessage[];
    },
    enabled: !!clubId,
  });
};

// Create club mutation
export const useCreateClub = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (clubData: {
      name: string;
      description?: string;
      is_public: boolean;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("clubs")
        .insert({
          name: clubData.name,
          description: clubData.description || null,
          is_public: clubData.is_public,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
};

// Join club mutation
export const useJoinClub = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (clubId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase.from("club_members").insert({
        club_id: clubId,
        user_id: user.id,
        role: "member",
      });

      if (error) throw error;
    },
    onSuccess: (_, clubId) => {
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      queryClient.invalidateQueries({ queryKey: ["club", clubId] });
    },
  });
};

// Leave club mutation
export const useLeaveClub = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (clubId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("club_members")
        .delete()
        .eq("club_id", clubId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_, clubId) => {
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      queryClient.invalidateQueries({ queryKey: ["club", clubId] });
    },
  });
};

// Update club (for admins)
export const useUpdateClub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clubId,
      updates,
    }: {
      clubId: string;
      updates: Partial<{
        name: string;
        description: string;
        current_book_id: string | null;
        is_public: boolean;
      }>;
    }) => {
      const { error } = await supabase
        .from("clubs")
        .update(updates)
        .eq("id", clubId);

      if (error) throw error;
    },
    onSuccess: (_, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      queryClient.invalidateQueries({ queryKey: ["club", clubId] });
    },
  });
};

// Send message mutation
export const useSendClubMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      clubId,
      content,
      containsSpoiler = false,
    }: {
      clubId: string;
      content: string;
      containsSpoiler?: boolean;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase.from("club_messages").insert({
        club_id: clubId,
        user_id: user.id,
        content,
        contains_spoiler: containsSpoiler,
      });

      if (error) throw error;
    },
    onSuccess: (_, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ["club", clubId, "messages"] });
    },
  });
};

// Delete message mutation
export const useDeleteClubMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      clubId,
    }: {
      messageId: string;
      clubId: string;
    }) => {
      const { error } = await supabase
        .from("club_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      return clubId;
    },
    onSuccess: (clubId) => {
      queryClient.invalidateQueries({ queryKey: ["club", clubId, "messages"] });
    },
  });
};

// Update member role (for admins)
export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      clubId,
      role,
    }: {
      memberId: string;
      clubId: string;
      role: "admin" | "member";
    }) => {
      const { error } = await supabase
        .from("club_members")
        .update({ role })
        .eq("id", memberId);

      if (error) throw error;
      return clubId;
    },
    onSuccess: (clubId) => {
      queryClient.invalidateQueries({ queryKey: ["club", clubId, "members"] });
    },
  });
};

// Remove member (for admins)
export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      clubId,
    }: {
      memberId: string;
      clubId: string;
    }) => {
      const { error } = await supabase
        .from("club_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      return clubId;
    },
    onSuccess: (clubId) => {
      queryClient.invalidateQueries({ queryKey: ["club", clubId] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
};
