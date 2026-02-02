import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";

interface SkillCategory {
  category: string;
  score: number;
  displayScore: number; // Original score for display
}

interface CompetencyRadarProps {
  skills: SkillCategory[];
}

// Apply logarithmic scaling to make beginner graphs more visible
const applyLogScale = (value: number, max: number = 100): number => {
  if (value <= 0) return 0;
  // Log scale: log(1 + value) / log(1 + max) * visualMax
  const visualMax = 50;
  const scaled = (Math.log(1 + value) / Math.log(1 + max)) * visualMax;
  return Math.min(scaled, visualMax);
};

const CompetencyRadar = ({ skills }: CompetencyRadarProps) => {
  // Process data with log scaling, cap visual at 50
  const chartData = skills.map(skill => ({
    category: skill.category,
    value: applyLogScale(skill.score),
    displayScore: skill.displayScore,
    isOverflow: skill.score > 50,
  }));

  // Custom tick component to show overflow badges
  const CustomTick = ({ x, y, payload }: any) => {
    const skill = chartData.find(s => s.category === payload.value);
    const isOverflow = skill?.isOverflow;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={11}
          fontWeight={500}
        >
          {payload.value}
        </text>
        {isOverflow && (
          <g transform="translate(0, 14)">
            <rect
              x={-16}
              y={-8}
              width={32}
              height={16}
              rx={8}
              fill="hsl(var(--primary))"
            />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fill="hsl(var(--primary-foreground))"
              fontSize={9}
              fontWeight={600}
            >
              {skill?.displayScore}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Competency Radar</h3>
        <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
          5 Dimensions
        </Badge>
      </div>
      
      <div className="h-72 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <PolarGrid 
              stroke="hsl(var(--border))" 
              strokeOpacity={0.5}
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
              stroke="hsl(var(--primary))"
              fill="url(#radarGradient)"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {chartData.map((skill, index) => (
          <div 
            key={skill.category}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: `hsl(${220 + index * 30}, 70%, 50%)` 
              }}
            />
            <span>{skill.displayScore} pts</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default CompetencyRadar;
