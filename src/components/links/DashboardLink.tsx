'use client';
import { Loader } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useState } from 'react';

import { cn } from '@/lib/utils';

import { useSocial } from '@/components/context/SocialContext';
import Heading from '@/components/text/Heading';

interface DashboardLinkProps {
  className?: string;
  text: string;
  image: string;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
}

const DashboardLink: FC<DashboardLinkProps> = ({
  className,
  text,
  href,
  onClick,
  image,
  loading,
}) => {
  const socialContext = useSocial();
  const username = socialContext?.userProfile?.username;
  const [isHovered, setIsHovered] = useState(false);
  if (!username) return null;

  const linkContent = (
    <div className='relative h-48 w-48 overflow-hidden rounded-md'>
      <div className='absolute inset-0 z-10'>
        <Image
          src={image}
          alt={text}
          layout='fill'
          objectFit='cover'
          className='pointer-events-auto scale-100 rounded-md transition-all duration-500 ease-in-out hover:scale-125 hover:cursor-pointer hover:grayscale-0 md:grayscale'
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      </div>
      {loading && (
        <div className='absolute inset-0 z-20 flex items-center justify-center'>
          <Loader size={48} className='text-primary-200 animate-spin' />
        </div>
      )}
      <div className='absolute inset-0 z-10 flex items-end'>
        <Heading
          size='smequal'
          className={`text-primary-200 transition-all duration-500 ease-in-out ${
            isHovered ? 'text-primary-500 opacity-0' : ''
          }`}
        >
          {text}
        </Heading>
      </div>
    </div>
  );

  return href ? (
    <Link
      className={cn(
        'pointer-events-none flex h-48  w-48 items-center justify-center rounded-md border-white bg-white opacity-75 shadow-lg transition-all duration-300',
        className
      )}
      href={href}
    >
      {linkContent}
    </Link>
  ) : (
    <div
      className={cn(
        'pointer-events-none flex h-48  w-48 items-center justify-center rounded-md border-white bg-white opacity-75 shadow-lg transition-all duration-300',
        className
      )}
      onClick={onClick}
    >
      {linkContent}
    </div>
  );
};

export default DashboardLink;
