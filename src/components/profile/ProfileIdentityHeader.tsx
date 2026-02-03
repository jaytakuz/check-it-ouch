import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Sparkles,
  Award,
  Copy,
  Check,
  ExternalLink,
  Mail,
  Linkedin,
  Github,
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
}

const ProfileIdentityHeader = ({ profile, stats }: ProfileIdentityHeaderProps) => {
  const [copied, setCopied] = useState(false);

  const publicUrl = `cmu.ac.th/in/${profile.username}`;

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts
      .map((p) => p.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopied(true);
    toast.success("Profile URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-5 shadow-sm"
    >
      {/* Top Row: Avatar + Info */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-2xl font-bold border border-primary/10 overflow-hidden">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(profile.name)
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">{profile.studentId}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{profile.faculty}</p>

          {/* Contact Icons */}
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
                className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{profile.bio}</p>
      )}

      {/* Public URL */}
      {profile.isPublic && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4"
        >
          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border">
            <ExternalLink size={14} className="text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground flex-1 truncate font-mono">
              {publicUrl}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCopyUrl}
            >
              {copied ? (
                <>
                  <Check size={12} className="mr-1 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} className="mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

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
