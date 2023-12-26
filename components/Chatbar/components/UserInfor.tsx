import { IconSettings, IconUser } from "@tabler/icons-react"


export const UserInfo = () => {
    return(
        <div className="border-t-[1px] border-border01 pt-3 flex items-center justify-between gap-2 pr-2">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#b54604]">P</div>
                <div>parul@dhiwise.com</div>
            </div>
            <div>
                <IconSettings size={20} />
            </div>
        </div>
    )
}