"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/Button"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-muted/50">
                <span className="sr-only">Toggle theme</span>
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-10 h-10 relative overflow-hidden transition-all hover:bg-accent hover:text-accent-foreground group"
        >
            <div className="relative w-full h-full flex items-center justify-center">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-amber-500" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-indigo-400" />
            </div>
            <span className="sr-only">Toggle theme</span>
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/5 dark:ring-white/10 group-hover:ring-black/10 dark:group-hover:ring-white/20 transition-all" />
        </Button>
    )
}
