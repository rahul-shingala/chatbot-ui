import { IconSearch, IconShieldSearch, IconX } from '@tabler/icons-react';
import { FC } from 'react';

import { useTranslation } from 'next-i18next';

interface Props {
  placeholder: string;
  searchTerm: string;
  onSearch: (searchTerm: string) => void;
}
const Search: FC<Props> = ({ placeholder, searchTerm, onSearch }) => {
  const { t } = useTranslation('sidebar');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const clearSearch = () => {
    onSearch('');
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        className="w-full flex-1 rounded-[4px] bg-[rgba(255,255,255,0.12)] border-[1px] border-border01 px-4 py-2.5 pr-10 text-[14px] leading-3 focus-visible:outline-none focus:border-[#e4e4e4] text-white placeholder:text-white placeholder:opacity-50"
        type="text"
        placeholder={t(placeholder) || ''}
        value={searchTerm}
        onChange={handleSearchChange}
      />

      {searchTerm ? (
        <IconX
          className="absolute right-4 cursor-pointer text-neutral-300 hover:text-neutral-400"
          size={18}
          onClick={clearSearch}
        />
      ) : (
        <IconSearch className='absolute right-4 text-neutral-300' size={16}/>
      )}
    </div>
  );
};

export default Search;
