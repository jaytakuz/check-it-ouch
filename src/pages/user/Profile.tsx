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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Profile components
import ProfileIdentityHeader from "@/components/profile/ProfileIdentityHeader";
import CompetencyRadar from "@/components/profile/CompetencyRadar";
import SkillShowcase from "@/components/profile/SkillShowcase";
import ActivityTimeline from "@/components/profile/ActivityTimeline";

// ============================================
// MOCK DATA: High Performing Student Scenario
// ============================================
const mockProfileData = {
  name: "Alex Johnson",
  studentId: "6510012345",
  faculty: "Faculty of Engineering",
  avatarUrl: undefined,
  totalEvents: 24,
  certificatesEarned: 8,
  skills: [
    { category: "Technology", count: 18 },
    { category: "Social", count: 12 },
    { category: "Cognitive", count: 14 },
    { category: "Domain", count: 9 },
    { category: "Self-Efficacy", count: 11 },
  ],
};

const mockRadarData = [
  { category: "Technology", score: 65, displayScore: 65 },
  { category: "Social", score: 45, displayScore: 45 },
  { category: "Cognitive", score: 52, displayScore: 52 },
  { category: "Domain", score: 38, displayScore: 38 },
  { category: "Self-Efficacy", score: 48, displayScore: 48 },
];

const mockSkills = [
  { id: "1", name: "Python", count: 8, isVerified: true, isPinned: true, category: "Technology" },
  { id: "2", name: "React", count: 6, isVerified: true, isPinned: false, category: "Technology" },
  { id: "3", name: "Data Analysis", count: 5, isVerified: true, isPinned: true, category: "Cognitive" },
  { id: "4", name: "Team Leadership", count: 4, isVerified: true, isPinned: false, category: "Social" },
  { id: "5", name: "Public Speaking", count: 4, isVerified: false, isPinned: false, category: "Social" },
  { id: "6", name: "Machine Learning", count: 3, isVerified: true, isPinned: false, category: "Technology" },
  { id: "7", name: "Project Management", count: 3, isVerified: true, isPinned: false, category: "Self-Efficacy" },
  { id: "8", name: "UI/UX Design", count: 2, isVerified: false, isPinned: false, category: "Technology" },
  { id: "9", name: "Critical Thinking", count: 4, isVerified: true, isPinned: false, category: "Cognitive" },
  { id: "10", name: "Research Methods", count: 3, isVerified: true, isPinned: false, category: "Domain" },
];

const mockActivities = [
  {
    id: "1",
    eventName: "AI/ML Workshop Series 2025",
    eventDate: "2025-01-15",
    role: "participant" as const,
    sessions: [
      { date: "2025-01-15", status: "present" as const },
      { date: "2025-01-16", status: "present" as const },
      { date: "2025-01-17", status: "present" as const },
      { date: "2025-01-18", status: "present" as const },
      { date: "2025-01-19", status: "present" as const },
    ],
    certificateStatus: "pass" as const,
    attendancePercentage: 100,
  },
  {
    id: "2",
    eventName: "Hackathon: Code for Change",
    eventDate: "2025-01-10",
    role: "staff" as const,
    sessions: [
      { date: "2025-01-10", status: "present" as const },
      { date: "2025-01-11", status: "present" as const },
      { date: "2025-01-12", status: "present" as const },
    ],
    certificateStatus: "pass" as const,
    attendancePercentage: 100,
  },
  {
    id: "3",
    eventName: "Leadership Summit 2025",
    eventDate: "2025-01-05",
    role: "participant" as const,
    sessions: [
      { date: "2025-01-05", status: "present" as const },
      { date: "2025-01-06", status: "absent" as const },
      { date: "2025-01-07", status: "present" as const },
      { date: "2025-01-08", status: "present" as const },
    ],
    certificateStatus: "pass" as const,
    attendancePercentage: 75,
  },
  {
    id: "4",
    eventName: "Cloud Computing Bootcamp",
    eventDate: "2024-12-20",
    role: "participant" as const,
    sessions: [
      { date: "2024-12-20", status: "present" as const },
      { date: "2024-12-21", status: "present" as const },
      { date: "2024-12-22", status: "absent" as const },
      { date: "2024-12-23", status: "absent" as const },
    ],
    certificateStatus: "incomplete" as const,
    attendancePercentage: 50,
  },
];

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, getUserRoles, setUserRole } = useAuth();
  const [hasHostRole, setHasHostRole] = useState(false);
  const [hasAttendeeRole, setHasAttendeeRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingRole, setAddingRole] = useState(false);
  const [isPublicView, setIsPublicView] = useState(false);

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

  // Use real user data where available, mock data for competency features
  const profileData = {
    ...mockProfileData,
    name: user?.user_metadata?.full_name || mockProfileData.name,
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
          isPublicView={isPublicView}
          onTogglePublicView={setIsPublicView}
        />

        {/* ZONE 2: Competency Radar */}
        <CompetencyRadar skills={mockRadarData} />

        {/* ZONE 3: Skill Showcase */}
        <SkillShowcase 
          skills={mockSkills} 
          onPinToggle={handlePinToggle}
        />

        {/* ZONE 4: Activity Timeline */}
        <ActivityTimeline activities={mockActivities} />

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
