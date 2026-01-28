import { useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";

export function useCompactMode() {
  const { settings } = useSettings();
  useEffect(() => {
    if (settings.compactMode) {
      document.body.classList.add("compact-mode");
    } else {
      document.body.classList.remove("compact-mode");
    }
  }, [settings.compactMode]);
}
