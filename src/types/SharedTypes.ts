// These types are added as a syslink to firestore functions project 22

export type AddFriendData = {
  userId: string;
  friendName: string;
};

export type DeclineFriendRequestResponse = {
  message: string;
} & (
  | {
      success: false;
      code: 'friend-request-does-not-exist';
      message: string;
    }
  | {
      success: true;
      code: 'friend-request-declined';
      message: string;
    }
);

export type AcceptFriendRequestResponse = {
  message: string;
} & (
  | {
      success: false;
      code: 'friend-request-already-accepted' | 'friend-request-does-not-exist';
      message: string;
    }
  | {
      success: true;
      code: 'friend-request-accepted';
      message: string;
    }
);

export type AddFriendResponse = {
  message: string;
} & (
  | {
      success: false;
      code:
        | 'friend-request-already-sent'
        | 'friend-already-added'
        | 'friend-does-not-exist'
        | 'cannot-add-self';
      message: string;
    }
  | {
      success: true;
      code: 'friend-request-sent';
      message: string;
    }
);

export type RemoveFriendData = {
  friendId: string;
};

export type RemoveFriendResponse = {
  message: string;
} & (
  | {
      success: false;
      code: 'friend-does-not-exist';
      message: string;
    }
  | {
      success: true;
      code: 'friend-removed';
      message: string;
    }
);

export type InFriendRequest = {
  timestamp?: number;
  userId: string;
  username: string;
};

export type OutFriendRequest = {
  timestamp?: number;
  userId: string;
  username: string;
};
