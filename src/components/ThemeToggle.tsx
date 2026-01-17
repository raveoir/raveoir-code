import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full hover:bg-secondary"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-muted-foreground" />
      ) : (
        <Sun className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
}
