import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function LogoutModal({ open, onOpenChange, onConfirm }: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    await onConfirm();
    setIsLoggingOut(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card animate-scale-in">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTitle className="text-3xl font-display cursor-help text-primary hover:text-primary/80 transition-colors">
                  Au revoir
                </DialogTitle>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-card border border-border">
                <p className="text-sm">"Goodbye" in French</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground italic text-sm">(pun intended)</p>
          <p className="text-foreground pt-2">
            Are you sure you want to log out?
          </p>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-3 sm:justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoggingOut}
            className="flex-1"
          >
            Stay
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="flex-1 raven-gradient text-primary-foreground hover:opacity-90"
          >
            {isLoggingOut ? "Logging out..." : "Log out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
