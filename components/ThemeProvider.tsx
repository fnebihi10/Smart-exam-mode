"use client"

import { useEffect } from "react"

const getPreferredTheme = () => {
  const storedTheme = localStorage.getItem("theme")
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const theme = getPreferredTheme()
      document.documentElement.classList.toggle("dark", theme === "dark")
    } catch {
      // Ignore environments without window/localStorage.
    }
  }, [])

  return children
}
