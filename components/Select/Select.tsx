import Select, { type SingleValue, type GroupBase, type OptionsOrGroups } from 'react-select';
// import './select.css';
import React from 'react';
export type SelectOptions = Record<string, any>;
interface SelectBoxProps {
  selectBoxOptions?: OptionsOrGroups<SelectOptions, GroupBase<SelectOptions>>
  label?: string
  hint?: string
  className?: string
  placeholder?: string
  isRequired?: boolean
  isSearchable?: boolean
  isClearable?: boolean
  onChange?: (value: string) => void
  children?: React.ReactNode // Add this line to include children
  NoOptionMessage?: React.ReactNode
  [key: string]: any
}

const SelectBox: React.FC<SelectBoxProps> = ({
  selectBoxOptions,
  label,
  hint,
  headingLevel = 'body1',
  className,
  placeholder = 'Select',
  isRequired,
  isSearchable = false,
  isClearable = false,
  onChange,
  NoOptionMessage = <>No option</>,
  ...props
}) => {
  const handleSelectBoxChange = (selectedOption: SingleValue<SelectOptions>): void => {
    if (onChange != null) {
      onChange(selectedOption?.value as string || '');
    }
  };
  return (
    <div className="flex flex-col gap-1 w-full wise_react_select">
      {label && <label className='text-base text-white'>{label} <span className="text-red-400">{isRequired ? '*' : ''}</span></label>}
      <Select
        placeholder={placeholder}
        className={className && className}
        classNamePrefix="select"
        isClearable={isClearable}
        isSearchable={isSearchable}
        options={selectBoxOptions}
        onChange={handleSelectBoxChange}
        noOptionsMessage={() => <div className="text-left text-grey-base12">{NoOptionMessage}</div>}
        {...props}

      />
    </div>
  );
};

export default SelectBox;
