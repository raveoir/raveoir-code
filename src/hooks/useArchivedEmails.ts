import { useState, useEffect, useCallback } from "react";

interface ArchivedEmail {
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

const STORAGE_KEY = "raveoir_archived_emails";

export function useArchivedEmails(userId: string | undefined) {
  const [archivedEmails, setArchivedEmails] = useState<ArchivedEmail[]>([]);

  useEffect(() => {
    if (!userId) return;
    
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (stored) {
      try {
        setArchivedEmails(JSON.parse(stored));
      } catch {
        setArchivedEmails([]);
      }
    }
  }, [userId]);

  const saveToArchive = useCallback((emails: ArchivedEmail[]) => {
    if (!userId) return;
    
    const existing = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    let archived: ArchivedEmail[] = [];
    
    if (existing) {
      try {
        archived = JSON.parse(existing);
      } catch {
        archived = [];
      }
    }
    
    // Merge, avoiding duplicates
    const existingIds = new Set(archived.map(e => e.id));
    const newEmails = emails.filter(e => !existingIds.has(e.id));
    const merged = [...archived, ...newEmails];
    
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(merged));
    setArchivedEmails(merged);
  }, [userId]);

  const removeFromArchive = useCallback((emailId: string) => {
    if (!userId) return;
    
    const updated = archivedEmails.filter(e => e.id !== emailId);
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updated));
    setArchivedEmails(updated);
  }, [userId, archivedEmails]);

  return { archivedEmails, saveToArchive, removeFromArchive };
}
