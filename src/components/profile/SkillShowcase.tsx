import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Pin, 
  ChevronRight,
  HelpCircle,
  X
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DIMENSION_COLORS, type AggregatedSkill } from "@/data/profileMockData";

interface SkillShowcaseProps {
  skills: AggregatedSkill[];
  onPinToggle?: (skillId: string) => void;
}

const getCategoryColors = (category: string): string => {
  const c = DIMENSION_COLORS[category];
  if (!c) return "bg-muted/50 text-foreground border-border";
  return `${c.bg} ${c.text} ${c.border} hover:opacity-80`;
};

const SkillShowcase = ({ skills, onPinToggle }: SkillShowcaseProps) => {
  const [localPins, setLocalPins] = useState<Set<string>>(
    new Set(skills.filter(s => s.isPinned).map(s => s.id))
  );
  const [viewAllOpen, setViewAllOpen] = useState(false);

  const handlePinToggle = (skillId: string) => {
    setLocalPins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skillId)) {
        newSet.delete(skillId);
      } else {
        if (newSet.size >= 3) return prev;
        newSet.add(skillId);
      }
      return newSet;
    });
    onPinToggle?.(skillId);
  };

  const sortedSkills = [...skills].sort((a, b) => {
    const aPinned = localPins.has(a.id);
    const bPinned = localPins.has(b.id);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return b.totalXP - a.totalXP;
  });

  return (
    <>
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary text-xs h-8"
            onClick={() => setViewAllOpen(true)}
          >
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
                          ${getCategoryColors(skill.category)}
                          ${localPins.has(skill.id) ? "ring-2 ring-primary/30" : ""}
                        `}
                        onClick={() => handlePinToggle(skill.id)}
                      >
                        {localPins.has(skill.id) && (
                          <Pin size={12} className="absolute -top-1 -right-1 text-primary fill-primary" />
                        )}
                        <span className="font-medium text-sm whitespace-nowrap">{skill.name}</span>
                        <Badge 
                          variant="secondary" 
                          className="h-5 px-1.5 text-xs bg-background/50 border-0"
                        >
                          {skill.totalXP} XP
                        </Badge>
                        {skill.isVerified ? (
                          <ShieldCheck size={14} className="text-primary flex-shrink-0" />
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
                        {skill.isVerified 
                          ? `Industry Standard: aligned with LinkedIn Skills Database.` 
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
            <span>Pinned ({localPins.size}/3)</span>
          </div>
        </div>
      </motion.div>

      {/* View All Dialog - Fullscreen on mobile */}
      <Dialog open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col sm:max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>All Skills ({skills.length})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2 pb-4">
              {sortedSkills.map((skill) => {
                const color = DIMENSION_COLORS[skill.category];
                return (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color?.bg || "bg-muted"}`}>
                      {skill.isVerified ? (
                        <ShieldCheck size={14} className={color?.text || "text-primary"} />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{skill.name}</span>
                        {localPins.has(skill.id) && (
                          <Pin size={10} className="text-primary fill-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {skill.category} · {skill.eventCount} event{skill.eventCount > 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {skill.totalXP} XP
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SkillShowcase;
