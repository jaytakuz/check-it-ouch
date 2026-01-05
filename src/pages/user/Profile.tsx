import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Presentation,
  Users,
  LogOut,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const skillData = [
  { skill: "Frontend", value: 85 },
  { skill: "Backend", value: 65 },
  { skill: "Design", value: 78 },
  { skill: "Data", value: 45 },
  { skill: "DevOps", value: 55 },
  { skill: "Mobile", value: 40 },
];

interface CheckInHistory {
  id: string;
  event_name: string;
  session_date: string;
  checked_in_at: string;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, getUserRoles, setUserRole } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckInHistory[]>([]);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [hasHostRole, setHasHostRole] = useState(false);
  const [hasAttendeeRole, setHasAttendeeRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingRole, setAddingRole] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    // Get user roles
    const { data: roles } = await getUserRoles();
    if (roles) {
      setHasHostRole(roles.some((r: any) => r.role === "host"));
      setHasAttendeeRole(roles.some((r: any) => r.role === "attendee"));
    }

    // Get check-in count
    const { count } = await supabase
      .from("check_ins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    setTotalCheckIns(count || 0);

    // Get recent check-ins with event names
    const { data: checkInsData } = await supabase
      .from("check_ins")
      .select(`
        id,
        session_date,
        checked_in_at,
        events(name)
      `)
      .eq("user_id", user.id)
      .order("checked_in_at", { ascending: false })
      .limit(10);

    if (checkInsData) {
      const mapped = checkInsData.map((ci: any) => ({
        id: ci.id,
        event_name: ci.events?.name || "Unknown Event",
        session_date: ci.session_date,
        checked_in_at: ci.checked_in_at,
      }));
      setCheckIns(mapped);
    }

    setLoading(false);
  };

  const handleAddRole = async (role: "host" | "attendee") => {
    setAddingRole(true);
    const { error } = await setUserRole(role);
    if (error) {
      if (error.message?.includes("duplicate")) {
        toast.info(`You already have the ${role} role!`);
      } else {
        toast.error(`Failed to add ${role} role`);
      }
    } else {
      toast.success(`${role === "host" ? "Host" : "Attendee"} role added!`);
      if (role === "host") setHasHostRole(true);
      if (role === "attendee") setHasAttendeeRole(true);
    }
    setAddingRole(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getUserInitials = () => {
    if (!user) return "?";
    const name = user.user_metadata?.full_name || user.email || "";
    if (name.includes("@")) {
      return name.charAt(0).toUpperCase();
    }
    const parts = name.split(" ");
    return parts.map((p: string) => p.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">My Profile</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Settings size={20} />
          </Button>
        </div>
      </header>

      {/* Profile Header */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
            {getUserInitials()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {user?.user_metadata?.full_name || "User"}
            </h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle2 size={14} className="text-success" />
                <span className="text-foreground font-medium">{totalCheckIns}</span>
                <span className="text-muted-foreground">Check-ins</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Roles Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-2xl mx-auto px-4 mb-6"
      >
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Your Roles</h3>
          <div className="space-y-3">
            {/* Attendee Role */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  hasAttendeeRole ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <Users size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">Attendee</p>
                  <p className="text-xs text-muted-foreground">Join and check-in to events</p>
                </div>
              </div>
              {hasAttendeeRole ? (
                <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">Active</span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => handleAddRole("attendee")} disabled={addingRole}>
                  <Plus size={14} className="mr-1" />
                  Add
                </Button>
              )}
            </div>

            {/* Host Role */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  hasHostRole ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <Presentation size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">Host</p>
                  <p className="text-xs text-muted-foreground">Create and manage events</p>
                </div>
              </div>
              {hasHostRole ? (
                <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">Active</span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => handleAddRole("host")} disabled={addingRole}>
                  <Plus size={14} className="mr-1" />
                  Add
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Skill Radar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto px-4 mb-6"
      >
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Skill Portfolio</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Based on attended events and participation
          </p>
        </div>
      </motion.div>

      {/* Recent History */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Check-ins</h3>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        {checkIns.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-2xl border border-border">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No check-ins yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {checkIns.map((checkIn, index) => (
              <motion.div
                key={checkIn.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-success/10 text-success">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm">{checkIn.event_name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(checkIn.session_date), "MMM d, yyyy")} • {format(parseISO(checkIn.checked_in_at), "h:mm a")}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                  Completed
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Sign Out */}
      <div className="max-w-2xl mx-auto px-4">
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut size={18} className="mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
