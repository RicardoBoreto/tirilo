"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

interface DropdownMenuContextValue {
    open: boolean
    setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined)

const useDropdownMenu = () => {
    const context = React.useContext(DropdownMenuContext)
    if (!context) {
        throw new Error("useDropdownMenu must be used within DropdownMenu")
    }
    return context
}

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false)

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block">
                {children}
            </div>
        </DropdownMenuContext.Provider>
    )
}

const DropdownMenuTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild = false, ...props }, ref) => {
    const { open, setOpen } = useDropdownMenu()
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            ref={ref}
            className={cn(className)}
            onClick={() => setOpen(!open)}
            {...props}
        >
            {children}
        </Comp>
    )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: "start" | "end"
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
    ({ className, align = "end", children, ...props }, ref) => {
        const { open, setOpen } = useDropdownMenu()

        if (!open) return null

        return (
            <>
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                />
                <div
                    ref={ref}
                    className={cn(
                        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md mt-2",
                        "dark:bg-gray-800 dark:border-gray-700",
                        align === "end" ? "right-0" : "left-0",
                        className
                    )}
                    {...props}
                >
                    {children}
                </div>
            </>
        )
    }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, onClick, ...props }, ref) => {
    const { setOpen } = useDropdownMenu()

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                "hover:bg-gray-100 dark:hover:bg-gray-700",
                "focus:bg-gray-100 dark:focus:bg-gray-700",
                className
            )}
            onClick={(e) => {
                onClick?.(e)
                setOpen(false)
            }}
            {...props}
        />
    )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuLabel = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("px-2 py-1.5 text-sm font-semibold", className)}
        {...props}
    />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700", className)}
        {...props}
    />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
}
