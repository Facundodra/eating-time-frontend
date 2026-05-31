"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

import { THEME_STORAGE_KEY, type Theme } from "@/lib/shared/theme";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme | null {
  const theme = localStorage.getItem(THEME_STORAGE_KEY);

  return theme === "dark" || theme === "light" ? theme : null;
}

export default function ThemeToggle() {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    applyTheme(getStoredTheme() ?? getSystemTheme());

    function handleStorageChange(event: StorageEvent) {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = event.newValue === "dark" || event.newValue === "light"
        ? event.newValue
        : getSystemTheme();

      applyTheme(nextTheme);
    }

    function handleSystemThemeChange() {
      if (!getStoredTheme()) {
        applyTheme(getSystemTheme());
      }
    }

    window.addEventListener("storage", handleStorageChange);
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains("dark");
    const nextTheme: Theme = isDark ? "light" : "dark";

    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      title="Cambiar tema"
      aria-label="Cambiar tema"
      onClick={toggleTheme}
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-3xl bg-white text-slate-700 shadow-sm ring-1 ring-gray-100 transition hover:bg-orange-50 hover:text-orange-600 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
    >
      <MoonIcon className="h-5 w-5 dark:hidden" />
      <SunIcon className="hidden h-5 w-5 dark:block" />
    </button>
  );
}
