import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_color: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  getSuggestedEmails: (firstName: string, lastName: string) => Promise<string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AVATAR_COLORS = [
  "#7c3aed", "#8b5cf6", "#a855f7", "#c084fc", "#6366f1",
  "#4f46e5", "#4338ca", "#5b21b6", "#7e22ce", "#9333ea"
];

const getRandomAvatarColor = () => {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkEmailExists = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .single();
    
    return !!data && !error;
  };

  const getSuggestedEmails = async (firstName: string, lastName: string): Promise<string[]> => {
    const base = `${firstName}${lastName}`.toLowerCase().replace(/\s/g, "");
    const suggestions = [
      `${base}*raveoir.vercel.app`,
      `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}*raveoir.vercel.app`,
      `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}*raveoir.vercel.app`,
      `${base}${Math.floor(Math.random() * 100)}*raveoir.vercel.app`,
      `${base}${new Date().getFullYear()}*raveoir.vercel.app`,
    ];

    const availableSuggestions: string[] = [];
    for (const suggestion of suggestions) {
      const exists = await checkEmailExists(suggestion);
      if (!exists) {
        availableSuggestions.push(suggestion);
      }
      if (availableSuggestions.length >= 3) break;
    }

    return availableSuggestions;
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email: email.replace("*", "@"),
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) return { error };

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        avatar_color: getRandomAvatarColor(),
      });

      if (profileError) return { error: profileError };
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.replace("*", "@"),
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        checkEmailExists,
        getSuggestedEmails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
