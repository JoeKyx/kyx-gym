import { Database } from '@/types/supabase';

export type UserProfile = Database['public']['Tables']['userprofile']['Row'];
export type ProfileIcon = Database['public']['Tables']['profile_icons']['Row'];
export type UserProfileWithIcon = UserProfile & { icon: ProfileIcon | null };
