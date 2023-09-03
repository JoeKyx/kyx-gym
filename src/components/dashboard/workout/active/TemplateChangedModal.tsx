'use client';
import { FC } from 'react';
import { Drawer } from 'vaul';

import Button from '@/components/buttons/Button';

type TemplateChangedModalProps = {
  open: boolean;
  onUpdate: () => void;
  onNoUpdate: () => void;
};

const TemplateChangedModal: FC<TemplateChangedModalProps> = ({
  open,
  onUpdate,
  onNoUpdate,
}) => {
  return (
    <Drawer.Root dismissible={true} open={open}>
      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 bg-black/40' />
        <Drawer.Content className='fixed bottom-0 left-0 right-0 mt-24 flex flex-col rounded-t-[10px] bg-zinc-100'>
          <div className='flex-1 rounded-t-[10px] bg-white p-4 pb-16 md:pb-0'>
            <div className='mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-300' />
            <div className='mx-auto max-w-md'>
              <Drawer.Title className='mb-4 font-medium'>
                Template changed
              </Drawer.Title>
              <p className='mb-2 text-zinc-600'>
                You have changed some of the exercises in this template. Do you
                want to update the template? If you do, the next time you use
                this template, it will have the new exercises or sets. If you
                don't, the template will stay the same as before.
              </p>
              <Button
                type='button'
                variant='primary'
                onClick={onUpdate}
                className='mb-6 w-full rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
              >
                Update Template
              </Button>
              <Button
                type='button'
                onClick={onNoUpdate}
                className='mb-6 w-full rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
              >
                Don't Update
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default TemplateChangedModal;
