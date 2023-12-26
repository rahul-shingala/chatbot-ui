import { IconRobot } from '@tabler/icons-react';
import Image from 'next/image';
import { FC } from 'react';

interface Props { }

export const ChatLoader: FC<Props> = () => {
  return (
    <div
      className="group "
      style={{ overflowWrap: 'anywhere' }}
    >
      <div className="m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
        <div className='w-8 h-8 flex items-center justify-center bg-white rounded-full'>
              <Image src="/logo.png"
                alt="image"
                width={16}
                height={16}
              />
            </div>
        <span className="animate-pulse cursor-default mt-1">▍</span>
      </div>
    </div>
  );
};
