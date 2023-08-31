'use client';
import { FC, useEffect, useRef, useState } from 'react';
import { Drawer } from 'vaul';

import Button from '@/components/buttons/Button';
import { useSocial } from '@/components/context/SocialContext';

type ChooseUsernameModalProps = {
  onDone?: () => void;
};

const ChooseUsernameModal: FC<ChooseUsernameModalProps> = ({ onDone }) => {
  const socialContext = useSocial();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (socialContext?.userProfile?.isDefaultUsername) {
      setOpen(true);
    }
  }, [socialContext?.userProfile?.isDefaultUsername]);

  const handleUsernameSubmit = async () => {
    setLoading(true);
    if (!usernameInputRef.current?.value) {
      setError('Username cannot be empty');
      return;
    }
    const res = await socialContext?.setUsername(
      usernameInputRef.current.value
    );

    if (!res?.success) {
      setError(res?.errorMsg || 'Something went wrong');
      return;
    } else {
      setOpen(false);
      onDone?.();
    }
  };

  if (!socialContext) {
    return null;
  }

  return (
    <Drawer.Root dismissible={false} open={open}>
      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 bg-black/40' />
        <Drawer.Content className='fixed bottom-0 left-0 right-0 mt-24 flex flex-col rounded-t-[10px] bg-zinc-100'>
          <div className='flex-1 rounded-t-[10px] bg-white p-4 pb-16 md:pb-0'>
            <div className='mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-300' />
            <div className='mx-auto max-w-md'>
              <Drawer.Title className='mb-4 font-medium'>
                Welcome to Kyx Gym!
              </Drawer.Title>
              <p className='mb-2 text-zinc-600'>
                This is your first time logging in! We have already set up
                everything for you, there is just one thing missing: your
                username!
              </p>
              <input
                ref={usernameInputRef}
                className='mb-6 w-full rounded-md bg-gray-100 px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
                placeholder='Username'
              />
              <Button
                isLoading={loading}
                type='button'
                onClick={handleUsernameSubmit}
                className='mb-6 w-full rounded-md bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
              >
                Confirm username
              </Button>
              <p className='mb-2 text-red-500'>{error}</p>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default ChooseUsernameModal;
