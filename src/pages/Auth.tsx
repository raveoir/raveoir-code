import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import ravenLogo from "@/assets/raven-logo.png";

type AuthMode = "login" | "register";

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, checkEmailExists, getSuggestedEmails } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedEmails, setSuggestedEmails] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const generateEmail = () => {
    if (firstName && lastName) {
      const suggested = `${firstName}${lastName}*raveoir.vercel.app`.toLowerCase().replace(/\s/g, "");
      setEmail(suggested);
    }
  };

  useEffect(() => {
    if (mode === "register" && firstName && lastName) {
      generateEmail();
    }
  }, [firstName, lastName, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuggestedEmails([]);
    setIsLoading(true);

    if (mode === "register") {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Please enter your first and last name");
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setIsLoading(false);
        return;
      }

      const exists = await checkEmailExists(email);
      if (exists) {
        const suggestions = await getSuggestedEmails(firstName, lastName);
        setSuggestedEmails(suggestions);
        setError("This email is already taken. Try one of these suggestions:");
        setIsLoading(false);
        return;
      }

      const { error: signUpError } = await signUp(email, password, firstName, lastName);
      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }
    } else {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
  };

  const selectSuggestedEmail = (suggested: string) => {
    setEmail(suggested);
    setSuggestedEmails([]);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={ravenLogo} 
              alt="Raveoir" 
              className="h-20 w-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground">Raveoir</h1>
          <p className="text-muted-foreground mt-1 italic">Fast as a Raven</p>
        </div>

        <Card className="glass-card border-border/50 shadow-glow">
          <CardHeader className="space-y-1 text-center pb-4">
            <h2 className="text-2xl font-display font-semibold">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "login" 
                ? "Sign in to access your emails" 
                : "Join Raveoir and start sending emails"
              }
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-9 bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-9 bg-background"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    placeholder="JohnDoe*raveoir.vercel.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-background"
                    disabled={mode === "register" && (!firstName || !lastName)}
                  />
                </div>
                {mode === "register" && (
                  <p className="text-xs text-muted-foreground">
                    Format: YourName*raveoir.vercel.app
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 pr-9 bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{error}</p>
                  {suggestedEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {suggestedEmails.map((suggested) => (
                        <Button
                          key={suggested}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => selectSuggestedEmail(suggested)}
                          className="text-xs"
                        >
                          {suggested}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full raven-gradient text-primary-foreground hover:opacity-90 font-medium"
                disabled={isLoading}
              >
                {isLoading
                  ? "Loading..."
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"
                }
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setError("");
                    setSuggestedEmails([]);
                  }}
                  className="ml-1 text-primary hover:underline font-medium"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
