"use client";
import { useEffect } from "react";

export default function ClientWrapper({ children }) {
  useEffect(() => {
    const applyTheme = (mode) => {
      if (typeof document === "undefined") return;
      const root = document.documentElement;
      root.classList.remove("theme-light", "theme-dark");
      root.classList.add(mode === "dark" ? "theme-dark" : "theme-light");
    };

    const initTheme = () => {
      const storedTheme = localStorage.getItem("customerTheme") || "light";
      applyTheme(storedTheme);
    };

    initTheme();

    const handleThemeEvent = () => {
      const storedTheme = localStorage.getItem("customerTheme") || "light";
      applyTheme(storedTheme);
    };

    const handleChunkError = (e) => {
      if (
        e?.message?.includes("Loading chunk") ||
        e?.message?.includes("ChunkLoadError")
      ) {
        window.location.reload();
      }
    };

    window.addEventListener("error", handleChunkError);
    window.addEventListener("storage", handleThemeEvent);
    window.addEventListener("theme-change", handleThemeEvent);
    return () => window.removeEventListener("error", handleChunkError);
  }, []);

  return <>{children}</>;
}
