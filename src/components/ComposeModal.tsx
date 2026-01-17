import { useState } from "react";
import { PenLine, Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSent: () => void;
}

export function ComposeModal({ open, onOpenChange, onEmailSent }: ComposeModalProps) {
  const { profile } = useAuth();
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!profile) return;
    
    setError("");

    if (!toEmail.includes("*raveoir.github.io")) {
      setError("Please enter a valid Raveoir email (e.g., user*raveoir.github.io)");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    if (!body.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSending(true);

    // Find recipient profile
    const { data: recipientProfile, error: recipientError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", toEmail)
      .single();

    if (recipientError || !recipientProfile) {
      setError("Recipient not found. Make sure the email is correct.");
      setIsSending(false);
      return;
    }

    // Send email
    const { error: sendError } = await supabase.from("emails").insert({
      from_user_id: profile.id,
      to_user_id: recipientProfile.id,
      subject: subject.trim(),
      body: body.trim(),
    });

    if (sendError) {
      setError("Failed to send email. Please try again.");
      setIsSending(false);
      return;
    }

    toast.success("Email sent successfully!");
    setToEmail("");
    setSubject("");
    setBody("");
    setIsSending(false);
    onEmailSent();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-card animate-slide-up">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <div className="p-2 rounded-lg raven-gradient">
              <PenLine className="h-5 w-5 text-primary-foreground" />
            </div>
            Compose New Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              placeholder="recipient*raveoir.github.io"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className="bg-background border-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-background border-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="bg-background border-input resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending}
              className="raven-gradient text-primary-foreground hover:opacity-90"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
