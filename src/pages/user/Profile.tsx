import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Profile components
import ProfileIdentityHeader from "@/components/profile/ProfileIdentityHeader";
import CompetencyRadar from "@/components/profile/CompetencyRadar";
import SkillShowcase from "@/components/profile/SkillShowcase";
import ActivityTimeline from "@/components/profile/ActivityTimeline";
import PrivacySettingsModal from "@/components/profile/PrivacySettingsModal";

// Mock data (XP/skills/events still come from mock)
import {
  mockUser,
  calculateCategoryScores,
  calculateAggregatedSkills,
  calculateProfileStats,
  generateActivityTimeline,
  type PrivacySettings,
  type UserProfile,
} from "@/data/profileMockData";

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, getUserRoles, setUserRole } = useAuth();
  const [hasHostRole, setHasHostRole] = useState(false);
  const [hasAttendeeRole, setHasAttendeeRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingRole, setAddingRole] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Profile state - loaded from DB
  const [profileData, setProfileData] = useState<UserProfile>(mockUser);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(mockUser.privacySettings);
  const [sectionOrder, setSectionOrder] = useState<string[]>(mockUser.sectionOrder);

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

  const fetchData = async () => {
    if (!user) return;

    // Fetch roles and profile in parallel
    const [rolesResult, profileResult] = await Promise.all([
      getUserRoles(),
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single(),
    ]);

    if (rolesResult.data) {
      setHasHostRole(rolesResult.data.some((r: any) => r.role === "host"));
      setHasAttendeeRole(rolesResult.data.some((r: any) => r.role === "attendee"));
    }

    if (profileResult.data) {
      const db = profileResult.data as any;
      const dbPrivacy = db.privacy_settings as PrivacySettings | null;
      const dbSectionOrder = db.section_order as string[] | null;

      setProfileData((prev) => ({
        ...prev,
        name: db.full_name || user.user_metadata?.full_name || prev.name,
        avatarUrl: db.avatar_url || user.user_metadata?.avatar_url,
        username: db.username || prev.username,
        bio: db.bio || "",
        linkedinUrl: db.linkedin_url || "",
        githubUrl: db.github_url || "",
        isPublic: db.is_public ?? false,
      }));

      if (dbPrivacy) {
        setPrivacySettings(dbPrivacy);
      }
      if (dbSectionOrder && dbSectionOrder.length > 0) {
        setSectionOrder(dbSectionOrder);
      }
    }

    setLoading(false);
  };

  const saveProfileToDb = async (updates: Record<string, any>) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    if (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save changes");
    }
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
    console.log("Toggle pin for skill:", skillId);
  };

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    setProfileData((prev) => ({ ...prev, ...updates }));
    // Map to DB columns and save
    const dbUpdates: Record<string, any> = {};
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.linkedinUrl !== undefined) dbUpdates.linkedin_url = updates.linkedinUrl;
    if (updates.githubUrl !== undefined) dbUpdates.github_url = updates.githubUrl;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (Object.keys(dbUpdates).length > 0) {
      saveProfileToDb(dbUpdates);
    }
  };

  const handlePrivacyChange = (settings: PrivacySettings) => {
    setPrivacySettings(settings);
    saveProfileToDb({ privacy_settings: settings });
  };

  const handleSectionOrderChange = (order: string[]) => {
    setSectionOrder(order);
    saveProfileToDb({ section_order: order });
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
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">My Competency Passport</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
            <Settings size={20} />
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 space-y-4 pt-6">
        <ProfileIdentityHeader
          profile={profileData}
          stats={profileStats}
          isOwner={true}
          onProfileUpdate={handleProfileUpdate}
        />

        {sectionOrder.map((sectionKey) => {
          if (sectionKey === "radar" && privacySettings.showRadar) {
            return <CompetencyRadar key="radar" skills={categoryScores} />;
          }
          if (sectionKey === "skills" && privacySettings.showSkills) {
            return <SkillShowcase key="skills" skills={aggregatedSkills} onPinToggle={handlePinToggle} />;
          }
          if (sectionKey === "timeline" && privacySettings.showTimeline) {
            return (
              <ActivityTimeline
                key="timeline"
                activities={activityTimeline}
                showDetails={privacySettings.showTimelineDetails}
              />
            );
          }
          return null;
        })}
      </div>

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
        sectionOrder={sectionOrder}
        onSectionOrderChange={handleSectionOrderChange}
      />
    </div>
  );
};

export default UserProfilePage;
