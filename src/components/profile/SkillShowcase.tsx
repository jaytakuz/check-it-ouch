import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Pin, 
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AggregatedSkill } from "@/data/profileMockData";

interface SkillShowcaseProps {
  skills: AggregatedSkill[];
  onPinToggle?: (skillId: string) => void;
}

const categoryColors: Record<string, string> = {
  Technology: "bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20",
  Social: "bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20",
  Cognitive: "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
  Domain: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20",
  "Self-Efficacy": "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20",
};

const SkillShowcase = ({ skills, onPinToggle }: SkillShowcaseProps) => {
  const [localPins, setLocalPins] = useState<Set<string>>(
    new Set(skills.filter(s => s.isPinned).map(s => s.id))
  );

  const handlePinToggle = (skillId: string) => {
    setLocalPins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skillId)) {
        newSet.delete(skillId);
      } else {
        // Max 5 pins
        if (newSet.size >= 5) {
          return prev;
        }
        newSet.add(skillId);
      }
      return newSet;
    });
    onPinToggle?.(skillId);
  };

  // Sort: pinned first, then by XP
  const sortedSkills = [...skills].sort((a, b) => {
    const aPinned = localPins.has(a.id);
    const bPinned = localPins.has(b.id);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return b.totalXP - a.totalXP;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Top Skills</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle size={14} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Skills are weighted by event tier: 
                  <span className="font-medium"> Exposure (1x)</span>, 
                  <span className="font-medium"> Practice (3x)</span>, 
                  <span className="font-medium"> Impact (5x)</span>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button variant="ghost" size="sm" className="text-primary text-xs h-8">
          View All
          <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex gap-2">
          {sortedSkills.slice(0, 12).map((skill, index) => (
            <TooltipProvider key={skill.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + index * 0.03 }}
                  >
                    <div
                      className={`
                        relative group flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer
                        transition-all duration-200
                        ${categoryColors[skill.category] || "bg-muted/50 text-foreground border-border"}
                        ${localPins.has(skill.id) ? "ring-2 ring-primary/30" : ""}
                      `}
                      onClick={() => handlePinToggle(skill.id)}
                    >
                      {/* Pin indicator */}
                      {localPins.has(skill.id) && (
                        <Pin size={12} className="absolute -top-1 -right-1 text-primary fill-primary" />
                      )}
                      
                      {/* Skill content */}
                      <span className="font-medium text-sm whitespace-nowrap">{skill.name}</span>
                      <Badge 
                        variant="secondary" 
                        className="h-5 px-1.5 text-xs bg-background/50 border-0"
                      >
                        {skill.totalXP} XP
                      </Badge>
                      
                      {/* Verified badge */}
                      {skill.isVerified ? (
                        <ShieldCheck 
                          size={14} 
                          className="text-primary flex-shrink-0" 
                        />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full bg-muted-foreground/20 flex-shrink-0" />
                      )}
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-muted-foreground">
                      {skill.isVerified 
                        ? "✓ Standardized Skill (LinkedIn)" 
                        : "Event-specific skill"}
                    </p>
                    <p className="text-muted-foreground">
                      Earned from {skill.eventCount} event{skill.eventCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-primary" />
          <span>Standardized</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
          <span>Event-specific</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Pin size={12} className="text-primary fill-primary" />
          <span>Pinned ({localPins.size}/5)</span>
        </div>
      </div>
    </motion.div>
  );
};

export default SkillShowcase;
