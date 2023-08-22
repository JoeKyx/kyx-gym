'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';

import logger from '@/lib/logger';
import { loadLevelXp } from '@/lib/supabase-util';

import { Database } from '@/types/supabase';
import { DBExperienceLevel } from '@/types/Workout';
type ProfileIcon = Database['public']['Tables']['profile_icons']['Row'];
export type UserProfile = Database['public']['Tables']['userprofile']['Row'] & {
  profile_icons: ProfileIcon | null;
};

type Feed = Database['public']['Tables']['feedprofile']['Row'];

export type FriendActionResponse =
  | {
      success: true;
    }
  | {
      success: false;
      errorMsg: string;
    };

// Define the state structure
interface ISocial {
  userProfile: UserProfile | null;
  friendlist: UserProfile[];
  friendRequests: UserProfile[];
  outgoingFriendRequests: string[];
  loading: boolean;
  feed: Feed[] | null;
  levelXp: DBExperienceLevel[];
  addFriend: (friendId: string) => Promise<FriendActionResponse>;
  addFriendByUsername: (username: string) => Promise<FriendActionResponse>;
  removeFriend: (friendId: string) => Promise<FriendActionResponse>;
  acceptFriendRequest: (friendId: string) => Promise<FriendActionResponse>;
  declineFriendRequest: (friendId: string) => Promise<FriendActionResponse>;
  loadUserProfile: (userid: string) => Promise<UserProfile | null>;
  updateProfileIcon: (iconId: ProfileIcon) => Promise<boolean>;
}

interface SetUserProfileAction {
  type: 'SET_USER_PROFILE';
  payload: UserProfile | null;
}

interface SetFriendListAction {
  type: 'SET_FRIEND_LIST';
  payload: UserProfile[];
}

interface SetFriendRequestsAction {
  type: 'SET_FRIEND_REQUESTS';
  payload: UserProfile[];
}

interface SetLoadingAction {
  type: 'SET_LOADING';
  payload: boolean;
}

interface SetDeleteFriendAction {
  type: 'DELETE_FRIEND';
  payload: string;
}

interface SetAddFriendAction {
  type: 'ADD_FRIEND';
  payload: UserProfile;
}

interface SetAddFriendRequestAction {
  type: 'ADD_FRIEND_REQUEST';
  payload: UserProfile;
}

interface SetDeleteFriendRequestAction {
  type: 'DELETE_FRIEND_REQUEST';
  payload: string;
}

interface SetFeedAction {
  type: 'SET_FEED';
  payload: Feed[];
}

interface SetOutgoingFriendRequestsAction {
  type: 'SET_OUTGOING_FRIEND_REQUESTS';
  payload: string[];
}

type SocialAction =
  | SetOutgoingFriendRequestsAction
  | SetUserProfileAction
  | SetFriendListAction
  | SetFriendRequestsAction
  | SetLoadingAction
  | SetDeleteFriendAction
  | SetAddFriendAction
  | SetAddFriendRequestAction
  | SetDeleteFriendRequestAction
  | SetFeedAction;

// Define the initial state
const initialSocial: ISocial = {
  userProfile: null,
  friendlist: [] as UserProfile[],
  friendRequests: [] as UserProfile[],
  outgoingFriendRequests: [] as string[],
  loading: true,
  feed: [] as Feed[],
  addFriend: async (_friendId: string): Promise<FriendActionResponse> => {
    return { errorMsg: 'I am not a real Context :(', success: false };
  },
  addFriendByUsername: async (
    _username: string
  ): Promise<FriendActionResponse> => {
    return { errorMsg: 'I am not a real Context :(', success: false };
  },
  removeFriend: async (_friendId: string): Promise<FriendActionResponse> => {
    return { errorMsg: 'I am not a real Context :(', success: false };
  },
  acceptFriendRequest: async (
    _friendId: string
  ): Promise<FriendActionResponse> => {
    return { errorMsg: 'I am not a real Context :(', success: false };
  },
  declineFriendRequest: async (
    _friendId: string
  ): Promise<FriendActionResponse> => {
    return { errorMsg: 'I am not a real Context :(', success: false };
  },
  loadUserProfile: async (_userid: string) => {
    return null;
  },
  levelXp: [],
  updateProfileIcon: async (_iconId: ProfileIcon) => {
    return false;
  },
};

// Create context
const SocialContext = createContext<ISocial | undefined>(undefined);

// Create reducer
function SocialReducer(state: ISocial, action: SocialAction): ISocial {
  switch (action.type) {
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'SET_FRIEND_LIST':
      return { ...state, friendlist: action.payload };
    case 'SET_FRIEND_REQUESTS':
      return { ...state, friendRequests: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_OUTGOING_FRIEND_REQUESTS':
      return { ...state, outgoingFriendRequests: action.payload };
    case 'DELETE_FRIEND':
      return {
        ...state,
        friendlist:
          state.friendlist?.filter(
            (friend) => friend?.userid !== action.payload
          ) || null,
      };
    case 'ADD_FRIEND':
      return {
        ...state,
        friendlist: state.friendlist?.concat(action.payload) || null,
      };
    case 'ADD_FRIEND_REQUEST':
      return {
        ...state,
        friendRequests: state.friendRequests?.concat(action.payload) || null,
      };
    case 'DELETE_FRIEND_REQUEST':
      return {
        ...state,
        friendRequests:
          state.friendRequests?.filter(
            (friend) => friend?.userid !== action.payload
          ) || null,
      };
    case 'SET_FEED':
      return { ...state, feed: action.payload };
    default:
      return state;
  }
}

// Create Provider
export function SocialProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [state, dispatch] = useReducer(SocialReducer, initialSocial);
  const [user, setUser] = useState<User | null>(null);
  const [levelXp, setLevelXp] = useState<DBExperienceLevel[]>([]);

  const [friendIds, setFriendIds] = useState<string[]>([]);
  // Get logged in user

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const levelXp = async () => {
      const res = await loadLevelXp();
      if (res.success && res.data) {
        setLevelXp(res.data);
      }
    };
    levelXp();
  }, []);

  const loadUser = async () => {
    const supabase = createClientComponentClient<Database>();
    const user = await supabase.auth.getUser();
    setUser(user.data.user);
  };

  useEffect(() => {
    if (friendIds && friendIds.length > 0) {
      const loadFriendUsers = async () => {
        try {
          const friendListRes = await supabase
            .from('userprofile')
            .select('*, profile_icons(*)')
            .in('userid', friendIds);
          const friendList = friendListRes.data || [];
          dispatch({ type: 'SET_FRIEND_LIST', payload: friendList });
        } catch (error) {
          logger(error);
        }
      };
      loadFriendUsers();
    } else {
      dispatch({ type: 'SET_FRIEND_LIST', payload: [] });
    }
  }, [friendIds, supabase]);

  useEffect(() => {
    if (user) {
      const loadFeed = async () => {
        try {
          const feedRes = await supabase
            .from('feedprofile')
            .select('*')
            .eq('userid', user.id);
          const feed = feedRes.data || [];
          dispatch({ type: 'SET_FEED', payload: feed });
        } catch (error) {
          logger(error);
        }
      };
      loadFeed();
    } else {
      dispatch({ type: 'SET_FEED', payload: [] });
    }
  }, [user, supabase]);

  const fetchUserProfile = useCallback(async () => {
    return await supabase
      .from('userprofile')
      .select('*, profile_icons(*)')
      .eq('userid', user?.id)
      .single();
  }, [supabase, user?.id]);

  const fetchFriendList = useCallback(async () => {
    if (!user?.id) {
      return [];
    }
    try {
      // Fetch userProfiles of friends (return an array of userprofiles)
      const friendlist = await supabase
        .from('friendlist')
        .select(
          `
          friend
        `
        )
        .eq('owner', user?.id);

      if (!friendlist.data) {
        return [];
      }

      return friendlist.data.map((friend) => {
        return friend.friend;
      });
    } catch (error) {
      return [];
    }
  }, [supabase, user?.id]);

  const fetchFriendRequests = useCallback(async () => {
    const { data: friendRequests, error: frError } = await supabase
      .from('friendrequests')
      .select('requesterid')
      .eq('status', 'PENDING')
      .eq('requestedid', user?.id);

    if (frError || !friendRequests) {
      logger(frError);
      return null;
    }

    // Then, fetch the profiles of the requesters
    const requesterIds = friendRequests.map((fr) => fr.requesterid);
    const { data: requesterProfiles, error: rpError } = await supabase
      .from('userprofile, profile_icons(*)')
      .select('*')
      .in('userid', requesterIds);

    if (rpError || !requesterProfiles) {
      logger(rpError);
      return null;
    } else {
      return requesterProfiles;
    }
  }, [supabase, user?.id]);

  const fetchFriendRequestsSent = useCallback(async () => {
    const { data: friendRequests, error: frError } = await supabase
      .from('friendrequests')
      .select('requestedid')
      .eq('status', 'PENDING')
      .eq('requesterid', user?.id);

    if (frError || !friendRequests) {
      logger(frError);
      return null;
    }
    return friendRequests.map((fr) => fr.requestedid);
  }, [supabase, user?.id]);

  const fetchData = useCallback(() => {
    if (!user?.id) {
      return;
    }

    Promise.all([
      fetchUserProfile(),
      fetchFriendList(),
      fetchFriendRequestsSent(),
      fetchFriendRequests(),
    ])
      .then((values) => {
        const [userProfile, friendlist, friendRequestsSent, friendRequests] =
          values;
        dispatch({ type: 'SET_USER_PROFILE', payload: userProfile.data });
        dispatch({
          type: 'SET_FRIEND_REQUESTS',
          payload: friendRequests || [],
        });
        setFriendIds(friendlist);
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({
          type: 'SET_OUTGOING_FRIEND_REQUESTS',
          payload: friendRequestsSent || [],
        });
      })
      .catch((error) => {
        logger(error);
      });
  }, [
    user?.id,
    fetchUserProfile,
    fetchFriendList,
    fetchFriendRequestsSent,
    fetchFriendRequests,
  ]);

  const addFriend = useCallback(
    async (friendId: string): Promise<FriendActionResponse> => {
      if (friendId === state.userProfile?.userid) {
        return {
          success: false,
          errorMsg: 'You cannot add yourself as a friend',
        };
      }
      try {
        if (state.friendlist?.find((friend) => friend.userid === friendId)) {
          logger('Already friends');
          return { success: false, errorMsg: 'Already friends' };
        }
        await supabase.rpc('send_friend_request', { _requestedid: friendId });
        return { success: true };
      } catch (error) {
        logger(error);
        return { success: false, errorMsg: 'Something went wrong' };
      }
    },
    [state.friendlist, supabase, state.userProfile?.userid]
  );

  const addFriendByUsername = useCallback(
    async (username: string): Promise<FriendActionResponse> => {
      if (username === state.userProfile?.username) {
        return {
          success: false,
          errorMsg: 'You cannot add yourself as a friend',
        };
      }
      try {
        const { data: user } = await supabase
          .from('userprofile')
          .select('*')
          .eq('username', username)
          .single();
        if (!user) {
          return { success: false, errorMsg: 'User not found' };
        }
        return await addFriend(user.userid);
      } catch (error) {
        logger(error);
        return { success: false, errorMsg: 'Something went wrong' };
      }
    },
    [addFriend, supabase, state.userProfile?.username]
  );

  const removeFriend = useCallback(
    async (friendId: string): Promise<FriendActionResponse> => {
      try {
        // Check if friend is in friendlist and if yes remove him from there
        if (state.friendlist?.find((friend) => friend.userid === friendId)) {
          dispatch({ type: 'DELETE_FRIEND', payload: friendId });
          await supabase.rpc('remove_friend', { friend_id: friendId });
          return { success: true };
        } else {
          return {
            success: false,
            errorMsg: 'User not found on your friendlist',
          };
        }
      } catch (error) {
        logger(error);
        return { success: false, errorMsg: 'Something went wrong' };
      }
    },
    [supabase, state.friendlist]
  );

  const acceptFriendRequest = useCallback(
    async (requesterId: string): Promise<FriendActionResponse> => {
      // Check if there is a friend request from this user
      const friendRequest = state.friendRequests?.find(
        (fr) => fr.userid === requesterId
      );
      if (!friendRequest) {
        return { success: false, errorMsg: 'No friend request from this user' };
      }

      try {
        dispatch({ type: 'DELETE_FRIEND_REQUEST', payload: requesterId });
        dispatch({ type: 'ADD_FRIEND', payload: friendRequest });
        const res = await supabase.rpc('accept_friend', {
          friend_id: requesterId,
        });
        logger(res, 'res');
        return { success: true };
      } catch (error) {
        logger(error);
        dispatch({ type: 'ADD_FRIEND_REQUEST', payload: friendRequest });
        dispatch({ type: 'DELETE_FRIEND', payload: requesterId });
        return { success: false, errorMsg: 'Something went wrong' };
      }
    },
    [supabase, state.friendRequests]
  );

  const declineFriendRequest = useCallback(
    async (requesterId: string): Promise<FriendActionResponse> => {
      try {
        dispatch({ type: 'DELETE_FRIEND_REQUEST', payload: requesterId });
        await supabase.rpc('decline_friend', { _friend_id: requesterId });
        return { success: true };
      } catch (error) {
        logger(error);
        return { success: false, errorMsg: 'Something went wrong' };
      }
    },
    [supabase]
  );

  const loadUserProfile = async (userid: string) => {
    const { data: user, error } = await supabase
      .from('userprofile')
      .select('*, profile_icons(*)')
      .eq('userid', userid)
      .single();
    if (error) {
      logger(error);
      return null;
    }
    return user;
  };

  const updateProfileIcon = async (icon: ProfileIcon) => {
    if (!state.userProfile || icon === undefined) return false;
    const newUserProfile = { ...state.userProfile, profile_icons: icon };
    dispatch({ type: 'SET_USER_PROFILE', payload: newUserProfile });
    try {
      const { data, error } = await supabase
        .from('userprofile')
        .update({ icon: icon.id })
        .eq('userid', state.userProfile.userid)
        .select('*, profile_icons(*)');
      logger(data, 'data');
      logger(error, 'error');
      if (error) {
        logger(error);
        return false;
      }
      logger('Looks like a success');

      return true;
    } catch (error) {
      logger(error);
      return false;
    }
  };

  useEffect(() => {
    setHydrated(true);
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (!user) {
      return;
    }
    supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendlist' },
        async () => {
          const friendIds = await fetchFriendList();
          setFriendIds(friendIds);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendrequests' },
        async () => {
          logger('friendrequests changed');
          const friendRequests = await fetchFriendRequests();
          dispatch({
            type: 'SET_FRIEND_REQUESTS',
            payload: friendRequests || [],
          });
        }
      )
      .subscribe();
  }, [user, supabase, fetchFriendList, fetchFriendRequests]);

  if (!hydrated) {
    return <></>;
  }

  return (
    <SocialContext.Provider
      value={{
        ...state,
        addFriend,
        addFriendByUsername,
        removeFriend,
        acceptFriendRequest,
        declineFriendRequest,
        loadUserProfile,
        levelXp,
        updateProfileIcon,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}

// Create a hook that uses the context
export function useSocial() {
  return useContext(SocialContext);
}

export default SocialContext;
