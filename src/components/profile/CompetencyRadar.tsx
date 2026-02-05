import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { 
  Cpu, 
  Users, 
  Brain, 
  BookOpen, 
  Sparkles,
  Trophy
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SkillCategory {
  category: string;
  score: number;
  displayScore: number;
}

interface CompetencyRadarProps {
  skills: SkillCategory[];
}

// Dimension definitions and metadata
const DIMENSION_META: Record<string, {
  icon: React.ElementType;
  color: string;
  definition: string;
}> = {
  Technology: {
    icon: Cpu,
    color: "hsl(221, 83%, 53%)",
    definition: "Technical skills including programming, data analysis, and digital tools proficiency."
  },
  Social: {
    icon: Users,
    color: "hsl(142, 71%, 45%)",
    definition: "Interpersonal abilities like teamwork, communication, and networking skills."
  },
  Cognitive: {
    icon: Brain,
    color: "hsl(262, 83%, 58%)",
    definition: "Critical thinking, problem-solving, and analytical reasoning capabilities."
  },
  Domain: {
    icon: BookOpen,
    color: "hsl(25, 95%, 53%)",
    definition: "Specialized knowledge and expertise in your field of study or profession."
  },
  "Self-Efficacy": {
    icon: Sparkles,
    color: "hsl(328, 85%, 57%)",
    definition: "Self-management, adaptability, and confidence in handling challenges."
  }
};

// Apply logarithmic scaling to make beginner graphs more visible
const applyLogScale = (value: number, max: number = 100): number => {
  if (value <= 0) return 0;
  const visualMax = 50;
  const scaled = (Math.log(1 + value) / Math.log(1 + max)) * visualMax;
  return Math.min(scaled, visualMax);
};

const CompetencyRadar = ({ skills }: CompetencyRadarProps) => {
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);

  // Process and sort data
  const chartData = skills.map(skill => ({
    category: skill.category,
    value: applyLogScale(skill.score),
    displayScore: skill.displayScore,
    isOverflow: skill.score > 50,
  }));

  // Check if all skills have 0 score (empty state)
  const hasData = skills.some(skill => skill.score > 0);

  // Sort by score for ranking
  const rankedSkills = [...chartData].sort((a, b) => b.displayScore - a.displayScore);

  // Custom tick for radar labels
  const CustomTick = ({ x, y, payload }: any) => {
    const isSelected = selectedDimension === payload.value;
    const meta = DIMENSION_META[payload.value];
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          fill={isSelected ? meta?.color : "hsl(var(--muted-foreground))"}
          fontSize={10}
          fontWeight={isSelected ? 600 : 500}
          className="transition-all duration-200"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const selectedMeta = selectedDimension ? DIMENSION_META[selectedDimension] : null;
  const selectedData = selectedDimension ? chartData.find(s => s.category === selectedDimension) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Competency Radar</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center cursor-help">
                  <span className="text-[10px] text-muted-foreground font-medium">i</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  The 5-Dimension Competency Framework is adapted from the World Economic Forum's (WEF) Future of Jobs Report, tailored to fit the student activity context.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {selectedDimension && (
          <button 
            onClick={() => setSelectedDimension(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Radar Chart with Integrated Definition */}
        <div className="relative flex flex-col">
          {/* Radar Chart - Full height */}
          <div className="h-64 relative">
            {/* Empty state overlay when no data */}
            {!hasData && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">No data yet</p>
                </div>
              </div>
            )}
            {/* Definition Tooltip - Positioned dynamically at top of chart area */}
            <AnimatePresence>
              {selectedDimension && selectedMeta && (
                <motion.div
                  key={selectedDimension}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute top-2 left-2 right-2 z-20"
                >
                  <div 
                    className="rounded-lg px-3 py-2 shadow-lg border backdrop-blur-md flex items-center gap-3"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${selectedMeta.color} 12%, hsl(var(--card) / 0.95))`,
                      borderColor: `color-mix(in srgb, ${selectedMeta.color} 30%, hsl(var(--border)))`
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `color-mix(in srgb, ${selectedMeta.color} 20%, transparent)` }}
                    >
                      <selectedMeta.icon 
                        className="w-4 h-4" 
                        style={{ color: selectedMeta.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: selectedMeta.color }}>
                          {selectedDimension}
                        </span>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-background/50 text-foreground">
                          {selectedData?.displayScore} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
                        {selectedMeta.definition}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedDimension(null)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="68%" data={chartData}>
                <defs>
                  {/* Base gradient with subtle pattern effect */}
                  <linearGradient id="radarGradientBase" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.08} />
                  </linearGradient>
                  
                  {/* Stroke gradient for depth */}
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>

                  {/* Highlighted gradient for selected dimension */}
                  {selectedDimension && selectedMeta && (
                    <linearGradient id="highlightGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={selectedMeta.color} stopOpacity={0.4} />
                      <stop offset="50%" stopColor={selectedMeta.color} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={selectedMeta.color} stopOpacity={0.1} />
                    </linearGradient>
                  )}

                  {/* Glow filter for selected state */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <PolarGrid 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.3}
                  gridType="polygon"
                />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={<CustomTick />}
                  tickLine={false}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 50]} 
                  tick={false}
                  axisLine={false}
                />
                
                {/* Background shape for depth */}
                <Radar
                  name="Background"
                  dataKey="value"
                  stroke="transparent"
                  fill="url(#radarGradientBase)"
                  fillOpacity={0.5}
                />
                
                {/* Main radar shape */}
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke={selectedDimension && selectedMeta ? selectedMeta.color : "hsl(var(--primary))"}
                  fill={selectedDimension ? "url(#highlightGradient)" : "url(#radarGradientBase)"}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  filter={selectedDimension ? "url(#glow)" : undefined}
                  dot={(props: any) => {
                    const isActive = selectedDimension === props.payload.category;
                    const meta = DIMENSION_META[props.payload.category];
                    const dotColor = isActive && meta ? meta.color : "hsl(var(--primary))";
                    
                    return (
                      <g>
                        {/* Outer glow ring for active state */}
                        {isActive && (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={10}
                            fill={meta?.color}
                            fillOpacity={0.15}
                          />
                        )}
                        {/* Main dot */}
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={isActive ? 5 : 3.5}
                          fill={dotColor}
                          stroke="hsl(var(--card))"
                          strokeWidth={2}
                        />
                      </g>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Ranked Dimensions */}
        <div className="flex flex-col justify-center space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground">Dimension Ranking</span>
          </div>
          
          {rankedSkills.map((skill, index) => {
            const meta = DIMENSION_META[skill.category];
            const Icon = meta?.icon || Sparkles;
            const isSelected = selectedDimension === skill.category;
            
            return (
              <motion.button
                key={skill.category}
                onClick={() => setSelectedDimension(
                  selectedDimension === skill.category ? null : skill.category
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-3 p-2.5 rounded-xl text-left w-full
                  transition-all duration-200 border
                  ${isSelected 
                    ? 'shadow-md' 
                    : 'bg-muted/30 border-transparent hover:bg-muted/50'
                  }
                `}
                style={isSelected ? {
                  backgroundColor: `color-mix(in srgb, ${meta?.color} 15%, hsl(var(--card)))`,
                  borderColor: `color-mix(in srgb, ${meta?.color} 40%, transparent)`
                } : undefined}
              >
                {/* Rank Badge */}
                <div 
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${index === 0 ? 'bg-amber-100 text-amber-700' : 
                      index === 1 ? 'bg-slate-200 text-slate-600' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'}
                  `}
                >
                  {index + 1}
                </div>

                {/* Icon */}
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ 
                    backgroundColor: `color-mix(in srgb, ${meta?.color} 15%, transparent)` 
                  }}
                >
                  <Icon 
                    className="w-4 h-4" 
                    style={{ color: meta?.color }}
                  />
                </div>

                {/* Name & Score */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {skill.category}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div 
                    className="text-sm font-bold"
                    style={{ color: meta?.color }}
                  >
                    {skill.displayScore}
                  </div>
                  <div className="text-[10px] text-muted-foreground">XP</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default CompetencyRadar;
