import { IconArrowBarLeft, IconArrowBarRight, IconArrowsCross, IconCircuitSwitchClosed, IconLayoutSidebar, IconLayoutSidebarLeftCollapse, IconLayoutSidebarRight } from '@tabler/icons-react';
import Image from 'next/image';

interface Props {
  onClick: any;
  side: 'left' | 'right';
}

export const CloseSidebarButton = ({ onClick, side }: Props) => {
  return (
    <>
      <button
        className={`fixed top-1.5 flex items-center py-1.5 px-3 gap-1 text-xs rounded-md ${
          side === 'right' ? 'right-[270px]' : 'left-[260px]'
        } z-50 hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:${
          side === 'right' ? 'right-[270px]' : 'left-[260px]'
        } sm:text-neutral-700`}
        onClick={onClick}
      >
        {side === 'right' ? <IconArrowBarRight /> : <div className='w-6 h-6 rounded-full flex items-center justify-center border-[1px] border-border01 bg-[rgba(255,255,255,0.10)]'>
          <Image
          src="/close.svg"
          width={12}
          height={12}
          alt="close"
          /></div>}
        Hide Chat History
      </button>
      <div
        onClick={onClick}
        className="absolute top-0 left-0 z-10 h-full w-full bg-black opacity-70 sm:hidden"
      ></div>
    </>
  );
};

export const OpenSidebarButton = ({ onClick, side }: Props) => {
  return (
    <button
      className={`fixed z-[2] top-2 flex items-center py-1.5 px-3 gap-1 bg-[rgba(255,255,255,0.10)] border-[1px] border-border01 text-xs rounded-md ${
        side === 'right' ? 'right-2' : 'left-2'
      } text-white hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:${
        side === 'right' ? 'right-2' : 'left-2'
      }  sm:text-neutral-700`}
      onClick={onClick}
    >
      {side === 'right' ? <IconArrowBarLeft /> : <IconLayoutSidebar size={18} />}
      Show Chat History
    </button>
  );
};
