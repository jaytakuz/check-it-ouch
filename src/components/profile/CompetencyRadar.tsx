import { useState } from "react";
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
  Trophy,
  Info
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
  definition: string;
}> = {
  Technology: {
    icon: Cpu,
    definition: "Technical skills including programming, data analysis, and digital tools proficiency."
  },
  Social: {
    icon: Users,
    definition: "Interpersonal abilities like teamwork, communication, and networking skills."
  },
  Cognitive: {
    icon: Brain,
    definition: "Critical thinking, problem-solving, and analytical reasoning capabilities."
  },
  Domain: {
    icon: BookOpen,
    definition: "Specialized knowledge and expertise in your field of study or profession."
  },
  "Self-Efficacy": {
    icon: Sparkles,
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

  // Custom tick for radar labels - Static styling
  const CustomTick = ({ x, y, payload }: any) => {
    const isSelected = selectedDimension === payload.value;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          fill={isSelected ? "#4f46e5" : "#64748b"}
          fontSize={10}
          fontWeight={isSelected ? 600 : 500}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const selectedMeta = selectedDimension ? DIMENSION_META[selectedDimension] : null;
  const selectedData = selectedDimension ? chartData.find(s => s.category === selectedDimension) : null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      {/* Header with title and info tooltip */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Competency Framework</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center cursor-help">
                  <Info className="w-2.5 h-2.5 text-slate-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Based on WEF & OECD standards. The 5-Dimension Competency Framework is adapted from the World Economic Forum's Future of Jobs Report, tailored to fit the student activity context.
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
        {/* Left: Radar Chart */}
        <div className="relative flex flex-col">
          <div className="h-64 relative">
            {/* Empty state overlay when no data */}
            {!hasData && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500">No data yet</p>
                </div>
              </div>
            )}
            
            {/* Definition Tooltip - Positioned at top of chart area */}
            {selectedDimension && selectedMeta && (
              <div className="absolute top-2 left-2 right-2 z-20">
                <div 
                  className="rounded-lg px-3 py-2 shadow-lg border backdrop-blur-md flex items-center gap-3 bg-indigo-50/95 border-indigo-200"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-100"
                  >
                    <selectedMeta.icon 
                      className="w-4 h-4 text-indigo-600" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-indigo-600">
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
              </div>
            )}
            
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="68%" data={chartData}>
                <defs>
                  {/* Highlighted gradient for selected dimension */}
                  {selectedDimension && (
                    <linearGradient id="highlightGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.1} />
                    </linearGradient>
                  )}
                </defs>
                
                {/* Grid: Gray-200 */}
                <PolarGrid 
                  stroke="#e5e7eb"
                  strokeOpacity={1}
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
                
                {/* Main radar shape - Stroke: Indigo-600, Fill: Indigo-500 at 20% opacity, No animation */}
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke="#4f46e5"
                  fill={selectedDimension ? "url(#highlightGradient)" : "#6366f1"}
                  fillOpacity={0.2}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  isAnimationActive={false}
                  dot={(props: any) => {
                    const isActive = selectedDimension === props.payload.category;
                    
                    return (
                      <g>
                        {/* Outer glow ring for active state */}
                        {isActive && (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={10}
                            fill="#4f46e5"
                            fillOpacity={0.15}
                          />
                        )}
                        {/* Main dot */}
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={isActive ? 5 : 3.5}
                          fill="#4f46e5"
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
              <button
                key={skill.category}
                onClick={() => setSelectedDimension(
                  selectedDimension === skill.category ? null : skill.category
                )}
                className={`
                  flex items-center gap-3 p-2.5 rounded-xl text-left w-full
                  transition-all duration-200 border
                  ${isSelected 
                    ? 'shadow-md bg-indigo-50 border-indigo-200' 
                    : 'bg-muted/30 border-transparent hover:bg-muted/50'
                  }
                `}
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
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-indigo-100' : 'bg-slate-100'}`}
                >
                  <Icon 
                    className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}
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
                    className={`text-sm font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-600'}`}
                  >
                    {skill.displayScore}
                  </div>
                  <div className="text-[10px] text-muted-foreground">XP</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CompetencyRadar;