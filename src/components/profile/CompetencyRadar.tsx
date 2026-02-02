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
        <h3 className="font-semibold text-foreground">Competency Radar</h3>
        {selectedDimension && (
          <button 
            onClick={() => setSelectedDimension(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Radar Chart */}
        <div className="relative">
          {/* Definition Popup */}
          <AnimatePresence>
            {selectedDimension && selectedMeta && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute top-0 left-0 right-0 z-10 mx-2"
              >
                <div 
                  className="rounded-lg p-3 text-xs shadow-lg border"
                  style={{ 
                    backgroundColor: `color-mix(in srgb, ${selectedMeta.color} 10%, hsl(var(--card)))`,
                    borderColor: `color-mix(in srgb, ${selectedMeta.color} 30%, transparent)`
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <selectedMeta.icon 
                      className="w-3.5 h-3.5" 
                      style={{ color: selectedMeta.color }}
                    />
                    <span className="font-medium" style={{ color: selectedMeta.color }}>
                      {selectedDimension}
                    </span>
                    <span className="ml-auto font-semibold">
                      {selectedData?.displayScore} XP
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedMeta.definition}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`h-56 transition-all duration-300 ${selectedDimension ? 'mt-20' : ''}`}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <defs>
                  <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                  {/* Highlighted gradient for selected dimension */}
                  {selectedDimension && selectedMeta && (
                    <linearGradient id="highlightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={selectedMeta.color} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={selectedMeta.color} stopOpacity={0.1} />
                    </linearGradient>
                  )}
                </defs>
                <PolarGrid 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.4}
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
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke={selectedDimension && selectedMeta ? selectedMeta.color : "hsl(var(--primary))"}
                  fill={selectedDimension ? "url(#highlightGradient)" : "url(#radarGradient)"}
                  strokeWidth={2}
                  dot={(props: any) => {
                    const isActive = selectedDimension === props.payload.category;
                    const meta = DIMENSION_META[props.payload.category];
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={isActive ? 6 : 4}
                        fill={isActive && meta ? meta.color : "hsl(var(--primary))"}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                        className="transition-all duration-200"
                      />
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
