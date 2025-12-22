import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";
import {
  QrCode,
  Calendar,
  Award,
  ChevronRight,
  Clock,
  MapPin,
  Bell,
  User,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  checkedIn: boolean;
  host: string;
}

const mockEvents: Event[] = [
  {
    id: "1",
    name: "Web Development 101",
    date: "Today",
    time: "09:00 AM - 10:30 AM",
    location: "Room 301, Tech Building",
    checkedIn: true,
    host: "Prof. Smith",
  },
  {
    id: "2",
    name: "UI/UX Workshop",
    date: "Dec 28, 2024",
    time: "02:00 PM - 05:00 PM",
    location: "Conference Hall A",
    checkedIn: false,
    host: "Design Team",
  },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const [events] = useState<Event[]>(mockEvents);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/user/profile")}>
                <User size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4 bg-card border-border"
            onClick={() => navigate("/checkin")}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <QrCode size={20} className="text-primary" />
            </div>
            <span className="font-medium">Scan to Check-in</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4 bg-card border-border"
            onClick={() => navigate("/user/profile")}
          >
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Award size={20} className="text-success" />
            </div>
            <span className="font-medium">My Certificates</span>
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary rounded-2xl p-5 text-primary-foreground"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm">This Month</p>
              <p className="text-3xl font-bold">24</p>
              <p className="text-sm text-primary-foreground/80">Check-ins completed</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Upcoming Events */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">My Events</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-card rounded-2xl p-4 border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{event.name}</h3>
                    {event.checkedIn && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                        ✓ Checked in
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">by {event.host}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{event.location}</span>
                </div>
              </div>

              {!event.checkedIn && event.date === "Today" && (
                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={() => navigate("/checkin")}
                  >
                    Check In Now
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
