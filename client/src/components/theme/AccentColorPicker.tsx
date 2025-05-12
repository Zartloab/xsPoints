import React from 'react';
import { useTheme } from './ThemeProvider';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type AccentColor = 'violet' | 'blue' | 'green' | 'orange' | 'rose' | 'amber';

interface ColorOption {
  value: AccentColor;
  label: string;
  bgClass: string;
  textClass: string;
}

const colorOptions: ColorOption[] = [
  { value: 'violet', label: 'Violet', bgClass: 'bg-violet-500', textClass: 'text-violet-500' },
  { value: 'blue', label: 'Blue', bgClass: 'bg-blue-500', textClass: 'text-blue-500' },
  { value: 'green', label: 'Green', bgClass: 'bg-green-500', textClass: 'text-green-500' },
  { value: 'orange', label: 'Orange', bgClass: 'bg-orange-500', textClass: 'text-orange-500' },
  { value: 'rose', label: 'Rose', bgClass: 'bg-rose-500', textClass: 'text-rose-500' },
  { value: 'amber', label: 'Amber', bgClass: 'bg-amber-500', textClass: 'text-amber-500' },
];

export function AccentColorPicker() {
  const { accentColor, setAccentColor } = useTheme();

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Palette className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Change accent color</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Change accent color</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end">
        <div className="p-2">
          <p className="text-sm text-muted-foreground mb-2">Accent Color</p>
          <div className="grid grid-cols-3 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentColor(color.value)}
                className={`
                  flex flex-col items-center justify-center p-1 rounded-md transition-all
                  ${accentColor === color.value ? 'ring-2 ring-offset-2 ring-black dark:ring-white' : 'hover:bg-accent'}
                `}
              >
                <div className={`w-6 h-6 rounded-full ${color.bgClass}`} />
                <span className="text-xs mt-1">{color.label}</span>
              </button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AccentColorPicker;