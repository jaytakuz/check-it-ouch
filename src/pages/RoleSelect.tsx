import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";
import { Users, Presentation, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Role = "host" | "user" | null;

const RoleSelect = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  const roles = [
    {
      id: "host" as Role,
      icon: Presentation,
      title: "I'm a Host",
      subtitle: "Teacher / Organizer",
      description: "Create events and monitor attendance in real-time",
    },
    {
      id: "user" as Role,
      icon: Users,
      title: "I'm an Attendee",
      subtitle: "Student / Participant",
      description: "Check in to events and build your attendance portfolio",
    },
  ];

  const handleContinue = () => {
    if (selectedRole === "host") {
      navigate("/host/dashboard");
    } else {
      navigate("/user/dashboard");
    }
  };

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
              Select your primary role to get started
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {roles.map((role, index) => (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "w-full p-5 rounded-2xl border-2 text-left transition-all duration-200",
                  "hover:border-primary/50 hover:shadow-md",
                  selectedRole === role.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                      selectedRole === role.id
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
                      {selectedRole === role.id && (
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
            ))}
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!selectedRole}
            onClick={handleContinue}
          >
            Continue
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            You can switch roles anytime from settings
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RoleSelect;
