type ButtonProps = {
    label: string;
    variant: 'primary' | 'secondary';
    onClick: () => void;
    disabled?: boolean;
    size?: 'large' | 'small';
  };

export const Button = ({label, onClick, variant, disabled, size="large"}: ButtonProps) => {
    return(
        <button 
        onClick={onClick}
        disabled={disabled}
        className={`rounded-md text-white
        ${size === "small" ? "py-1 px-4 text-sm" : size === "large" ? "px-12 py-2.5 " : ""}
        ${variant === 'primary' ? 'bg-[#0061ff] hover:bg-[#0037B7]' : variant === 'secondary' ? 'border-[1px] border-primary' : ''}
        `}>{label}</button>
    )
}