import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle, Mail, MailOpen } from "lucide-react";
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
}

export function EmailList({ emails, type, onEmailClick, onRefresh }: EmailListProps) {
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
            className={`flex items-center gap-4 p-4 cursor-pointer transition-all hover:bg-secondary/50 ${
              isUnread ? "bg-raven-subtle/50" : ""
            }`}
          >
            <UserAvatar
              email={displayUser.email}
              color={displayUser.avatar_color}
              size="md"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-medium truncate ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                  {displayUser.first_name} {displayUser.last_name}
                </span>
                {isUnread && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <p className={`truncate ${isUnread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {email.subject}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {email.body.substring(0, 60)}...
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
              </span>

              {type === "inbox" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleReportSpam(e, email)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs px-2"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Spam
                </Button>
              )}

              {type === "spam" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleRemoveSpam(e, email)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs px-2"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Not Spam
                </Button>
              )}

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
