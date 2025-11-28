"use client";

import React, { useState, useRef, useEffect } from "react";
import { Row, Column, Text, ToggleButton, IconButton, Button, Line } from "@once-ui-system/core";
import { usePartyMode, PartyModeType } from "./PartyModeContext";
import { ColorPicker } from "./ColorPicker";
import styles from "./PartyModeToggle.module.scss";

interface ModeOption {
  id: PartyModeType;
  label: string;
  icon: string;
  description: string;
  available: boolean;
}

const MODES: ModeOption[] = [
  { id: "disco", label: "Disco", icon: "sparkles", description: "Rapid dark/light switching", available: true },
  { id: "rgb", label: "RGB", icon: "colorPalette", description: "Cycling colors", available: true },
  { id: "rave", label: "Rave", icon: "bolt", description: "Disco + RGB combined", available: true },
  { id: "music", label: "Music", icon: "music", description: "Coming soon", available: false },
  { id: "club", label: "Club", icon: "users", description: "Coming soon", available: false },
  { id: "chill", label: "Chill", icon: "coffee", description: "Coming soon", available: false },
];

export const PartyModeToggle: React.FC = () => {
  const { currentMode, setMode, isActive, setCustomColor, customColor, resetColors } = usePartyMode();
  const [isOpen, setIsOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleModeSelect = (mode: PartyModeType) => {
    if (currentMode === mode) {
      setMode("none");
    } else {
      setMode(mode);
    }
    setIsOpen(false);
  };

  const handleToggleClick = () => {
    if (isActive) {
      setMode("none");
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <ToggleButton
        prefixIcon="sparkles"
        onClick={handleToggleClick}
        selected={isActive}
        aria-label="Party modes"
        className={isActive ? styles.activeButton : ""}
      />

      {isOpen && (
        <div className={styles.dropdown}>
          <Column
            background="page"
            border="neutral-alpha-weak"
            radius="m"
            shadow="l"
            padding="8"
            gap="4"
          >
            <Text variant="label-default-s" onBackground="neutral-weak" paddingX="8" paddingY="4">
              Party Modes
            </Text>
            {MODES.map((mode) => (
              <Row
                key={mode.id}
                className={`${styles.modeOption} ${!mode.available ? styles.disabled : ""} ${currentMode === mode.id ? styles.selected : ""}`}
                onClick={() => mode.available && handleModeSelect(mode.id)}
                padding="8"
                radius="s"
                gap="12"
                vertical="center"
              >
                <IconButton
                  icon={mode.icon}
                  size="s"
                  variant={currentMode === mode.id ? "primary" : "secondary"}
                />
                <Column gap="2">
                  <Text variant="body-default-s" onBackground={mode.available ? "neutral-strong" : "neutral-weak"}>
                    {mode.label}
                  </Text>
                  <Text variant="body-default-xs" onBackground="neutral-weak">
                    {mode.description}
                  </Text>
                </Column>
              </Row>
            ))}

            <Line background="neutral-alpha-medium" />

            <Row
              className={`${styles.modeOption} ${customColor ? styles.selected : ""}`}
              onClick={() => setShowColorPicker(!showColorPicker)}
              padding="8"
              radius="s"
              gap="12"
              vertical="center"
            >
              <div
                className={styles.colorSwatch}
                style={{ backgroundColor: customColor || "var(--brand-solid-strong)" }}
              />
              <Column gap="2">
                <Text variant="body-default-s" onBackground="neutral-strong">
                  Custom Color
                </Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  Pick any color you want
                </Text>
              </Column>
            </Row>

            {showColorPicker && (
              <Column padding="8" gap="12">
                <ColorPicker
                  initialColor={customColor || "#00bcd4"}
                  onColorChange={(color) => setCustomColor(color)}
                  label="Brand Color"
                />
                <Row gap="8">
                  <Button
                    size="s"
                    variant="secondary"
                    onClick={() => {
                      resetColors();
                      setShowColorPicker(false);
                    }}
                  >
                    Reset
                  </Button>
                </Row>
              </Column>
            )}
          </Column>
        </div>
      )}
    </div>
  );
};
