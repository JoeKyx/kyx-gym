import { Tooltip } from '@radix-ui/react-tooltip';
import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
import { Drawer } from 'vaul';

import logger from '@/lib/logger';
import { getAllAvailableIcons } from '@/lib/supabase-util';

import Button from '@/components/buttons/Button';
import { useSocial } from '@/components/context/SocialContext';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

import { ProfileIcon } from '@/types/UserProfile';

const SelectProfilePictureModal: FC = () => {
  const socialContext = useSocial();
  const userLevel = socialContext?.userProfile?.level;
  const [icons, setIcons] = useState<ProfileIcon[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<ProfileIcon | null>(null);

  useEffect(() => {
    const loadIcons = async () => {
      const allIconsRes = await getAllAvailableIcons();
      if (!allIconsRes.success) {
        logger(allIconsRes.error, 'loadIcons');
        return;
      }
      if (!allIconsRes.data) return;
      setIcons(allIconsRes.data);
      const profileIcon =
        allIconsRes.data.find(
          (icon) => icon.id === socialContext?.userProfile?.profile_icons?.id
        ) || null;
      logger(allIconsRes.data, 'allIconsRes.data');
      logger(
        socialContext?.userProfile?.profile_icons?.id,
        'socialContext?.userProfile?.icon'
      );
      logger(profileIcon, 'profileIcon');
      setSelectedIcon(profileIcon);
    };
    loadIcons();
  }, [socialContext?.userProfile?.profile_icons?.id]);

  const handleIconSelection = (icon: ProfileIcon) => {
    if (!iconUnlocked(icon)) return;

    setSelectedIcon(icon);
  };

  const onConfirm = async () => {
    if (!selectedIcon) return;
    logger(selectedIcon, 'selectedIcon');
    socialContext?.setShowProfilePictureModal(false);
    await socialContext?.updateProfileIcon(selectedIcon);
  };

  const iconUnlocked = (icon: ProfileIcon) => {
    if (icon.required_level && userLevel && icon.required_level > userLevel)
      return false;
    return true;
  };

  const onOpenChangeHandler = (open: boolean) => {
    if (!open) {
      socialContext?.setShowProfilePictureModal(false);
    }
  };

  return (
    <Drawer.Root
      dismissible={true}
      open={socialContext?.showProfilePictureModal}
      onOpenChange={onOpenChangeHandler}
    >
      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 bg-black/40' />
        <Drawer.Content className='fixed bottom-0 left-0 right-0 mt-24 flex flex-col rounded-t-[10px] bg-zinc-100'>
          <div className='mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-300' />

          <div className='flex flex-col gap-4 space-y-4   p-4 md:flex-row md:justify-end md:space-y-0'>
            <div className='flex-1'>
              <Drawer.Title className='mb-4 text-center font-medium md:text-left'>
                Choose your profile icon
              </Drawer.Title>
              <div className='grid grid-cols-3 gap-4 md:grid-cols-5 lg:grid-cols-8'>
                {icons.map((icon) => (
                  <TooltipProvider key={icon.id}>
                    <Tooltip>
                      <TooltipTrigger>
                        <button
                          key={icon.id}
                          className={`rounded-md border p-2 ${
                            icon.required_level &&
                            userLevel &&
                            icon.required_level > userLevel
                              ? 'cursor-not-allowed opacity-50'
                              : 'hover:bg-primary-400 cursor-pointer transition-all duration-300 ease-in-out'
                          } ${
                            selectedIcon?.id === icon.id
                              ? 'border-primary-400 bg-primary-300'
                              : 'border-transparent'
                          }`}
                          onClick={() => handleIconSelection(icon)}
                        >
                          <Image
                            src={`/images/avatars/${icon.path}`}
                            alt={icon.name}
                            width={50}
                            height={50}
                            className='mx-auto'
                          />
                        </button>
                      </TooltipTrigger>
                      {!iconUnlocked(icon) && (
                        <TooltipContent>
                          <p className='text-center'>
                            Level {icon.required_level} required
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>

            {selectedIcon && (
              <div className='flex-1 flex-col justify-between md:mt-auto'>
                {' '}
                {/* Add the md:mt-auto here */}
                <div className='flex items-center space-x-4 pl-12 md:pl-0'>
                  <Image
                    src={`/images/avatars/${selectedIcon.path}`}
                    alt={selectedIcon.name}
                    width={102}
                    height={102}
                    className='border-primary-500 rounded-full border-2'
                  />
                  <div>
                    <div className='font-semibold text-black'>
                      {selectedIcon?.name}
                    </div>
                    <div>{selectedIcon?.description}</div>
                  </div>
                </div>
                <div className='flex items-end justify-end'>
                  <Button onClick={onConfirm}>Set as profile picture</Button>
                </div>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default SelectProfilePictureModal;
