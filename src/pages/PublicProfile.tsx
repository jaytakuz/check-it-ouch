import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

import ProfileIdentityHeader from "@/components/profile/ProfileIdentityHeader";
import CompetencyRadar from "@/components/profile/CompetencyRadar";
import SkillShowcase from "@/components/profile/SkillShowcase";
import ActivityTimeline from "@/components/profile/ActivityTimeline";

import {
  calculateCategoryScores,
  calculateAggregatedSkills,
  calculateProfileStats,
  generateActivityTimeline,
  type PrivacySettings,
  type UserProfile,
} from "@/data/profileMockData";

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [sectionOrder, setSectionOrder] = useState<string[]>(["radar", "skills", "timeline"]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const categoryScores = calculateCategoryScores();
  const aggregatedSkills = calculateAggregatedSkills();
  const profileStats = calculateProfileStats();
  const activityTimeline = generateActivityTimeline();

  useEffect(() => {
    if (!username) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    fetchPublicProfile();
  }, [username]);

  const fetchPublicProfile = async () => {
    // Check if current user is viewing their own profile
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const db = data as any;

    // If not public and not the owner, show not found
    if (!db.is_public && (!currentUser || currentUser.id !== db.user_id)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // If current user is the owner, redirect to their profile page
    if (currentUser && currentUser.id === db.user_id) {
      setIsOwnProfile(true);
    }

    setProfile({
      id: db.id,
      name: db.full_name || "User",
      studentId: "",
      faculty: "",
      avatarUrl: db.avatar_url,
      username: db.username || "",
      bio: db.bio || "",
      email: "",
      linkedinUrl: db.linkedin_url || "",
      githubUrl: db.github_url || "",
      isPublic: true,
      privacySettings: db.privacy_settings || { showRadar: true, showSkills: true, showTimeline: true, showTimelineDetails: true },
      sectionOrder: db.section_order || ["radar", "skills", "timeline"],
    });

    const ps = db.privacy_settings as PrivacySettings | null;
    setPrivacySettings(ps || { showRadar: true, showSkills: true, showTimeline: true, showTimelineDetails: true });
    setSectionOrder(db.section_order || ["radar", "skills", "timeline"]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !profile || !privacySettings) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">Competency Passport</h1>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/auth")}>
              <LogIn size={14} />
              Login / Sign Up
            </Button>
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

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Competency Passport</h1>
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <Button variant="outline" size="sm" onClick={() => navigate("/user/profile")}>
                Edit Profile
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/auth")}>
                <LogIn size={14} />
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 space-y-4 pt-6">
        <ProfileIdentityHeader
          profile={profile}
          stats={profileStats}
          isOwner={false}
        />

        {sectionOrder.map((sectionKey) => {
          if (sectionKey === "radar" && privacySettings.showRadar) {
            return <CompetencyRadar key="radar" skills={categoryScores} />;
          }
          if (sectionKey === "skills" && privacySettings.showSkills) {
            return <SkillShowcase key="skills" skills={aggregatedSkills} onPinToggle={() => {}} />;
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
    </div>
  );
};

export default PublicProfile;
