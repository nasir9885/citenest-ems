"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "citenest-ems-theme";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => observer.disconnect();
}

function serverTheme(): Theme {
  return "light";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    currentTheme,
    serverTheme,
  );
  const isDark = theme === "dark";

  function toggleTheme() {
    const nextTheme: Theme = currentTheme() === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Use light mode" : "Use dark mode"}
      title={isDark ? "Use light mode" : "Use dark mode"}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? "☀" : "☾"}
      </span>
      <span className="theme-toggle-label">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
