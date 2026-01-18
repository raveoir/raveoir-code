import { ArrowLeft, Trash2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";

interface EmailViewProps {
  email: {
    id: string;
    subject: string;
    body: string;
    created_at: string;
    from_user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      avatar_color: string;
    };
    to_user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      avatar_color: string;
    };
  };
  onBack: () => void;
  isSent: boolean;
  onDelete?: () => void;
}

export function EmailView({ email, onBack, isSent, onDelete }: EmailViewProps) {
  const displayUser = isSent ? email.to_user : email.from_user;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-medium truncate flex-1">{email.subject}</h2>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete email"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="flex items-start gap-3">
          <UserAvatar
            email={displayUser.email}
            color={displayUser.avatar_color}
            size="md"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-sm">
                  {displayUser.first_name} {displayUser.last_name}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {displayUser.email}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(email.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            {isSent && (
              <div className="mt-1 text-xs text-muted-foreground">
                To: {email.to_user.first_name} {email.to_user.last_name}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
            {email.body}
          </div>
        </div>
      </div>
    </div>
  );
}
