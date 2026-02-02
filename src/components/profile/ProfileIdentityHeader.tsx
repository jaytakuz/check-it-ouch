import { useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Cpu, 
  Users, 
  Brain, 
  BookOpen, 
  Sparkles,
  Target,
  Zap,
  Award,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserProfile, Persona } from "@/data/profileMockData";

interface ProfileIdentityHeaderProps {
  profile: UserProfile;
  persona: Persona | null;
  stats: {
    totalXP: number;
    totalEvents: number;
    certificatesEarned: number;
  };
  isPublicView: boolean;
  onTogglePublicView: (value: boolean) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu size={14} />,
  Users: <Users size={14} />,
  Brain: <Brain size={14} />,
  BookOpen: <BookOpen size={14} />,
  Sparkles: <Sparkles size={14} />,
  Target: <Target size={14} />,
};

const ProfileIdentityHeader = ({ 
  profile, 
  persona,
  stats,
  isPublicView, 
  onTogglePublicView 
}: ProfileIdentityHeaderProps) => {
  const [copied, setCopied] = useState(false);
  
  const publicUrl = `cmu.ac.th/p/${profile.username}`;
  
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.map(p => p.charAt(0)).join("").toUpperCase().slice(0, 2);
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
          {persona && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
              <Award size={12} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">{profile.studentId}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{profile.faculty}</p>
          
          {/* Persona Badge */}
          {persona && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge 
                      variant="outline" 
                      className={`${persona.color} border gap-1.5 font-medium cursor-help`}
                    >
                      {iconMap[persona.icon] || <Sparkles size={14} />}
                      {persona.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Based on your highest weighted skill category</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
          {profile.bio}
        </p>
      )}

      {/* Public View Toggle */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isPublicView ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>Public Profile</span>
        </div>
        <Switch 
          checked={isPublicView} 
          onCheckedChange={onTogglePublicView}
        />
      </div>

      {/* Public URL (shown when public) */}
      {isPublicView && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3"
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
                  <Check size={12} className="mr-1 text-success" />
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
