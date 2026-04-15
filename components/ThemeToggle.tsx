"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

type Theme = "light" | "dark"

const resolveTheme = (): Theme => {
  const storedTheme = localStorage.getItem("theme")
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const initialTheme = resolveTheme()
      setTheme(initialTheme)
      document.documentElement.classList.toggle("dark", initialTheme === "dark")
    } finally {
      setMounted(true)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    localStorage.setItem("theme", nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={mounted && theme === "dark" ? "Kaloni ne drite" : "Kaloni ne erresire"}
      className="icon-shell icon-shell-button h-11 w-11 text-slate-600 transition-transform duration-300 hover:-translate-y-0.5 hover:text-slate-950 active:scale-95 dark:text-slate-300 dark:hover:text-white"
    >
      <span
        className={`flex items-center justify-center transition-transform duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          mounted && theme === "dark" ? "rotate-180 scale-110" : "rotate-0 scale-100"
        }`}
      >
        {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </span>
    </button>
  )
}
