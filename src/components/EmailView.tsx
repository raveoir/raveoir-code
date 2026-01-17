import { ArrowLeft } from "lucide-react";
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
}

export function EmailView({ email, onBack, isSent }: EmailViewProps) {
  const displayUser = isSent ? email.to_user : email.from_user;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-medium truncate">{email.subject}</h2>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-start gap-4">
          <UserAvatar
            email={displayUser.email}
            color={displayUser.avatar_color}
            size="lg"
          />

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-lg">
                  {displayUser.first_name} {displayUser.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {displayUser.email}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(email.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>

            {isSent && (
              <div className="mt-2 text-sm text-muted-foreground">
                To: {email.to_user.first_name} {email.to_user.last_name} ({email.to_user.email})
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {email.body}
          </div>
        </div>
      </div>
    </div>
  );
}
