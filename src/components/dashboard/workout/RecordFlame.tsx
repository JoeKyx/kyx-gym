import { FlameIcon } from 'lucide-react';
import { FC, useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

interface RecordFlameProps {
  isWeight: boolean;
  isVolume: boolean;
  mode: 'history' | 'active';
}

const RecordFlame: FC<RecordFlameProps> = ({ isWeight, isVolume, mode }) => {
  const [open, setOpen] = useState(false);

  const getText = () => {
    if (isWeight && isVolume && mode === 'active')
      return 'You have set a new max Weight and Volume record for this exercise!';
    if (isWeight && isVolume && mode === 'history')
      return 'Max Weight and Volume record for this exercise!';
    if (isWeight && mode === 'active')
      return 'You have set a new max Weight record for this exercise!';
    if (isWeight && mode === 'history')
      return 'Max Weight record for this exercise!';
    if (isVolume && mode === 'active')
      return 'You have set a new max Volume record for this exercise!';
    if (isVolume && mode === 'history')
      return 'Max Volume record for this exercise!';
    else 'WTF';
  };

  if (!isWeight && !isVolume) return null;
  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={() => setOpen(!open)}>
        <TooltipTrigger onClick={() => setOpen(!open)}>
          <FlameIcon className='fill-red-500 text-yellow-500' />
        </TooltipTrigger>
        <TooltipContent>{getText()}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RecordFlame;
