import React from 'react';
import ThemeToggle from './ThemeToggle';
import AccentColorPicker from './AccentColorPicker';

export function ThemeControls() {
  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />
      <AccentColorPicker />
    </div>
  );
}

export default ThemeControls;