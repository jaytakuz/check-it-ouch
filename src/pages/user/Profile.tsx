import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Profile components
import ProfileIdentityHeader from "@/components/profile/ProfileIdentityHeader";
import CompetencyRadar from "@/components/profile/CompetencyRadar";
import SkillShowcase from "@/components/profile/SkillShowcase";
import ActivityTimeline from "@/components/profile/ActivityTimeline";
import PrivacySettingsModal from "@/components/profile/PrivacySettingsModal";

// Mock data
import {
  mockUser,
  calculateCategoryScores,
  calculateAggregatedSkills,
  calculateProfileStats,
  generateActivityTimeline,
  IS_OWNER,
  type PrivacySettings,
  type UserProfile,
} from "@/data/profileMockData";

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, getUserRoles, setUserRole } = useAuth();
  const [hasHostRole, setHasHostRole] = useState(false);
  const [hasAttendeeRole, setHasAttendeeRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingRole, setAddingRole] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Owner mode - controls visibility of edit controls
  const isOwner = IS_OWNER;

  // Profile state with local updates
  const [profileData, setProfileData] = useState<UserProfile>(mockUser);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(mockUser.privacySettings);

  // Calculate data from mock
  const categoryScores = calculateCategoryScores();
  const aggregatedSkills = calculateAggregatedSkills();
  const profileStats = calculateProfileStats();
  const activityTimeline = generateActivityTimeline();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, authLoading, navigate]);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        avatarUrl: user.user_metadata?.avatar_url,
      }));
    }
  }, [user]);

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

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    setProfileData((prev) => ({ ...prev, ...updates }));
  };

  const handlePrivacyChange = (settings: PrivacySettings) => {
    setPrivacySettings(settings);
    // In production, persist to database
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
            <h1 className="text-lg font-semibold text-foreground">My Competency Passport</h1>
          </div>
          {isOwner && (
            <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings size={20} />
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 space-y-4 pt-6">
        {/* ZONE 1: Identity Header */}
        <ProfileIdentityHeader
          profile={profileData}
          stats={profileStats}
        />

        {/* ZONE 2: Competency Radar */}
        {privacySettings.showRadar && (
          <CompetencyRadar skills={categoryScores} />
        )}

        {/* ZONE 3: Skill Showcase */}
        {privacySettings.showSkills && (
          <SkillShowcase skills={aggregatedSkills} onPinToggle={handlePinToggle} isOwner={isOwner} />
        )}

        {/* ZONE 4: Activity Timeline */}
        {privacySettings.showTimeline && (
          <ActivityTimeline 
            activities={activityTimeline} 
            showDetails={privacySettings.showTimelineDetails}
          />
        )}
      </div>

      {/* Settings Modal */}
      {isOwner && (
        <PrivacySettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          profile={profileData}
          privacySettings={privacySettings}
          onPrivacyChange={handlePrivacyChange}
          onProfileUpdate={handleProfileUpdate}
          onSignOut={handleSignOut}
          hasHostRole={hasHostRole}
          hasAttendeeRole={hasAttendeeRole}
          onAddRole={handleAddRole}
          addingRole={addingRole}
        />
      )}
    </div>
  );
};

export default UserProfile;
