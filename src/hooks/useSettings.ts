import { useState, useEffect } from "react";

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  performanceAlerts: boolean;
  weeklyReport: boolean;
  discordRichPresence: boolean;
  theme: "dark" | "light" | "system";
  language: "pt-BR" | "en-US" | "es-ES";
  autoSave: boolean;
  compactMode: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  emailNotifications: true,
  pushNotifications: true,
  performanceAlerts: true,
  weeklyReport: false,
  discordRichPresence: true,
  theme: "dark",
  language: "pt-BR",
  autoSave: true,
  compactMode: false,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega configurações do localStorage na montagem do componente
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem("userSettings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Salva configurações no localStorage sempre que mudarem
  useEffect(() => {
    if (!isLoaded) return;

    try {
      localStorage.setItem("userSettings", JSON.stringify(settings));
      
      // Aplica o tema
      applyTheme(settings.theme);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }, [settings, isLoaded]);

  const applyTheme = (theme: UserSettings["theme"]) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Invertido: quando usuário escolhe "light", aplicar dark (pois o app é dark por padrão)
    // quando escolhe "dark", aplicar light
    if (theme === "light") {
      root.classList.add("dark");
      body.style.backgroundColor = "#0a0e27";
      body.style.color = "#ffffff";
    } else if (theme === "dark") {
      root.classList.remove("dark");
      body.style.backgroundColor = "#ffffff";
      body.style.color = "#000000";
    } else {
      // Tema do sistema
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
        body.style.backgroundColor = "#0a0e27";
        body.style.color = "#ffffff";
      } else {
        root.classList.remove("dark");
        body.style.backgroundColor = "#ffffff";
        body.style.color = "#000000";
      }
    }
  };

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    
    // Aplicar tema imediatamente se for mudança de tema
    if (key === 'theme') {
      applyTheme(value as UserSettings["theme"]);
    }
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("userSettings");
  };

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    isLoaded,
  };
};
