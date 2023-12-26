

const Input = ({label,placeholder,isRequired}:any) => {
    return(
        <div className="flex flex-col gap-1">
            {label && <label className="text-base text-white">{label} <span className="text-red-400">{isRequired ? '*' : ''}</span></label>}
            <input className="w-full bg-inputbase border-[1px] border-border01 py-2 px-3 focus:outline-none focus:border-[1px] focus:border-primary placeholder:text-white placeholder:opacity-60 rounded-[4px] font-light" placeholder={placeholder} />
        </div>
    )
}

export default Input