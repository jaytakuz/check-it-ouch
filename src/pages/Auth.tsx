import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { PageLoading } from "@/components/ui/PageLoading";

const authSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { user, loading: authLoading, signUp, signIn, getUserRoles } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (!authLoading && user) {
        // If there's a redirect URL, go there
        if (redirectTo) {
          navigate(redirectTo);
          return;
        }
        // Check if user has roles
        const { data: roles } = await getUserRoles();
        if (roles && roles.length > 0) {
          navigate("/dashboard");
        } else {
          navigate("/role-select");
        }
      }
    };
    checkAuthAndRedirect();
  }, [user, authLoading, navigate, getUserRoles, redirectTo]);

  const validateForm = () => {
    try {
      if (mode === "signup") {
        authSchema.parse(formData);
      } else {
        authSchema.omit({ name: true }).parse(formData);
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (mode === "signup") {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
          setLoading(false);
          return;
        }
        toast.success("Account created successfully!");
        // New users go to role selection
        navigate("/role-select");
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(error.message);
          }
          setLoading(false);
          return;
        }
        toast.success("Welcome back!");
        // Existing users go to dashboard (Auth useEffect will handle redirect)
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    }
    
    setLoading(false);
  };

  if (authLoading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {mode === "login" ? "Welcome back" : mode === "forgot" ? "Reset Password" : "Create your account"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "login"
                ? "Sign in to continue to Check-in"
                : mode === "forgot"
                ? "Enter your email to receive a reset link"
                : "Get started with verified attendance"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
            )}

            {mode === "forgot" ? (
              <ForgotPasswordForm
                email={formData.email}
                onEmailChange={(email) => setFormData({ ...formData, email })}
                loading={forgotLoading}
                sent={forgotSent}
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!formData.email) {
                    toast.error("Please enter your email address");
                    return;
                  }
                  setForgotLoading(true);
                  const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) {
                    toast.error(error.message);
                  } else {
                    setForgotSent(true);
                    toast.success("Password reset link sent to your email");
                  }
                  setForgotLoading(false);
                }}
                onBack={() => { setMode("login"); setForgotSent(false); }}
              />
            ) : (
              <>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </>
            )}
          </form>

          {mode !== "forgot" && (
            <>
              {mode === "login" && (
                <div className="text-center mt-3">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-primary hover:underline"
                    onClick={() => { setMode("forgot"); setForgotSent(false); }}
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
              <p className="text-center text-sm text-muted-foreground mt-4">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline"
                      onClick={() => setMode("signup")}
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline"
                      onClick={() => setMode("login")}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Forgot Password sub-form component
const ForgotPasswordForm = ({
  email,
  onEmailChange,
  loading,
  sent,
  onSubmit,
  onBack,
}: {
  email: string;
  onEmailChange: (email: string) => void;
  loading: boolean;
  sent: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) => {
  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <Mail size={24} className="text-success" />
        </div>
        <p className="text-sm text-muted-foreground">
          We've sent a password reset link to <strong className="text-foreground">{email}</strong>. Check your inbox and follow the link to reset your password.
        </p>
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft size={16} /> Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button type="submit" className="w-full" size="lg" disabled={loading} onClick={onSubmit}>
        {loading ? "Sending..." : "Send Reset Link"}
      </Button>
      <Button variant="ghost" className="w-full gap-2" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Sign In
      </Button>
    </div>
  );
};

export default Auth;
