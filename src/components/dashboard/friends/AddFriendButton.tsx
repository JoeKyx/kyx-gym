'use client';
import { FC, useState } from 'react';

import { cn } from '@/lib/utils';

import TextButton from '@/components/buttons/TextButton';
import { useSocial } from '@/components/context/SocialContext';

interface AddFriendButtonProps {
  userId: string;
  _friendName: string;
  className?: string;
}

const AddFriendButton: FC<AddFriendButtonProps> = ({
  userId,
  _friendName,
  className,
}) => {
  const socialContext = useSocial();

  const [isError, _setIsError] = useState<boolean>(false);
  const [isSuccess, _setIsSuccess] = useState<boolean>(false);

  if (socialContext?.userProfile?.userid === userId || !socialContext)
    return <></>;

  const isFriend = socialContext.friendlist.find(
    (friend) => friend.userid === userId
  );
  const isFriendReqSent = socialContext.outgoingFriendRequests.find(
    (friend) => friend === userId
  );

  const handleAddFriend = async () => {
    socialContext?.addFriend(userId);
  };

  const buttonText = () => {
    if (isFriend) return 'You are friends';
    if (isFriendReqSent) return 'Friend request sent';
    if (isError) return 'Error';
    if (isSuccess) return 'Friend request sent';
    return 'Add Friend';
  };

  const isDisabled = () => {
    if (isFriend) return true;
    if (isFriendReqSent) return true;
    if (isError) return true;
    if (isSuccess) return true;
    return false;
  };

  if (isFriend) {
    return <p className='text-primary-500 font-semibold'>You are friends!</p>;
  }

  if (isFriendReqSent || isSuccess) {
    return <p className='font-semibold text-blue-500'>Friend request sent!</p>;
  }

  if (isError) {
    <p className='font-semibold text-red-500'>
      Something went wrong! Try again later
    </p>;
  }

  return (
    <TextButton
      variant='primary'
      className={cn(className)}
      disabled={isDisabled()}
      onClick={handleAddFriend}
    >
      {buttonText()}
    </TextButton>
  );
};

export default AddFriendButton;
