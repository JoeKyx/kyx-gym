'use client';
import { FC } from 'react';

import logger from '@/lib/logger';

import { useSocial } from '@/components/context/SocialContext';
import ChooseUsernameModal from '@/components/dashboard/modals/ChooseUsernameModal';
import SelectProfilePictureModal from '@/components/dashboard/modals/SelectProfilePictureModal';

const FirstLoginModal: FC = () => {
  const socialContext = useSocial();

  const onUsernameDone = () => {
    logger('onUsernameDone');
    socialContext?.setShowProfilePictureModal(true);
  };

  return (
    <>
      <ChooseUsernameModal onDone={onUsernameDone} />
      <SelectProfilePictureModal />
    </>
  );
};

export default FirstLoginModal;
