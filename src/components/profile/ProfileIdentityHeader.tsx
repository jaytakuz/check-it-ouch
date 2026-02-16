import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Zap,
  Sparkles,
  Award,
  Mail,
  Linkedin,
  Github,
  Pencil,
  Camera,
  X,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { UserProfile } from "@/data/profileMockData";

interface ProfileIdentityHeaderProps {
  profile: UserProfile;
  stats: {
    totalXP: number;
    totalEvents: number;
    certificatesEarned: number;
  };
  isOwner?: boolean;
  onProfileUpdate?: (updates: Partial<UserProfile>) => void;
}

const ProfileIdentityHeader = ({ profile, stats, isOwner = true, onProfileUpdate }: ProfileIdentityHeaderProps) => {
  const [editingBio, setEditingBio] = useState(false);
  const [localBio, setLocalBio] = useState(profile.bio || "");

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts
      .map((p) => p.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleShareProfile = () => {
    const publicUrl = `${window.location.origin}/user/profile/${profile.username}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Profile link copied!");
  };

  const handleSaveBio = () => {
    onProfileUpdate?.({ bio: localBio });
    setEditingBio(false);
    toast.success("Bio updated!");
  };

  const handleCancelBio = () => {
    setLocalBio(profile.bio || "");
    setEditingBio(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-5 shadow-sm"
    >
      {/* Top Row: Avatar + Info */}
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0 group">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-2xl font-bold border border-primary/10 overflow-hidden">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(profile.name)
            )}
          </div>
          {isOwner && (
            <div className="absolute inset-0 rounded-2xl bg-foreground/0 group-hover:bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
              <Camera size={20} className="text-background" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">{profile.name}</h2>
          {profile.studentId && <p className="text-sm text-muted-foreground">{profile.studentId}</p>}
          {profile.faculty && <p className="text-xs text-muted-foreground mt-0.5">{profile.faculty}</p>}

          {/* Contact Icons + Share */}
          <div className="flex items-center gap-2 mt-2">
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Mail size={16} />
              </a>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Linkedin size={16} />
              </a>
            )}
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Github size={16} />
              </a>
            )}
            {profile.isPublic && profile.username && (
              <button
                onClick={handleShareProfile}
                className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Copy profile link"
              >
                <Share2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bio - Inline Editable */}
      <div className="mt-4">
        {editingBio && isOwner ? (
          <div className="space-y-2">
            <Textarea
              value={localBio}
              onChange={(e) => setLocalBio(e.target.value.slice(0, 150))}
              placeholder="Write a short bio..."
              className="h-16 resize-none text-sm"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{localBio.length}/150</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancelBio}>
                  <X size={12} className="mr-1" /> Cancel
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={handleSaveBio}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {profile.bio || (isOwner ? "Add a short bio..." : "")}
            </p>
            {isOwner && (
              <button
                onClick={() => setEditingBio(true)}
                className="absolute -right-1 -top-1 w-6 h-6 rounded-full bg-muted/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil size={12} className="text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
            <Zap size={16} />
          </div>
          <p className="text-xl font-bold text-foreground">{stats.totalXP}</p>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
            <Sparkles size={16} />
          </div>
          <p className="text-xl font-bold text-foreground">{stats.totalEvents}</p>
          <p className="text-xs text-muted-foreground">Events</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
            <Award size={16} />
          </div>
          <p className="text-xl font-bold text-foreground">{stats.certificatesEarned}</p>
          <p className="text-xs text-muted-foreground">Certs</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileIdentityHeader;
