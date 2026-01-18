import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Send, AlertTriangle, PenLine, LogOut, RefreshCw, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { LogoutModal } from "@/components/LogoutModal";
import { ComposeModal } from "@/components/ComposeModal";
import { EmailList } from "@/components/EmailList";
import { EmailView } from "@/components/EmailView";
import { supabase } from "@/integrations/supabase/client";
import { useArchivedEmails } from "@/hooks/useArchivedEmails";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import ravenLogo from "@/assets/raven-logo.png";

type Tab = "inbox" | "sent" | "spam" | "archived";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [showLogout, setShowLogout] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [spamUserIds, setSpamUserIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { archivedEmails, saveToArchive, removeFromArchive } = useArchivedEmails(profile?.id);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const fetchSpamUserIds = useCallback(async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from("spam_reports")
      .select("reported_user_id")
      .eq("reporter_user_id", profile.id);
    
    if (data) {
      setSpamUserIds(data.map((r) => r.reported_user_id));
    }
  }, [profile]);

  const fetchEmails = useCallback(async () => {
    if (!profile) return;
    setIsRefreshing(true);

    await fetchSpamUserIds();

    const { data, error } = await supabase
      .from("emails")
      .select(`
        id,
        subject,
        body,
        is_read,
        created_at,
        from_user:from_user_id (id, email, first_name, last_name, avatar_color),
        to_user:to_user_id (id, email, first_name, last_name, avatar_color)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const typedData = data as unknown as EmailData[];
      
      // Auto-archive emails older than 3 days
      const now = new Date();
      const oldEmails = typedData.filter(email => 
        differenceInDays(now, new Date(email.created_at)) >= 3 &&
        (email.to_user.id === profile.id || email.from_user.id === profile.id)
      );
      
      if (oldEmails.length > 0) {
        // Save to local storage archive
        saveToArchive(oldEmails);
        
        // Delete old emails from database
        const oldEmailIds = oldEmails.map(e => e.id);
        await supabase
          .from("emails")
          .delete()
          .in("id", oldEmailIds);
        
        // Filter out old emails from current view
        setEmails(typedData.filter(e => !oldEmailIds.includes(e.id)));
      } else {
        setEmails(typedData);
      }
    }
    setIsRefreshing(false);
  }, [profile, fetchSpamUserIds, saveToArchive]);

  const handleDeleteEmail = async (email: EmailData) => {
    const { error } = await supabase
      .from("emails")
      .delete()
      .eq("id", email.id);
    
    if (error) {
      toast.error("Failed to delete email");
      return;
    }
    
    toast.success("Email deleted");
    setSelectedEmail(null);
    fetchEmails();
  };

  useEffect(() => {
    if (profile) {
      fetchEmails();
    }
  }, [profile, fetchEmails]);

  // Subscribe to realtime email updates
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel("emails-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emails",
        },
        () => {
          fetchEmails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, fetchEmails]);

  const handleLogout = async () => {
    await signOut();
    setShowLogout(false);
    navigate("/auth");
  };

  const getFilteredEmails = () => {
    if (!profile) return [];

    switch (activeTab) {
      case "inbox":
        return emails.filter(
          (e) => 
            e.to_user.id === profile.id && 
            !spamUserIds.includes(e.from_user.id)
        );
      case "sent":
        return emails.filter((e) => e.from_user.id === profile.id);
      case "spam":
        return emails.filter(
          (e) => 
            e.to_user.id === profile.id && 
            spamUserIds.includes(e.from_user.id)
        );
      case "archived":
        return archivedEmails;
      default:
        return [];
    }
  };

  const tabs = [
    { id: "inbox" as Tab, label: "Inbox", icon: Inbox },
    { id: "sent" as Tab, label: "Sent", icon: Send },
    { id: "spam" as Tab, label: "Spam", icon: AlertTriangle },
    { id: "archived" as Tab, label: "Archived", icon: Archive },
  ];

  const unreadCount = emails.filter(
    (e) => 
      profile && 
      e.to_user.id === profile.id && 
      !e.is_read && 
      !spamUserIds.includes(e.from_user.id)
  ).length;

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-pulse">
          <img src={ravenLogo} alt="Raveoir" className="h-16 w-16 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 sidebar-gradient border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={ravenLogo} alt="Raveoir" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Raveoir</h1>
              <p className="text-xs text-muted-foreground italic">Fast as a Raven</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Button
            onClick={() => setShowCompose(true)}
            className="w-full raven-gradient text-primary-foreground hover:opacity-90 gap-2 font-medium shadow-soft"
          >
            <PenLine className="h-4 w-4" />
            Compose
          </Button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedEmail(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
                {tab.id === "inbox" && unreadCount > 0 && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <UserAvatar
              email={profile.email}
              color={profile.avatar_color}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLogout(true)}
              className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <h2 className="text-xl font-display font-semibold capitalize">
            {activeTab}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchEmails}
            disabled={isRefreshing}
            className="rounded-full"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </header>

        <div className="flex-1 overflow-hidden">
          {selectedEmail ? (
            <EmailView
              email={selectedEmail}
              onBack={() => setSelectedEmail(null)}
              isSent={activeTab === "sent"}
              onDelete={activeTab !== "archived" ? () => handleDeleteEmail(selectedEmail) : undefined}
            />
          ) : (
            <div className="h-full overflow-auto">
              <EmailList
                emails={getFilteredEmails()}
                type={activeTab === "archived" ? "inbox" : activeTab}
                onEmailClick={setSelectedEmail}
                onRefresh={fetchEmails}
                onDelete={activeTab !== "archived" ? handleDeleteEmail : undefined}
              />
            </div>
          )}
        </div>
      </main>

      <LogoutModal
        open={showLogout}
        onOpenChange={setShowLogout}
        onConfirm={handleLogout}
      />

      <ComposeModal
        open={showCompose}
        onOpenChange={setShowCompose}
        onEmailSent={fetchEmails}
      />
    </div>
  );
}
