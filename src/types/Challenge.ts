import { Database } from '@/types/supabase';
export type DBChallenge = Database['public']['Tables']['challenges']['Row'];
export type DBProfileIcon =
  Database['public']['Tables']['profile_icons']['Row'];
export type Challenge = DBChallenge & {
  profile_icons: DBProfileIcon[];
};
export type DBUserChallenge =
  Database['public']['Tables']['user_challenges']['Row'];

export type ChallengeInformation = {
  challenge: Challenge;
  completed: boolean;
  completed_at?: string;
};
