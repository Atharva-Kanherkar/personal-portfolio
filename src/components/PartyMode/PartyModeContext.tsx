"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@once-ui-system/core";

export type PartyModeType = "none" | "disco" | "rgb" | "rave" | "music" | "club" | "chill";

interface PartyModeContextType {
  currentMode: PartyModeType;
  setMode: (mode: PartyModeType) => void;
  isActive: boolean;
}

const PartyModeContext = createContext<PartyModeContextType | undefined>(undefined);

const RGB_COLORS = ["cyan", "red", "green", "blue", "magenta", "yellow", "orange", "violet"];
const DISCO_INTERVAL = 150; // ms between theme switches
const RGB_INTERVAL = 500; // ms between color changes

export function PartyModeProvider({ children }: { children: React.ReactNode }) {
  const [currentMode, setCurrentMode] = useState<PartyModeType>("none");
  const { setTheme } = useTheme();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const colorIndexRef = useRef(0);
  const originalBrandRef = useRef<string | null>(null);

  const clearActiveInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const restoreOriginalTheme = useCallback(() => {
    if (originalBrandRef.current) {
      document.documentElement.setAttribute("data-brand", originalBrandRef.current);
      localStorage.setItem("data-brand", originalBrandRef.current);
    }
  }, []);

  const startDiscoMode = useCallback(() => {
    let isDark = document.documentElement.getAttribute("data-theme") === "dark";

    intervalRef.current = setInterval(() => {
      isDark = !isDark;
      setTheme(isDark ? "dark" : "light");
    }, DISCO_INTERVAL);
  }, [setTheme]);

  const startRgbMode = useCallback(() => {
    // Save original brand color
    originalBrandRef.current = document.documentElement.getAttribute("data-brand") || "cyan";

    intervalRef.current = setInterval(() => {
      colorIndexRef.current = (colorIndexRef.current + 1) % RGB_COLORS.length;
      const newColor = RGB_COLORS[colorIndexRef.current];
      document.documentElement.setAttribute("data-brand", newColor);
      document.documentElement.setAttribute("data-accent", newColor);
    }, RGB_INTERVAL);
  }, []);

  const startRaveMode = useCallback(() => {
    // Rave = Disco + RGB combined
    originalBrandRef.current = document.documentElement.getAttribute("data-brand") || "cyan";
    let isDark = document.documentElement.getAttribute("data-theme") === "dark";

    intervalRef.current = setInterval(() => {
      isDark = !isDark;
      setTheme(isDark ? "dark" : "light");
      colorIndexRef.current = (colorIndexRef.current + 1) % RGB_COLORS.length;
      const newColor = RGB_COLORS[colorIndexRef.current];
      document.documentElement.setAttribute("data-brand", newColor);
      document.documentElement.setAttribute("data-accent", newColor);
    }, DISCO_INTERVAL);
  }, [setTheme]);

  const setMode = useCallback((mode: PartyModeType) => {
    // Clear any existing intervals
    clearActiveInterval();

    // Restore original theme if switching away from RGB/Rave modes
    if (currentMode === "rgb" || currentMode === "rave") {
      restoreOriginalTheme();
    }

    setCurrentMode(mode);

    // Start the appropriate mode
    switch (mode) {
      case "disco":
        startDiscoMode();
        break;
      case "rgb":
        startRgbMode();
        break;
      case "rave":
        startRaveMode();
        break;
      case "music":
      case "club":
      case "chill":
        // Placeholder for future modes
        console.log(`${mode} mode coming soon!`);
        break;
      case "none":
      default:
        // Already cleared interval above
        break;
    }
  }, [currentMode, clearActiveInterval, restoreOriginalTheme, startDiscoMode, startRgbMode, startRaveMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearActiveInterval();
      restoreOriginalTheme();
    };
  }, [clearActiveInterval, restoreOriginalTheme]);

  const isActive = currentMode !== "none";

  return (
    <PartyModeContext.Provider value={{ currentMode, setMode, isActive }}>
      {children}
    </PartyModeContext.Provider>
  );
}

export function usePartyMode() {
  const context = useContext(PartyModeContext);
  if (context === undefined) {
    throw new Error("usePartyMode must be used within a PartyModeProvider");
  }
  return context;
}
