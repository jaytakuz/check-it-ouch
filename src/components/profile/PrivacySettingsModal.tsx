import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Copy,
  Check,
  ExternalLink,
  Eye,
  LogOut,
  Users,
  Presentation,
  ChevronRight,
} from "lucide-react";
import type { PrivacySettings, UserProfile } from "@/data/profileMockData";

interface PrivacySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  privacySettings: PrivacySettings;
  onPrivacyChange: (settings: PrivacySettings) => void;
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
  onSignOut: () => void;
  hasHostRole: boolean;
  hasAttendeeRole: boolean;
  onAddRole: (role: "host" | "attendee") => void;
  addingRole: boolean;
}

const PrivacySettingsModal = ({
  open,
  onOpenChange,
  profile,
  privacySettings,
  onPrivacyChange,
  onProfileUpdate,
  onSignOut,
  hasHostRole,
  hasAttendeeRole,
  onAddRole,
  addingRole,
}: PrivacySettingsModalProps) => {
  const [copied, setCopied] = useState(false);
  const [localBio, setLocalBio] = useState(profile.bio || "");
  const [localLinkedin, setLocalLinkedin] = useState(profile.linkedinUrl || "");
  const [localGithub, setLocalGithub] = useState(profile.githubUrl || "");

  const publicUrl = `cmu.ac.th/in/${profile.username}`;

  useEffect(() => {
    setLocalBio(profile.bio || "");
    setLocalLinkedin(profile.linkedinUrl || "");
    setLocalGithub(profile.githubUrl || "");
  }, [profile]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopied(true);
    toast.success("Profile URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = () => {
    onProfileUpdate({
      bio: localBio,
      linkedinUrl: localLinkedin,
      githubUrl: localGithub,
    });
    toast.success("Profile updated!");
  };

  const handleToggle = (key: keyof PrivacySettings) => {
    onPrivacyChange({
      ...privacySettings,
      [key]: !privacySettings[key],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Profile Information Section */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Profile Information</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="bio" className="text-xs text-muted-foreground">
                  Bio ({localBio.length}/150)
                </Label>
                <Textarea
                  id="bio"
                  value={localBio}
                  onChange={(e) => setLocalBio(e.target.value.slice(0, 150))}
                  placeholder="Write a short bio..."
                  className="mt-1 h-20 resize-none text-sm"
                />
              </div>
              <div>
                <Label htmlFor="linkedin" className="text-xs text-muted-foreground">
                  LinkedIn URL
                </Label>
                <Input
                  id="linkedin"
                  value={localLinkedin}
                  onChange={(e) => setLocalLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="github" className="text-xs text-muted-foreground">
                  GitHub URL
                </Label>
                <Input
                  id="github"
                  value={localGithub}
                  onChange={(e) => setLocalGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="mt-1 text-sm"
                />
              </div>
              <Button onClick={handleSaveProfile} size="sm" className="w-full mt-2">
                Save Profile
              </Button>
            </div>
          </div>

          <Separator />

          {/* Privacy Settings Section */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Privacy Settings</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Control what others see on your public profile.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Show Competency Radar</span>
                <Switch
                  checked={privacySettings.showRadar}
                  onCheckedChange={() => handleToggle("showRadar")}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Show Key Skills</span>
                <Switch
                  checked={privacySettings.showSkills}
                  onCheckedChange={() => handleToggle("showSkills")}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Show Activity Timeline</span>
                <Switch
                  checked={privacySettings.showTimeline}
                  onCheckedChange={() => handleToggle("showTimeline")}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg ml-4 border-l-2 border-primary/30">
                <div>
                  <span className="text-sm">Show Timeline Details</span>
                  <p className="text-xs text-muted-foreground">
                    Attendance dots, certificates
                  </p>
                </div>
                <Switch
                  checked={privacySettings.showTimelineDetails}
                  onCheckedChange={() => handleToggle("showTimelineDetails")}
                  disabled={!privacySettings.showTimeline}
                />
              </div>
            </div>
          </div>

          {/* Public URL Section */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Public URL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-foreground flex-1 truncate">
                {publicUrl}
              </span>
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                {copied ? (
                  <>
                    <Check size={14} className="mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs text-muted-foreground"
            >
              <Eye size={14} className="mr-1" />
              Preview Public Profile
            </Button>
          </div>

          <Separator />

          {/* Your Roles Section */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Your Roles</h4>
            <div className="space-y-2">
              {/* Attendee Role */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      hasAttendeeRole
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Attendee</p>
                    <p className="text-xs text-muted-foreground">Join events</p>
                  </div>
                </div>
                {hasAttendeeRole ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddRole("attendee")}
                    disabled={addingRole}
                  >
                    Add
                  </Button>
                )}
              </div>

              {/* Host Role */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      hasHostRole
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Presentation size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Host</p>
                    <p className="text-xs text-muted-foreground">Create events</p>
                  </div>
                </div>
                {hasHostRole ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddRole("host")}
                    disabled={addingRole}
                  >
                    Add
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Sign Out - At Bottom with Destructive Color */}
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={onSignOut}
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacySettingsModal;
