export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      calendar: {
        Row: {
          created_at: string;
          date: string;
          id: number;
          public: boolean;
          type: Database['public']['Enums']['date_type'];
          user_id: string;
          workout_id: number | null;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: number;
          public?: boolean;
          type: Database['public']['Enums']['date_type'];
          user_id: string;
          workout_id?: number | null;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: number;
          public?: boolean;
          type?: Database['public']['Enums']['date_type'];
          user_id?: string;
          workout_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'calendar_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'userprofile';
            referencedColumns: ['userid'];
          },
          {
            foreignKeyName: 'calendar_workout_id_fkey';
            columns: ['workout_id'];
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          }
        ];
      };
      exercise_categories: {
        Row: {
          created_at: string | null;
          id: number;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          name: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      exercisemuscles: {
        Row: {
          exerciseid: number;
          muscleid: number;
        };
        Insert: {
          exerciseid: number;
          muscleid: number;
        };
        Update: {
          exerciseid?: number;
          muscleid?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'exercisemuscles_exerciseid_fkey';
            columns: ['exerciseid'];
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exercisemuscles_muscleid_fkey';
            columns: ['muscleid'];
            referencedRelation: 'muscles';
            referencedColumns: ['id'];
          }
        ];
      };
      exercises: {
        Row: {
          categoryid: number;
          created_at: string;
          description: string | null;
          howto: string | null;
          id: number;
          name: string;
          public: boolean;
          userid: string | null;
        };
        Insert: {
          categoryid?: number;
          created_at?: string;
          description?: string | null;
          howto?: string | null;
          id?: number;
          name: string;
          public?: boolean;
          userid?: string | null;
        };
        Update: {
          categoryid?: number;
          created_at?: string;
          description?: string | null;
          howto?: string | null;
          id?: number;
          name?: string;
          public?: boolean;
          userid?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'exercises_categoryid_fkey';
            columns: ['categoryid'];
            referencedRelation: 'exercise_categories';
            referencedColumns: ['id'];
          }
        ];
      };
      experience_level: {
        Row: {
          created_at: string;
          experience: number;
          level: number;
        };
        Insert: {
          created_at?: string;
          experience: number;
          level: number;
        };
        Update: {
          created_at?: string;
          experience?: number;
          level?: number;
        };
        Relationships: [];
      };
      feednews: {
        Row: {
          date: string;
          id: string;
          newsid: string;
          public: boolean;
          text: string | null;
        };
        Insert: {
          date?: string;
          id?: string;
          newsid: string;
          public?: boolean;
          text?: string | null;
        };
        Update: {
          date?: string;
          id?: string;
          newsid?: string;
          public?: boolean;
          text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'feednews_newsid_fkey';
            columns: ['newsid'];
            referencedRelation: 'news';
            referencedColumns: ['id'];
          }
        ];
      };
      feedprofile: {
        Row: {
          date: string;
          id: string;
          public: boolean;
          targetuser: string | null;
          text: string | null;
          type: Database['public']['Enums']['profilefeedtype'] | null;
          userid: string;
        };
        Insert: {
          date?: string;
          id?: string;
          public?: boolean;
          targetuser?: string | null;
          text?: string | null;
          type?: Database['public']['Enums']['profilefeedtype'] | null;
          userid: string;
        };
        Update: {
          date?: string;
          id?: string;
          public?: boolean;
          targetuser?: string | null;
          text?: string | null;
          type?: Database['public']['Enums']['profilefeedtype'] | null;
          userid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feedprofile_targetuser_fkey';
            columns: ['targetuser'];
            referencedRelation: 'userprofile';
            referencedColumns: ['userid'];
          }
        ];
      };
      friendlist: {
        Row: {
          created_at: string;
          friend: string;
          owner: string;
        };
        Insert: {
          created_at?: string;
          friend: string;
          owner: string;
        };
        Update: {
          created_at?: string;
          friend?: string;
          owner?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friendlist_friend_fkey';
            columns: ['friend'];
            referencedRelation: 'userprofile';
            referencedColumns: ['userid'];
          },
          {
            foreignKeyName: 'friendlist_owner_fkey';
            columns: ['owner'];
            referencedRelation: 'userprofile';
            referencedColumns: ['userid'];
          }
        ];
      };
      friendrequests: {
        Row: {
          created_at: string;
          requestedid: string;
          requesterid: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          requestedid: string;
          requesterid: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          requestedid?: string;
          requesterid?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friendrequests_requestedid_fkey';
            columns: ['requestedid'];
            referencedRelation: 'userprofile';
            referencedColumns: ['userid'];
          },
          {
            foreignKeyName: 'friendrequests_requesterid_fkey';
            columns: ['requesterid'];
            referencedRelation: 'userprofile';
            referencedColumns: ['userid'];
          }
        ];
      };
      muscles: {
        Row: {
          created_at: string;
          id: number;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      news: {
        Row: {
          description: string | null;
          id: string;
          image: string | null;
          public: boolean;
          text: string | null;
        };
        Insert: {
          description?: string | null;
          id?: string;
          image?: string | null;
          public?: boolean;
          text?: string | null;
        };
        Update: {
          description?: string | null;
          id?: string;
          image?: string | null;
          public?: boolean;
          text?: string | null;
        };
        Relationships: [];
      };
      profile_icons: {
        Row: {
          created_at: string;
          description: string | null;
          id: number;
          name: string;
          path: string;
          required_level: number | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: number;
          name: string;
          path: string;
          required_level?: number | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: number;
          name?: string;
          path?: string;
          required_level?: number | null;
        };
        Relationships: [];
      };
      records: {
        Row: {
          exercise_id: number | null;
          id: number;
          record_timestamp: string | null;
          set_id: number | null;
          type: string;
          user_id: string | null;
        };
        Insert: {
          exercise_id?: number | null;
          id?: number;
          record_timestamp?: string | null;
          set_id?: number | null;
          type: string;
          user_id?: string | null;
        };
        Update: {
          exercise_id?: number | null;
          id?: number;
          record_timestamp?: string | null;
          set_id?: number | null;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'records_exercise_id_fkey';
            columns: ['exercise_id'];
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'records_set_id_fkey';
            columns: ['set_id'];
            referencedRelation: 'sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'records_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'userprofile';
            referencedColumns: ['userid'];
          }
        ];
      };
      sets: {
        Row: {
          distance: number | null;
          finished_at: string | null;
          id: number;
          is_finished: boolean;
          position: number | null;
          reps: number | null;
          speed: number | null;
          type: Database['public']['Enums']['set_type'];
          userid: string;
          weight: number | null;
          workout_id: number;
          workout_item_id: number;
        };
        Insert: {
          distance?: number | null;
          finished_at?: string | null;
          id?: number;
          is_finished?: boolean;
          position?: number | null;
          reps?: number | null;
          speed?: number | null;
          type?: Database['public']['Enums']['set_type'];
          userid: string;
          weight?: number | null;
          workout_id: number;
          workout_item_id: number;
        };
        Update: {
          distance?: number | null;
          finished_at?: string | null;
          id?: number;
          is_finished?: boolean;
          position?: number | null;
          reps?: number | null;
          speed?: number | null;
          type?: Database['public']['Enums']['set_type'];
          userid?: string;
          weight?: number | null;
          workout_id?: number;
          workout_item_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'sets_userid_fkey';
            columns: ['userid'];
            referencedRelation: 'userprofile';
            referencedColumns: ['userid'];
          },
          {
            foreignKeyName: 'sets_workout_id_fkey';
            columns: ['workout_id'];
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sets_workout_item_id_fkey';
            columns: ['workout_item_id'];
            referencedRelation: 'workout_items';
            referencedColumns: ['id'];
          }
        ];
      };
      template_items: {
        Row: {
          amount_of_sets: number | null;
          created_at: string;
          exercise_id: number;
          id: number;
          position: number;
          template_id: number;
        };
        Insert: {
          amount_of_sets?: number | null;
          created_at?: string;
          exercise_id: number;
          id?: number;
          position: number;
          template_id: number;
        };
        Update: {
          amount_of_sets?: number | null;
          created_at?: string;
          exercise_id?: number;
          id?: number;
          position?: number;
          template_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'template_items_exercise_id_fkey';
            columns: ['exercise_id'];
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'template_items_template_id_fkey';
            columns: ['template_id'];
            referencedRelation: 'templates';
            referencedColumns: ['id'];
          }
        ];
      };
      templates: {
        Row: {
          amount_of_times_performed: number | null;
          created_at: string | null;
          id: number;
          last_performed: string | null;
          main_muscle: number | null;
          name: string;
          public: boolean;
          userid: string | null;
        };
        Insert: {
          amount_of_times_performed?: number | null;
          created_at?: string | null;
          id?: number;
          last_performed?: string | null;
          main_muscle?: number | null;
          name: string;
          public?: boolean;
          userid?: string | null;
        };
        Update: {
          amount_of_times_performed?: number | null;
          created_at?: string | null;
          id?: number;
          last_performed?: string | null;
          main_muscle?: number | null;
          name?: string;
          public?: boolean;
          userid?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'templates_main_muscle_fkey';
            columns: ['main_muscle'];
            referencedRelation: 'muscles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'templates_userid_fkey';
            columns: ['userid'];
            referencedRelation: 'userprofile';
            referencedColumns: ['userid'];
          }
        ];
      };
      userprofile: {
        Row: {
          exp: number | null;
          icon: number | null;
          isDefaultUsername: boolean | null;
          level: number | null;
          public: boolean | null;
          registered: string;
          userid: string;
          username: string;
        };
        Insert: {
          exp?: number | null;
          icon?: number | null;
          isDefaultUsername?: boolean | null;
          level?: number | null;
          public?: boolean | null;
          registered?: string;
          userid: string;
          username: string;
        };
        Update: {
          exp?: number | null;
          icon?: number | null;
          isDefaultUsername?: boolean | null;
          level?: number | null;
          public?: boolean | null;
          registered?: string;
          userid?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'userprofile_icon_fkey';
            columns: ['icon'];
            referencedRelation: 'profile_icons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'userprofile_userid_fkey';
            columns: ['userid'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      workout_items: {
        Row: {
          created_at: string | null;
          exerciseid: number;
          id: number;
          is_finished: boolean;
          position: number;
          template: number | null;
          workout: number;
        };
        Insert: {
          created_at?: string | null;
          exerciseid: number;
          id?: number;
          is_finished?: boolean;
          position: number;
          template?: number | null;
          workout: number;
        };
        Update: {
          created_at?: string | null;
          exerciseid?: number;
          id?: number;
          is_finished?: boolean;
          position?: number;
          template?: number | null;
          workout?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_items_exerciseid_fkey';
            columns: ['exerciseid'];
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_items_template_fkey';
            columns: ['template'];
            referencedRelation: 'templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_items_workout_fkey';
            columns: ['workout'];
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          }
        ];
      };
      workouts: {
        Row: {
          created_at: string;
          finished_at: string | null;
          id: number;
          mainmuscle: number | null;
          name: string;
          rating: number | null;
          status: Database['public']['Enums']['workout_status'];
          template_id: number | null;
          total_weight: number | null;
          userid: string;
        };
        Insert: {
          created_at?: string;
          finished_at?: string | null;
          id?: number;
          mainmuscle?: number | null;
          name: string;
          rating?: number | null;
          status: Database['public']['Enums']['workout_status'];
          template_id?: number | null;
          total_weight?: number | null;
          userid: string;
        };
        Update: {
          created_at?: string;
          finished_at?: string | null;
          id?: number;
          mainmuscle?: number | null;
          name?: string;
          rating?: number | null;
          status?: Database['public']['Enums']['workout_status'];
          template_id?: number | null;
          total_weight?: number | null;
          userid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workouts_mainmuscle_fkey';
            columns: ['mainmuscle'];
            referencedRelation: 'muscles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workouts_template_id_fkey';
            columns: ['template_id'];
            referencedRelation: 'templates';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      unifiedfeed: {
        Row: {
          contentid: string | null;
          date: string | null;
          id: string | null;
          public: boolean | null;
          text: string | null;
          type: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_friend: {
        Args: {
          friend_id: string;
        };
        Returns: undefined;
      };
      decline_friend: {
        Args: {
          _friend_id: string;
        };
        Returns: undefined;
      };
      get_latest_finished_sets: {
        Args: {
          exercise_ids: number[];
          user_id: string;
        };
        Returns: {
          exercise_id: number;
          position: number;
          workout_item_id: number;
          is_finished: boolean;
          weight: number;
          reps: number;
        }[];
      };
      remove_friend: {
        Args: {
          friend_id: string;
        };
        Returns: undefined;
      };
      send_friend_request: {
        Args: {
          _requestedid: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      date_type: 'workout';
      profilefeedtype:
        | 'friendAdd'
        | 'friendRemove'
        | 'levelUp'
        | 'finishedWorkout';
      recordtype: 'weight' | 'volume';
      set_type: 'normal' | 'drop' | 'warmup' | 'super' | 'insane';
      workout_status: 'active' | 'finished' | 'aborted' | 'deleted';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}