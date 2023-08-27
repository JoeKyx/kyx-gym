'use client';
import { useRouter } from 'next/navigation';
import { FC, forwardRef, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';
import logger from '@/lib/logger';

import { useSocial } from '@/components/context/SocialContext';
import MobileImageButton from '@/components/dashboard/mobile/MobileImageButton';

type ProfileTabProps = HTMLAttributes<HTMLDivElement>;
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const ProfileTab: FC<ProfileTabProps> = forwardRef<
  HTMLDivElement,
  ProfileTabProps
>((props, ref) => {
  const { className, ...rest } = props;
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  function isBeforeInstallPromptEvent(e: Event): e is BeforeInstallPromptEvent {
    return 'prompt' in e && 'userChoice' in e;
  }

  useEffect(() => {
    const handler = (e: Event) => {
      if (isBeforeInstallPromptEvent(e)) {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallButton(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    setShowInstallButton(false);
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        logger('User accepted the A2HS prompt');
      } else {
        logger('User dismissed the A2HS prompt');
      }
      setDeferredPrompt(null);
    });
  };

  const socialContext = useSocial();
  const router = useRouter();

  const onYourProfileClick = () => {
    router.push(`/dashboard/profile/${socialContext?.userProfile?.username}`);
  };

  const onHistoryClick = () => {
    router.push(
      `/dashboard/profile/${socialContext?.userProfile?.username}/history`
    );
  };

  return (
    <div
      className={cn('flex h-full w-full flex-col gap-4', className)}
      ref={ref}
      {...rest}
    >
      <MobileImageButton
        title='Your Profile'
        image={
          socialContext?.userProfile?.profile_icons?.path
            ? `/images/avatars/${socialContext?.userProfile?.profile_icons?.path}`
            : '/images/avatars/default.jpeg'
        }
        onClickHandler={onYourProfileClick}
      />
      <MobileImageButton
        title='History'
        image='/images/dashboard/historyMobile.jpeg'
        onClickHandler={onHistoryClick}
      />
      <MobileImageButton
        title='Add Kyx Gym to your phone'
        image='/images/dashboard/statsMobile.jpeg'
        onClickHandler={handleInstallClick}
        isDisabled={!showInstallButton}
      />
    </div>
  );
});
export default ProfileTab;
