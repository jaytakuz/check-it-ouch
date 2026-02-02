import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  LogOut,
  Plus,
  Presentation,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Profile components
import ProfileIdentityHeader from "@/components/profile/ProfileIdentityHeader";
import CompetencyRadar from "@/components/profile/CompetencyRadar";
import SkillShowcase from "@/components/profile/SkillShowcase";
import ActivityTimeline from "@/components/profile/ActivityTimeline";

// Mock data
import {
  mockUser,
  calculateCategoryScores,
  calculateAggregatedSkills,
  calculateProfileStats,
  determinePersona,
  generateActivityTimeline,
} from "@/data/profileMockData";

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, getUserRoles, setUserRole } = useAuth();
  const [hasHostRole, setHasHostRole] = useState(false);
  const [hasAttendeeRole, setHasAttendeeRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingRole, setAddingRole] = useState(false);
  const [isPublicView, setIsPublicView] = useState(mockUser.isPublic);

  // Calculate data from mock
  const categoryScores = calculateCategoryScores();
  const aggregatedSkills = calculateAggregatedSkills();
  const profileStats = calculateProfileStats();
  const persona = determinePersona();
  const activityTimeline = generateActivityTimeline();

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

  const handlePinToggle = (skillId: string) => {
    // In production, this would persist to the database
    console.log("Toggle pin for skill:", skillId);
  };

  // Use real user data where available, mock data for profile details
  const profileData = {
    ...mockUser,
    name: user?.user_metadata?.full_name || mockUser.name,
    avatarUrl: user?.user_metadata?.avatar_url,
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

      <div className="max-w-2xl mx-auto px-4 space-y-4 pt-6">
        {/* ZONE 1: Identity & Persona */}
        <ProfileIdentityHeader
          profile={profileData}
          persona={persona}
          stats={profileStats}
          isPublicView={isPublicView}
          onTogglePublicView={setIsPublicView}
        />

        {/* ZONE 2: Competency Radar */}
        <CompetencyRadar skills={categoryScores} />

        {/* ZONE 3: Skill Showcase */}
        <SkillShowcase 
          skills={aggregatedSkills} 
          onPinToggle={handlePinToggle}
        />

        {/* ZONE 4: Activity Timeline */}
        <ActivityTimeline activities={activityTimeline} />

        {/* Roles Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-5 shadow-sm"
        >
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
        </motion.div>

        {/* Sign Out */}
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
