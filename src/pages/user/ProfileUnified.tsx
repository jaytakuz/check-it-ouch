import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, LogIn, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import ProfileIdentityHeader from "@/components/profile/ProfileIdentityHeader";
import CompetencyRadar from "@/components/profile/CompetencyRadar";
import SkillShowcase from "@/components/profile/SkillShowcase";
import ActivityTimeline from "@/components/profile/ActivityTimeline";
import PrivacySettingsModal from "@/components/profile/PrivacySettingsModal";

import {
  mockUser,
  calculateCategoryScores,
  calculateAggregatedSkills,
  calculateProfileStats,
  generateActivityTimeline,
  type PrivacySettings,
  type UserProfile,
} from "@/data/profileMockData";

const ProfileUnified = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, getUserRoles, setUserRole } = useAuth();

  const [profileData, setProfileData] = useState<UserProfile>(mockUser);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(mockUser.privacySettings);
  const [sectionOrder, setSectionOrder] = useState<string[]>(mockUser.sectionOrder);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasHostRole, setHasHostRole] = useState(false);
  const [hasAttendeeRole, setHasAttendeeRole] = useState(false);
  const [addingRole, setAddingRole] = useState(false);

  const categoryScores = calculateCategoryScores();
  const aggregatedSkills = calculateAggregatedSkills();
  const profileStats = calculateProfileStats();
  const activityTimeline = generateActivityTimeline();

  useEffect(() => {
    // Wait for auth to finish loading before fetching
    if (authLoading) return;

    if (username) {
      // Viewing a specific user's profile by username
      fetchProfileByUsername(username);
    } else if (user) {
      // Viewing own profile (no username in URL)
      fetchOwnProfile();
    } else {
      // Not logged in and no username — redirect to auth
      navigate("/auth");
    }
  }, [username, user, authLoading]);

  const fetchProfileByUsername = async (uname: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", uname)
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const db = data as any;
    const currentIsOwner = !!user && user.id === db.user_id;

    // If not public and not the owner, show not found
    if (!db.is_public && !currentIsOwner) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setIsOwner(currentIsOwner);
    applyProfileData(db);

    if (currentIsOwner) {
      await fetchRoles();
    }

    setLoading(false);
  };

  const fetchOwnProfile = async () => {
    if (!user) return;

    const [profileResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]);

    if (profileResult.data) {
      applyProfileData(profileResult.data as any);
    }

    setIsOwner(true);
    await fetchRoles();
    setLoading(false);
  };

  const fetchRoles = async () => {
    const rolesResult = await getUserRoles();
    if (rolesResult.data) {
      setHasHostRole(rolesResult.data.some((r: any) => r.role === "host"));
      setHasAttendeeRole(rolesResult.data.some((r: any) => r.role === "attendee"));
    }
  };

  const applyProfileData = (db: any) => {
    const ps = db.privacy_settings as PrivacySettings | null;
    const so = db.section_order as string[] | null;

    setProfileData((prev) => ({
      ...prev,
      id: db.id,
      name: db.full_name || "User",
      avatarUrl: db.avatar_url,
      username: db.username || "",
      bio: db.bio || "",
      email: "",
      linkedinUrl: db.linkedin_url || "",
      githubUrl: db.github_url || "",
      isPublic: db.is_public ?? false,
      privacySettings: ps || prev.privacySettings,
      sectionOrder: so || prev.sectionOrder,
    }));

    if (ps) setPrivacySettings(ps);
    if (so && so.length > 0) setSectionOrder(so);
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

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    setProfileData((prev) => ({ ...prev, ...updates }));
    const dbUpdates: Record<string, any> = {};
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.linkedinUrl !== undefined) dbUpdates.linkedin_url = updates.linkedinUrl;
    if (updates.githubUrl !== undefined) dbUpdates.github_url = updates.githubUrl;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (Object.keys(dbUpdates).length > 0) saveProfileToDb(dbUpdates);
  };

  const handlePrivacyChange = (settings: PrivacySettings) => {
    setPrivacySettings(settings);
    saveProfileToDb({ privacy_settings: settings });
  };

  const handleSectionOrderChange = (order: string[]) => {
    setSectionOrder(order);
    saveProfileToDb({ section_order: order });
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

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Not found / private
  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">Competency Passport</h1>
            {!user && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/auth")}>
                <LogIn size={14} />
                Login / Sign Up
              </Button>
            )}
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Profile Not Found</h1>
            <p className="text-sm text-muted-foreground mb-6">
              This profile doesn't exist or is set to private.
            </p>
            <Button onClick={() => navigate("/auth")} className="gap-2">
              <LogIn size={16} />
              Join the Platform
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main profile view
  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOwner && (
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft size={20} />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-foreground">
              {isOwner ? "My Competency Passport" : "Competency Passport"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isOwner ? (
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                <Settings size={20} />
              </Button>
            ) : !user ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/auth")}>
                <LogIn size={14} />
                Login / Sign Up
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 space-y-4 pt-6">
        <ProfileIdentityHeader
          profile={profileData}
          stats={profileStats}
          isOwner={isOwner}
          onProfileUpdate={isOwner ? handleProfileUpdate : undefined}
        />

        {sectionOrder.map((sectionKey) => {
          if (sectionKey === "radar" && privacySettings.showRadar) {
            return <CompetencyRadar key="radar" skills={categoryScores} />;
          }
          if (sectionKey === "skills" && privacySettings.showSkills) {
            return <SkillShowcase key="skills" skills={aggregatedSkills} onPinToggle={isOwner ? handlePinToggle : () => {}} />;
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
          sectionOrder={sectionOrder}
          onSectionOrderChange={handleSectionOrderChange}
        />
      )}
    </div>
  );
};

export default ProfileUnified;
