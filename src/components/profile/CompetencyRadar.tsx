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
  Info,
  ChevronDown,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DIMENSION_COLORS } from "@/data/profileMockData";

interface SkillCategory {
  category: string;
  score: number;
  displayScore: number;
}

interface CompetencyRadarProps {
  skills: SkillCategory[];
}

const DIMENSION_META: Record<string, {
  icon: React.ElementType;
  definition: string;
  topEvents: string[];
}> = {
  Technology: {
    icon: Cpu,
    definition: "Technical skills including programming, data analysis, and digital tools proficiency.",
    topEvents: ["AI/ML Workshop Series 2025", "National Coding Competition"],
  },
  Social: {
    icon: Users,
    definition: "Interpersonal abilities like teamwork, communication, and networking skills.",
    topEvents: ["Leadership Summit 2025", "Hackathon: Code for Change"],
  },
  Cognitive: {
    icon: Brain,
    definition: "Critical thinking, problem-solving, and analytical reasoning capabilities.",
    topEvents: ["Design Thinking Workshop", "Research Methodology Workshop"],
  },
  Domain: {
    icon: BookOpen,
    definition: "Specialized knowledge and expertise in your field of study or profession.",
    topEvents: ["Research Methodology Workshop"],
  },
  "Self-Efficacy": {
    icon: Sparkles,
    definition: "Self-management, adaptability, and confidence in handling challenges.",
    topEvents: ["Cloud Computing Bootcamp"],
  },
};

const applyLogScale = (value: number, max: number = 100): number => {
  if (value <= 0) return 0;
  const visualMax = 50;
  const scaled = (Math.log(1 + value) / Math.log(1 + max)) * visualMax;
  return Math.min(scaled, visualMax);
};

const CompetencyRadar = ({ skills }: CompetencyRadarProps) => {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  const chartData = skills.map(skill => ({
    category: skill.category,
    value: applyLogScale(skill.score),
    displayScore: skill.displayScore,
  }));

  const hasData = skills.some(skill => skill.score > 0);
  const rankedSkills = [...chartData].sort((a, b) => b.displayScore - a.displayScore);
  const maxScore = Math.max(...rankedSkills.map(s => s.displayScore), 1);

  const handleDimensionClick = (category: string) => {
    setExpandedDimension(prev => prev === category ? null : category);
  };

  const CustomTick = ({ x, y, payload }: any) => {
    const isExpanded = expandedDimension === payload.value;
    const color = DIMENSION_COLORS[payload.value];

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          fill={isExpanded ? color?.primary || "#64748b" : "#64748b"}
          fontSize={isExpanded ? 12 : 10}
          fontWeight={isExpanded ? 700 : 500}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-foreground">Competency Framework</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center cursor-help">
                <Info className="w-2.5 h-2.5 text-muted-foreground" />
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

      {/* Radar Chart - Full width on mobile */}
      <div className="h-56 md:h-64 relative mb-4">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">No data yet</p>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="68%" data={chartData}>
            <PolarGrid stroke="#e5e7eb" strokeOpacity={1} gridType="polygon" />
            <PolarAngleAxis dataKey="category" tick={<CustomTick />} tickLine={false} />
            <PolarRadiusAxis angle={90} domain={[0, 50]} tick={false} axisLine={false} />
            <Radar
              name="Skills"
              dataKey="value"
              stroke="#4f46e5"
              fill="#6366f1"
              fillOpacity={0.25}
              strokeWidth={2.5}
              strokeLinejoin="round"
              isAnimationActive={false}
              dot={(props: any) => {
                const cat = props.payload.category;
                const isActive = expandedDimension === cat;
                const color = DIMENSION_COLORS[cat]?.primary || "#4f46e5";

                return (
                  <g>
                    {isActive && (
                      <circle cx={props.cx} cy={props.cy} r={12} fill={color} fillOpacity={0.15} />
                    )}
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={isActive ? 5 : 3.5}
                      fill={color}
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

      {/* Dimension Breakdown - below chart */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-foreground mb-2 block">Dimension Breakdown</span>

        {rankedSkills.map((skill) => {
          const meta = DIMENSION_META[skill.category];
          const Icon = meta?.icon || Sparkles;
          const color = DIMENSION_COLORS[skill.category];
          const isExpanded = expandedDimension === skill.category;
          const percentage = maxScore > 0 ? (skill.displayScore / maxScore) * 100 : 0;

          return (
            <Collapsible
              key={skill.category}
              open={isExpanded}
              onOpenChange={() => handleDimensionClick(skill.category)}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={`
                    w-full p-2.5 rounded-xl text-left transition-all duration-200 border
                    ${isExpanded
                      ? `${color?.bg || "bg-muted"} ${color?.border || "border-border"} shadow-sm`
                      : "bg-muted/30 border-transparent hover:bg-muted/50"
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isExpanded ? color?.bg || "bg-muted" : "bg-muted"}`}>
                      <Icon className={`w-3.5 h-3.5 ${isExpanded ? color?.text || "text-foreground" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground truncate">{skill.category}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isExpanded ? color?.text || "text-foreground" : "text-muted-foreground"}`}>
                            {skill.displayScore} XP
                          </span>
                          <ChevronDown
                            size={14}
                            className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: color?.primary || "#6366f1",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className={`mt-1 p-3 rounded-lg ${color?.bg || "bg-muted/50"} border ${color?.border || "border-border"}`}>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {meta?.definition}
                  </p>
                  {meta?.topEvents && meta.topEvents.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Top Contributing Events</p>
                      {meta.topEvents.slice(0, 2).map((evt, i) => (
                        <p key={i} className="text-xs text-foreground">• {evt}</p>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default CompetencyRadar;
