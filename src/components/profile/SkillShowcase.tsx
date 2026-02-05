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
  isOwner?: boolean;
}

const categoryColors: Record<string, string> = {
  "Digital & Tech Literacy": "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
  "Collaboration & Leadership": "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  "Critical Thinking": "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  "Domain Expertise": "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  "Adaptability & Resilience": "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
};

const SkillShowcase = ({ skills, onPinToggle, isOwner = true }: SkillShowcaseProps) => {
  const [localPins, setLocalPins] = useState<Set<string>>(
    new Set(skills.filter(s => s.isPinned).map(s => s.id))
  );

  const handlePinToggle = (skillId: string) => {
    if (!isOwner) return;
    setLocalPins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skillId)) {
        newSet.delete(skillId);
      } else {
        // Max 3 pins (reduced for focused showcase)
        if (newSet.size >= 3) {
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
          <h3 className="font-semibold text-foreground">Key Skills</h3>
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
                      ${!isOwner ? "cursor-default" : ""}
                      `}
                      onClick={() => isOwner && handlePinToggle(skill.id)}
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
                      {skill.isMarketAligned ? (
                        <ShieldCheck 
                          size={14} 
                          className="text-blue-600 flex-shrink-0" 
                        />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full bg-muted-foreground/20 flex-shrink-0" />
                      )}
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="text-xs space-y-1">
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-muted-foreground">
                      {skill.isMarketAligned 
                        ? `Market-Aligned: Skill nomenclature matches global recruitment databases.` 
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
          <ShieldCheck size={12} className="text-blue-600" />
          <span>Market-Aligned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
          <span>Event-specific</span>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1.5">
            <Pin size={12} className="text-primary fill-primary" />
            <span>Pinned ({localPins.size}/3)</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SkillShowcase;
