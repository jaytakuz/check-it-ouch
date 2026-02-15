import { useState, useEffect } from "react";
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
  ArrowUp,
  ArrowDown,
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
  sectionOrder: string[];
  onSectionOrderChange: (order: string[]) => void;
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
  sectionOrder,
  onSectionOrderChange,
}: PrivacySettingsModalProps) => {
  const [copied, setCopied] = useState(false);
  const [localBio, setLocalBio] = useState(profile.bio || "");
  const [localLinkedin, setLocalLinkedin] = useState(profile.linkedinUrl || "");
  const [localGithub, setLocalGithub] = useState(profile.githubUrl || "");

  const publicUrl = `${window.location.origin}/p/${profile.username}`;

  useEffect(() => {
    setLocalBio(profile.bio || "");
    setLocalLinkedin(profile.linkedinUrl || "");
    setLocalGithub(profile.githubUrl || "");
  }, [profile]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = () => {
    onProfileUpdate({
      bio: localBio,
      linkedinUrl: localLinkedin,
      githubUrl: localGithub,
    });
    toast.success("Profile saved!");
  };

  const handleToggle = (key: keyof PrivacySettings) => {
    onPrivacyChange({
      ...privacySettings,
      [key]: !privacySettings[key],
    });
  };

  const handlePublicToggle = () => {
    onProfileUpdate({ isPublic: !profile.isPublic });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Profile Information */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Profile Information</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="bio" className="text-xs text-muted-foreground">Bio ({localBio.length}/150)</Label>
                <Textarea
                  id="bio"
                  value={localBio}
                  onChange={(e) => setLocalBio(e.target.value.slice(0, 150))}
                  placeholder="Write a short bio..."
                  className="mt-1 h-20 resize-none text-sm"
                />
              </div>
              <div>
                <Label htmlFor="linkedin" className="text-xs text-muted-foreground">LinkedIn URL</Label>
                <Input id="linkedin" value={localLinkedin} onChange={(e) => setLocalLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" className="mt-1 text-sm" />
              </div>
              <div>
                <Label htmlFor="github" className="text-xs text-muted-foreground">GitHub URL</Label>
                <Input id="github" value={localGithub} onChange={(e) => setLocalGithub(e.target.value)} placeholder="https://github.com/username" className="mt-1 text-sm" />
              </div>
              <Button onClick={handleSaveProfile} size="sm" className="w-full mt-2">Save Profile</Button>
            </div>
          </div>

          <Separator />

          {/* Public Profile Toggle */}
          <div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm font-medium">Public Profile</span>
                <p className="text-xs text-muted-foreground">Allow anyone to view your profile</p>
              </div>
              <Switch checked={profile.isPublic} onCheckedChange={handlePublicToggle} />
            </div>

            {profile.isPublic && profile.username && (
              <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <ExternalLink size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-mono text-foreground flex-1 truncate">{publicUrl}</span>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={handleCopyUrl}>
                    {copied ? <><Check size={12} className="mr-1" />Copied</> : <><Copy size={12} className="mr-1" />Copy</>}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Privacy Settings */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Privacy Settings</h4>
            <p className="text-xs text-muted-foreground mb-4">Control what others see on your public profile.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Show Competency Radar</span>
                <Switch checked={privacySettings.showRadar} onCheckedChange={() => handleToggle("showRadar")} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Show Key Skills</span>
                <Switch checked={privacySettings.showSkills} onCheckedChange={() => handleToggle("showSkills")} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Show Activity Timeline</span>
                <Switch checked={privacySettings.showTimeline} onCheckedChange={() => handleToggle("showTimeline")} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg ml-4 border-l-2 border-primary/30">
                <div>
                  <span className="text-sm">Show Timeline Details</span>
                  <p className="text-xs text-muted-foreground">Attendance dots, certificates</p>
                </div>
                <Switch checked={privacySettings.showTimelineDetails} onCheckedChange={() => handleToggle("showTimelineDetails")} disabled={!privacySettings.showTimeline} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section Order */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Section Order</h4>
            <p className="text-xs text-muted-foreground mb-3">Reorder how sections appear on your profile.</p>
            <div className="space-y-2">
              {sectionOrder.map((key, index) => {
                const labels: Record<string, string> = { radar: "Competency Radar", skills: "Key Skills", timeline: "Activity Timeline" };
                return (
                  <div key={key} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                    <span className="text-sm">{labels[key] || key}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={index === 0}
                        onClick={() => { const o = [...sectionOrder]; [o[index - 1], o[index]] = [o[index], o[index - 1]]; onSectionOrderChange(o); }}>
                        <ArrowUp size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={index === sectionOrder.length - 1}
                        onClick={() => { const o = [...sectionOrder]; [o[index], o[index + 1]] = [o[index + 1], o[index]]; onSectionOrderChange(o); }}>
                        <ArrowDown size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Roles */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Your Roles</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasAttendeeRole ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Attendee</p>
                    <p className="text-xs text-muted-foreground">Join events</p>
                  </div>
                </div>
                {hasAttendeeRole ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => onAddRole("attendee")} disabled={addingRole}>Add</Button>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasHostRole ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Presentation size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Host</p>
                    <p className="text-xs text-muted-foreground">Create events</p>
                  </div>
                </div>
                {hasHostRole ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => onAddRole("host")} disabled={addingRole}>Add</Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={onSignOut}>
            <LogOut size={16} className="mr-2" />Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacySettingsModal;
