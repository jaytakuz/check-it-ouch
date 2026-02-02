import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Cpu, 
  Users, 
  Brain, 
  BookOpen, 
  Sparkles,
  Calendar,
  Award,
  Eye,
  EyeOff
} from "lucide-react";

interface ProfileData {
  name: string;
  studentId: string;
  faculty: string;
  avatarUrl?: string;
  totalEvents: number;
  certificatesEarned: number;
  skills: { category: string; count: number }[];
}

interface ProfileIdentityHeaderProps {
  profile: ProfileData;
  isPublicView: boolean;
  onTogglePublicView: (value: boolean) => void;
}

// Persona detection logic
const detectPersona = (skills: { category: string; count: number }[]) => {
  const sortedSkills = [...skills].sort((a, b) => b.count - a.count);
  const topSkill = sortedSkills[0];
  
  if (!topSkill || topSkill.count < 10) return null;
  
  const personas: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    Technology: { 
      label: "Tech-Savvy Enthusiast", 
      icon: <Cpu size={14} />, 
      color: "bg-violet-500/10 text-violet-600 border-violet-500/20" 
    },
    Social: { 
      label: "Social Connector", 
      icon: <Users size={14} />, 
      color: "bg-pink-500/10 text-pink-600 border-pink-500/20" 
    },
    Cognitive: { 
      label: "Critical Thinker", 
      icon: <Brain size={14} />, 
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20" 
    },
    Domain: { 
      label: "Domain Expert", 
      icon: <BookOpen size={14} />, 
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
    },
    "Self-Efficacy": { 
      label: "Self-Driven Achiever", 
      icon: <Sparkles size={14} />, 
      color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" 
    },
  };
  
  return personas[topSkill.category] || null;
};

const ProfileIdentityHeader = ({ 
  profile, 
  isPublicView, 
  onTogglePublicView 
}: ProfileIdentityHeaderProps) => {
  const persona = detectPersona(profile.skills);
  
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.map(p => p.charAt(0)).join("").toUpperCase().slice(0, 2);
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
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-2xl font-bold border border-primary/10">
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={profile.name} 
                className="w-full h-full rounded-2xl object-cover"
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
              <Badge 
                variant="outline" 
                className={`${persona.color} border gap-1.5 font-medium`}
              >
                {persona.icon}
                {persona.label}
              </Badge>
            </motion.div>
          )}
        </div>
      </div>

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

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
            <Calendar size={16} />
          </div>
          <p className="text-2xl font-bold text-foreground">{profile.totalEvents}</p>
          <p className="text-xs text-muted-foreground">Total Events</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
            <Award size={16} />
          </div>
          <p className="text-2xl font-bold text-foreground">{profile.certificatesEarned}</p>
          <p className="text-xs text-muted-foreground">Certificates</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileIdentityHeader;
