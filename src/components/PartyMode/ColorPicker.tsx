"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Row, Column, Text, Button } from "@once-ui-system/core";
import styles from "./ColorPicker.module.scss";

interface ColorPickerProps {
  onColorChange: (color: string) => void;
  initialColor?: string;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  onColorChange,
  initialColor = "#00bcd4",
  label = "Custom Color",
}) => {
  const [color, setColor] = useState(initialColor);
  const [hexInput, setHexInput] = useState(initialColor);

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  };

  const rgb = hexToRgb(color) || { r: 0, g: 188, b: 212 };

  const handleColorChange = useCallback(
    (newColor: string) => {
      setColor(newColor);
      setHexInput(newColor);
      onColorChange(newColor);
    },
    [onColorChange]
  );

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInput(value);

    // Validate and apply if valid hex
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setColor(value);
      onColorChange(value);
    }
  };

  const handleRgbChange = (component: "r" | "g" | "b", value: number) => {
    const newRgb = { ...rgb, [component]: Math.max(0, Math.min(255, value)) };
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    handleColorChange(newHex);
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleColorChange(e.target.value);
  };

  return (
    <Column className={styles.colorPicker} gap="12">
      <Text variant="label-default-s" onBackground="neutral-weak">
        {label}
      </Text>

      {/* Color preview and native picker */}
      <Row gap="12" vertical="center">
        <div className={styles.colorPreviewWrapper}>
          <div
            className={styles.colorPreview}
            style={{ backgroundColor: color }}
          />
          <input
            type="color"
            value={color}
            onChange={handleNativePickerChange}
            className={styles.nativeColorPicker}
            aria-label="Pick a color"
          />
        </div>

        {/* Hex input */}
        <input
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          className={styles.hexInput}
          placeholder="#000000"
          maxLength={7}
          aria-label="Hex color code"
        />
      </Row>

      {/* RGB sliders */}
      <Column gap="8">
        <Row gap="8" vertical="center">
          <Text variant="body-default-xs" className={styles.rgbLabel} style={{ color: "#ff6b6b" }}>
            R
          </Text>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.r}
            onChange={(e) => handleRgbChange("r", parseInt(e.target.value))}
            className={styles.slider}
            style={{ "--slider-color": "#ff6b6b" } as React.CSSProperties}
          />
          <input
            type="number"
            min="0"
            max="255"
            value={rgb.r}
            onChange={(e) => handleRgbChange("r", parseInt(e.target.value) || 0)}
            className={styles.rgbInput}
          />
        </Row>

        <Row gap="8" vertical="center">
          <Text variant="body-default-xs" className={styles.rgbLabel} style={{ color: "#51cf66" }}>
            G
          </Text>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.g}
            onChange={(e) => handleRgbChange("g", parseInt(e.target.value))}
            className={styles.slider}
            style={{ "--slider-color": "#51cf66" } as React.CSSProperties}
          />
          <input
            type="number"
            min="0"
            max="255"
            value={rgb.g}
            onChange={(e) => handleRgbChange("g", parseInt(e.target.value) || 0)}
            className={styles.rgbInput}
          />
        </Row>

        <Row gap="8" vertical="center">
          <Text variant="body-default-xs" className={styles.rgbLabel} style={{ color: "#339af0" }}>
            B
          </Text>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.b}
            onChange={(e) => handleRgbChange("b", parseInt(e.target.value))}
            className={styles.slider}
            style={{ "--slider-color": "#339af0" } as React.CSSProperties}
          />
          <input
            type="number"
            min="0"
            max="255"
            value={rgb.b}
            onChange={(e) => handleRgbChange("b", parseInt(e.target.value) || 0)}
            className={styles.rgbInput}
          />
        </Row>
      </Column>
    </Column>
  );
};
