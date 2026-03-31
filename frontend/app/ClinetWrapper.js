"use client";
import { useEffect } from "react";

export default function ClientWrapper({ children }) {
  useEffect(() => {
    const handleChunkError = (e) => {
      if (
        e?.message?.includes("Loading chunk") ||
        e?.message?.includes("ChunkLoadError")
      ) {
        window.location.reload();
      }
    };

    window.addEventListener("error", handleChunkError);
    return () => window.removeEventListener("error", handleChunkError);
  }, []);

  return <>{children}</>;
}
