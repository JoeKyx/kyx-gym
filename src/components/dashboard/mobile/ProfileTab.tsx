'use client';
import { useRouter } from 'next/navigation';
import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import { useSocial } from '@/components/context/SocialContext';
import MobileImageButton from '@/components/dashboard/mobile/MobileImageButton';

type ProfileTabProps = HTMLAttributes<HTMLDivElement>;

const ProfileTab: FC<ProfileTabProps> = forwardRef<
  HTMLDivElement,
  ProfileTabProps
>((props, ref) => {
  const { className, ...rest } = props;

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
        title='Stats - Coming Soon'
        image='/images/dashboard/statsMobile.jpeg'
        isDisabled={true}
      />
    </div>
  );
});
export default ProfileTab;
