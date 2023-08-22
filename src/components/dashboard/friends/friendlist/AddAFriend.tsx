'use client';

import { FC, useState } from 'react';

import Button from '@/components/buttons/Button';
import { useSocial } from '@/components/context/SocialContext';

const AddAFriend: FC = () => {
  const socialContext = useSocial();

  const [friendName, setFriendName] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addFriendHandler = async () => {
    if (!socialContext) {
      setIsError(true);
      setErrorMessage('Social context is not defined');
      return;
    }
    if (friendName === '') {
      setIsError(true);
      setErrorMessage('Friend name cannot be empty');
    }

    setIsLoading(true);
    const friendAddResponse = await socialContext.addFriendByUsername(
      friendName
    );
    setIsLoading(false);
    setIsSuccess(friendAddResponse.success);
    if (!friendAddResponse.success) {
      setIsError(true);
      setErrorMessage(friendAddResponse.errorMsg);
    } else {
      setIsError(false);
      setErrorMessage('');
      setFriendName('');
    }
  };

  return (
    <div className='border-primary-500 flex flex-col justify-center gap-1 border-t px-4 py-2'>
      <div className={'h-8 ' + isSuccess || isError ? 'visible' : 'hidden'}>
        {isSuccess && (
          <p className='text-center text-green-500'>
            Friend request has been sent
          </p>
        )}
        {isError && <p className='text-center text-red-500'>{errorMessage}</p>}
      </div>
      <div className='flex gap-4'>
        <input
          className='form-input flex-grow'
          type='text'
          id='friendName'
          placeholder='Friend name...'
          onChange={(e) => {
            setIsError(false);
            setFriendName(e.target.value);
          }}
          value={friendName}
        />
        <Button
          variant='primary'
          onClick={addFriendHandler}
          isLoading={isLoading}
        >
          Add Friend
        </Button>
      </div>
    </div>
  );
};

export default AddAFriend;
