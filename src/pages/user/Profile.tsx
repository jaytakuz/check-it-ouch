import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Award,
  Calendar,
  CheckCircle2,
  Download,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

const skillData = [
  { skill: "Frontend", value: 85 },
  { skill: "Backend", value: 65 },
  { skill: "Design", value: 78 },
  { skill: "Data", value: 45 },
  { skill: "DevOps", value: 55 },
  { skill: "Mobile", value: 40 },
];

const recentEvents = [
  { id: "1", name: "Web Development 101", date: "Dec 22, 2024", status: "completed" },
  { id: "2", name: "React Masterclass", date: "Dec 20, 2024", status: "completed" },
  { id: "3", name: "UI/UX Fundamentals", date: "Dec 18, 2024", status: "completed" },
  { id: "4", name: "JavaScript Deep Dive", date: "Dec 15, 2024", status: "missed" },
];

const UserProfile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">My Profile</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Settings size={20} />
          </Button>
        </div>
      </header>

      {/* Profile Header */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
            JD
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">John Doe</h2>
            <p className="text-muted-foreground">john.doe@example.com</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle2 size={14} className="text-success" />
                <span className="text-foreground font-medium">142</span>
                <span className="text-muted-foreground">Check-ins</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Award size={14} className="text-primary" />
                <span className="text-foreground font-medium">12</span>
                <span className="text-muted-foreground">Certificates</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Skill Radar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 mb-6"
      >
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Skill Portfolio</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Based on attended events and completed certificates
          </p>
        </div>
      </motion.div>

      {/* Certificates Section */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">My Certificates</h3>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center">
              <Award size={28} className="text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">React Masterclass</h4>
              <p className="text-sm text-muted-foreground">Completed Dec 20, 2024</p>
            </div>
            <Button variant="outline" size="sm">
              <Download size={14} className="mr-1" />
              PDF
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Recent History */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent History</h3>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        <div className="space-y-2">
          {recentEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  event.status === "completed"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {event.status === "completed" ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <Calendar size={20} />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground text-sm">{event.name}</h4>
                <p className="text-xs text-muted-foreground">{event.date}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  event.status === "completed"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {event.status === "completed" ? "Completed" : "Missed"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
