import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlaskConical, Eye, EyeOff, Microscope, Dna, Bug, KeyRound, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FloatingMicrobes } from "@/components/FloatingMicrobes";

export default function AdminLogin() {
  const { signIn, resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "A password reset link has been sent." });
      setForgotMode(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <FloatingMicrobes count={12} />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Petri dish */}
        <div className="relative mx-auto mb-6 h-36 w-36 animate-in zoom-in-75 duration-700">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 bg-card/50" />
          <div className="absolute inset-3 rounded-full border border-primary/10 border-dashed" />
          <div className="absolute inset-6 rounded-full border border-accent/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            {forgotMode
              ? <KeyRound className="h-12 w-12 text-primary/30" />
              : <Microscope className="h-12 w-12 text-primary/25" />}
          </div>
          <div className="absolute -right-3 top-1/4">
            <Dna className="h-7 w-7 text-accent/20 animate-floating-microbe" />
          </div>
          <div className="absolute -left-2 bottom-1/4">
            <Bug className="h-6 w-6 text-primary/20 animate-floating-microbe" style={{ animationDelay: "3s" }} />
          </div>
        </div>

        <p className="text-center text-xs font-mono text-primary/70 mb-2 tracking-[0.2em] uppercase">
          {forgotMode ? "Recover Credentials" : "Restricted Lab Access"}
        </p>

        <h1 className="text-center text-4xl sm:text-5xl font-bold font-heading mb-2 text-gradient">
            {forgotMode ? "Reset Password" : "Lab Access"}
        </h1>
        <p className="text-center text-sm text-muted-foreground/80 mb-6 max-w-sm mx-auto">
          {forgotMode
            ? "Enter your email and we'll send a recovery link to reset your password."
            : "Authenticate to access the research dashboard."}
        </p>

        <Card className="border-border/50 bg-card/70 backdrop-blur-xl">
          <CardContent className="pt-6">
            <form onSubmit={forgotMode ? handleForgot : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@lab.edu"
                required
                className="bg-secondary/50"
              />
            </div>
            {!forgotMode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-primary/80 hover:text-primary transition-colors"
                    onClick={() => setForgotMode(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-secondary/50"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Analyzing..." : forgotMode ? "Send Reset Link" : "Enter Lab"}
            </Button>
            {forgotMode && (
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setForgotMode(false)}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to login
              </button>
            )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
