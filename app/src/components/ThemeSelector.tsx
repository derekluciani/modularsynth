import { PaintBucket } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={currentTheme} onValueChange={onThemeChange}>
        <SelectTrigger className="h-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-100">
          <div className="flex items-center gap-2">
            <PaintBucket className="h-4 w-4" />
            <span className="font-regular text-muted-foreground">Theme:</span>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <SelectItem value="stranger-things">Stranger Things</SelectItem>
          <SelectItem value="minimal">Minimal</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}