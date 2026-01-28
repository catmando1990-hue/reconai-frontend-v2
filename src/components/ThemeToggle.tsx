"use client";
import { useTheme } from "./theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="px-3 py-1.5 text-xs rounded border">
      {theme === "light" ? "Dark" : "Light"} Mode
    </button>
  );
}
