"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@once-ui-system/core";

export type PartyModeType = "none" | "disco" | "rgb" | "rave" | "music" | "club" | "chill";

interface PartyModeContextType {
  currentMode: PartyModeType;
  setMode: (mode: PartyModeType) => void;
  isActive: boolean;
  customColor: string | null;
  setCustomColor: (color: string) => void;
  resetColors: () => void;
}

const PartyModeContext = createContext<PartyModeContextType | undefined>(undefined);

const RGB_COLORS = ["cyan", "red", "green", "blue", "magenta", "yellow", "orange", "violet"];
const DISCO_INTERVAL = 150; // ms between theme switches
const RGB_INTERVAL = 500; // ms between color changes

// Helper to convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Helper to convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Helper to generate full color scheme from a hex color
function generateColorScheme(hex: string): Record<string, string> {
  const { h, s } = hexToHsl(hex);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Generate palette from dark to light (100 = darkest, 1200 = lightest)
  const palette: Record<string, string> = {
    "--scheme-brand-100": hslToHex(h, s, 5),
    "--scheme-brand-200": hslToHex(h, s, 10),
    "--scheme-brand-300": hslToHex(h, s, 20),
    "--scheme-brand-400": hslToHex(h, s, 30),
    "--scheme-brand-500": hslToHex(h, s, 40),
    "--scheme-brand-600": hslToHex(h, s, 50),
    "--scheme-brand-700": hslToHex(h, s, 60),
    "--scheme-brand-800": hslToHex(h, s, 70),
    "--scheme-brand-900": hslToHex(h, s, 80),
    "--scheme-brand-1000": hslToHex(h, s, 85),
    "--scheme-brand-1100": hslToHex(h, s, 90),
    "--scheme-brand-1200": hslToHex(h, s, 95),
    "--scheme-brand-600-10": `rgba(${r}, ${g}, ${b}, 0.1)`,
    "--scheme-brand-600-30": `rgba(${r}, ${g}, ${b}, 0.3)`,
    "--scheme-brand-600-50": `rgba(${r}, ${g}, ${b}, 0.5)`,
  };

  // Also set the derived brand variables
  const isLight = r * 0.299 + g * 0.587 + b * 0.114 > 186;
  const derivedVars: Record<string, string> = {
    "--brand-solid-strong": hex,
    "--brand-solid-medium": hex,
    "--brand-solid-weak": `rgba(${r}, ${g}, ${b}, 0.8)`,
    "--brand-alpha-strong": `rgba(${r}, ${g}, ${b}, 0.16)`,
    "--brand-alpha-medium": `rgba(${r}, ${g}, ${b}, 0.12)`,
    "--brand-alpha-weak": `rgba(${r}, ${g}, ${b}, 0.08)`,
    "--brand-on-background-strong": hex,
    "--brand-on-background-medium": `rgba(${r}, ${g}, ${b}, 0.8)`,
    "--brand-on-background-weak": `rgba(${r}, ${g}, ${b}, 0.6)`,
    "--brand-on-solid-strong": isLight ? "#000000" : "#ffffff",
    "--brand-on-solid-medium": isLight ? "#333333" : "#e0e0e0",
    "--brand-on-solid-weak": isLight ? "#666666" : "#b0b0b0",
    "--brand-border-strong": hex,
    "--brand-border-medium": `rgba(${r}, ${g}, ${b}, 0.5)`,
    "--brand-border-weak": `rgba(${r}, ${g}, ${b}, 0.3)`,
  };

  return { ...palette, ...derivedVars };
}

export function PartyModeProvider({ children }: { children: React.ReactNode }) {
  const [currentMode, setCurrentMode] = useState<PartyModeType>("none");
  const [customColor, setCustomColorState] = useState<string | null>(null);
  const { setTheme } = useTheme();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const colorIndexRef = useRef(0);
  const originalBrandRef = useRef<string | null>(null);
  const originalCssVarsRef = useRef<Record<string, string>>({});

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

  // Set custom color
  const setCustomColor = useCallback((color: string) => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    // List of all CSS variables we'll override
    const varsToSave = [
      "--scheme-brand-100", "--scheme-brand-200", "--scheme-brand-300",
      "--scheme-brand-400", "--scheme-brand-500", "--scheme-brand-600",
      "--scheme-brand-700", "--scheme-brand-800", "--scheme-brand-900",
      "--scheme-brand-1000", "--scheme-brand-1100", "--scheme-brand-1200",
      "--scheme-brand-600-10", "--scheme-brand-600-30", "--scheme-brand-600-50",
      "--brand-solid-strong", "--brand-solid-medium", "--brand-solid-weak",
      "--brand-alpha-strong", "--brand-alpha-medium", "--brand-alpha-weak",
      "--brand-on-background-strong", "--brand-on-background-medium", "--brand-on-background-weak",
      "--brand-on-solid-strong", "--brand-on-solid-medium", "--brand-on-solid-weak",
      "--brand-border-strong", "--brand-border-medium", "--brand-border-weak",
    ];

    // Save original CSS variables if not already saved
    if (Object.keys(originalCssVarsRef.current).length === 0) {
      varsToSave.forEach((varName) => {
        originalCssVarsRef.current[varName] = computedStyle.getPropertyValue(varName);
      });
    }

    // Apply custom color scheme
    const scheme = generateColorScheme(color);
    Object.entries(scheme).forEach(([varName, value]) => {
      root.style.setProperty(varName, value);
    });

    setCustomColorState(color);
    localStorage.setItem("custom-brand-color", color);
  }, []);

  // Reset colors to original
  const resetColors = useCallback(() => {
    const root = document.documentElement;

    // Remove all custom CSS variable overrides (this lets the theme defaults take over)
    const varsToRemove = [
      "--scheme-brand-100", "--scheme-brand-200", "--scheme-brand-300",
      "--scheme-brand-400", "--scheme-brand-500", "--scheme-brand-600",
      "--scheme-brand-700", "--scheme-brand-800", "--scheme-brand-900",
      "--scheme-brand-1000", "--scheme-brand-1100", "--scheme-brand-1200",
      "--scheme-brand-600-10", "--scheme-brand-600-30", "--scheme-brand-600-50",
      "--brand-solid-strong", "--brand-solid-medium", "--brand-solid-weak",
      "--brand-alpha-strong", "--brand-alpha-medium", "--brand-alpha-weak",
      "--brand-on-background-strong", "--brand-on-background-medium", "--brand-on-background-weak",
      "--brand-on-solid-strong", "--brand-on-solid-medium", "--brand-on-solid-weak",
      "--brand-border-strong", "--brand-border-medium", "--brand-border-weak",
    ];

    varsToRemove.forEach((varName) => {
      root.style.removeProperty(varName);
    });

    // Clear refs and state
    originalCssVarsRef.current = {};
    setCustomColorState(null);
    localStorage.removeItem("custom-brand-color");
  }, []);

  // Load saved custom color on mount
  useEffect(() => {
    const savedColor = localStorage.getItem("custom-brand-color");
    if (savedColor) {
      setCustomColor(savedColor);
    }
  }, [setCustomColor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearActiveInterval();
      restoreOriginalTheme();
    };
  }, [clearActiveInterval, restoreOriginalTheme]);

  const isActive = currentMode !== "none";

  return (
    <PartyModeContext.Provider value={{ currentMode, setMode, isActive, customColor, setCustomColor, resetColors }}>
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
