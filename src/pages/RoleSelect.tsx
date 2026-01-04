import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";
import { Users, Presentation, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Role = "host" | "attendee";

const RoleSelect = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, setUserRole, getUserRoles } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [primaryRole, setPrimaryRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingRoles, setCheckingRoles] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Check if user already has roles
  useEffect(() => {
    const checkRoles = async () => {
      if (!user) return;
      
      const { data } = await getUserRoles();
      if (data && data.length > 0) {
        // User already has roles, redirect to unified dashboard
        navigate("/dashboard");
      }
      setCheckingRoles(false);
    };
    
    if (user) {
      checkRoles();
    }
  }, [user, getUserRoles, navigate]);

  const roles = [
    {
      id: "host" as Role,
      icon: Presentation,
      title: "Host Events",
      subtitle: "Teacher / Organizer",
      description: "Create events and monitor attendance in real-time",
    },
    {
      id: "attendee" as Role,
      icon: Users,
      title: "Join Events",
      subtitle: "Student / Participant",
      description: "Check in to events and build your attendance portfolio",
    },
  ];

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) => {
      const newRoles = prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role];
      
      // If deselecting the primary role, reset it
      if (primaryRole === role && !newRoles.includes(role)) {
        setPrimaryRole(newRoles[0] || null);
      }
      
      // If only one role selected, make it primary
      if (newRoles.length === 1) {
        setPrimaryRole(newRoles[0]);
      }
      
      return newRoles;
    });
  };

  const handleContinue = async () => {
    if (selectedRoles.length === 0 || !user) return;
    
    setLoading(true);
    
    // Add all selected roles
    for (const role of selectedRoles) {
      const { error } = await setUserRole(role);
      if (error) {
        // Check if it's a duplicate key error (role already exists)
        if (!error.message?.includes("duplicate")) {
          toast.error(`Failed to set ${role} role. Please try again.`);
          setLoading(false);
          return;
        }
      }
    }
    
    toast.success("Roles set successfully!");
    
    // Navigate to unified dashboard
    navigate("/dashboard");
    
    setLoading(false);
  };

  if (authLoading || checkingRoles) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              How will you use Check-in?
            </h1>
            <p className="text-muted-foreground">
              Select one or both roles — you can always switch views later
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {roles.map((role, index) => {
              const isSelected = selectedRoles.includes(role.id);
              const isPrimary = primaryRole === role.id;
              
              return (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  onClick={() => toggleRole(role.id)}
                  className={cn(
                    "w-full p-5 rounded-2xl border-2 text-left transition-all duration-200",
                    "hover:border-primary/50 hover:shadow-md",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <role.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{role.title}</h3>
                          <p className="text-sm text-primary font-medium">{role.subtitle}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check size={14} className="text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Primary role selector - only show if both roles selected */}
          {selectedRoles.length === 2 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 p-4 bg-muted/50 rounded-xl"
            >
              <p className="text-sm font-medium text-foreground mb-3">
                Which view do you prefer to start with?
              </p>
              <div className="flex gap-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setPrimaryRole(role.id)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                      primaryRole === role.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-foreground hover:bg-accent"
                    )}
                  >
                    <role.icon size={16} />
                    {role.id === "host" ? "Host" : "Attendee"}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={selectedRoles.length === 0 || loading}
            onClick={handleContinue}
          >
            {loading ? "Setting up..." : "Continue"}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            You can switch between roles anytime from the dashboard
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RoleSelect;
