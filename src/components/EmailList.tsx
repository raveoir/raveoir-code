import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle, Mail, MailOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EmailData {
  id: string;
  subject: string;
  body: string;
  is_read: boolean;
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
}

interface EmailListProps {
  emails: EmailData[];
  type: "inbox" | "sent" | "spam";
  onEmailClick: (email: EmailData) => void;
  onRefresh: () => void;
  onDelete?: (email: EmailData) => void;
}

export function EmailList({ emails, type, onEmailClick, onRefresh, onDelete }: EmailListProps) {
  const { profile } = useAuth();

  const handleReportSpam = async (e: React.MouseEvent, email: EmailData) => {
    e.stopPropagation();
    if (!profile) return;

    const { error } = await supabase.from("spam_reports").insert({
      reporter_user_id: profile.id,
      reported_user_id: email.from_user.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You already reported this sender as spam");
      } else {
        toast.error("Failed to report as spam");
      }
      return;
    }

    toast.success("Reported as spam");
    onRefresh();
  };

  const handleRemoveSpam = async (e: React.MouseEvent, email: EmailData) => {
    e.stopPropagation();
    if (!profile) return;

    const { error } = await supabase
      .from("spam_reports")
      .delete()
      .eq("reporter_user_id", profile.id)
      .eq("reported_user_id", email.from_user.id);

    if (error) {
      toast.error("Failed to remove from spam");
      return;
    }

    toast.success("Removed from spam");
    onRefresh();
  };

  const handleDelete = async (e: React.MouseEvent, email: EmailData) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(email);
    }
  };

  const handleEmailClick = async (email: EmailData) => {
    if (type === "inbox" && !email.is_read) {
      await supabase
        .from("emails")
        .update({ is_read: true })
        .eq("id", email.id);
    }
    onEmailClick(email);
  };

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Mail className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg">No emails here</p>
        <p className="text-sm">
          {type === "inbox" && "Your inbox is empty"}
          {type === "sent" && "You haven't sent any emails yet"}
          {type === "spam" && "No spam emails"}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {emails.map((email) => {
        const displayUser = type === "sent" ? email.to_user : email.from_user;
        const isUnread = type === "inbox" && !email.is_read;

        return (
          <div
            key={email.id}
            onClick={() => handleEmailClick(email)}
            className={`flex items-center gap-3 p-3 cursor-pointer transition-all hover:bg-secondary/50 ${
              isUnread ? "bg-raven-subtle/50" : ""
            }`}
          >
            <UserAvatar
              email={displayUser.email}
              color={displayUser.avatar_color}
              size="sm"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium truncate ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                  {displayUser.first_name} {displayUser.last_name}
                </span>
                {isUnread && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
              <p className={`text-sm truncate ${isUnread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {email.subject}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {email.body.substring(0, 50)}...
              </p>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
              </span>

              {type === "inbox" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleReportSpam(e, email)}
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Report as spam"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                </Button>
              )}

              {type === "spam" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleRemoveSpam(e, email)}
                  className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  title="Not spam"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(e, email)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>

              {isUnread ? (
                <Mail className="h-4 w-4 text-primary" />
              ) : (
                <MailOpen className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
