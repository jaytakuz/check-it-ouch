import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  Users,
  ChevronRight,
  Clock,
  MapPin,
  MoreVertical,
  Bell,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  name: string;
  type: "one-time" | "recurring";
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  status: "upcoming" | "live" | "completed";
}

const mockEvents: Event[] = [
  {
    id: "1",
    name: "Web Development 101",
    type: "recurring",
    date: "Every Mon, Wed, Fri",
    time: "09:00 AM - 10:30 AM",
    location: "Room 301, Tech Building",
    attendees: 28,
    maxAttendees: 35,
    status: "live",
  },
  {
    id: "2",
    name: "UI/UX Workshop",
    type: "one-time",
    date: "Dec 28, 2024",
    time: "02:00 PM - 05:00 PM",
    location: "Conference Hall A",
    attendees: 0,
    maxAttendees: 50,
    status: "upcoming",
  },
  {
    id: "3",
    name: "Data Science Bootcamp",
    type: "recurring",
    date: "Every Tuesday",
    time: "06:00 PM - 08:00 PM",
    location: "Online + Lab 201",
    attendees: 42,
    maxAttendees: 45,
    status: "completed",
  },
];

const HostDashboard = () => {
  const navigate = useNavigate();
  const [events] = useState<Event[]>(mockEvents);

  const getStatusStyles = (status: Event["status"]) => {
    switch (status) {
      case "live":
        return "bg-success/10 text-success border-success/20";
      case "upcoming":
        return "bg-primary/10 text-primary border-primary/20";
      case "completed":
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: Event["status"]) => {
    switch (status) {
      case "live":
        return "● Live Now";
      case "upcoming":
        return "Upcoming";
      case "completed":
        return "Completed";
    }
  };

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
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="text-2xl font-bold text-foreground">12</div>
            <div className="text-sm text-muted-foreground">Active Events</div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="text-2xl font-bold text-foreground">847</div>
            <div className="text-sm text-muted-foreground">Total Check-ins</div>
          </div>
        </motion.div>
      </div>

      {/* Events Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Your Events</h2>
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
              onClick={() => navigate(`/host/event/${event.id}`)}
              className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{event.name}</h3>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border",
                        getStatusStyles(event.status)
                      )}
                    >
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {event.type === "recurring" ? "Recurring" : "One-time"}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
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

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {event.attendees}/{event.maxAttendees}
                  </span>
                </div>
                {event.status === "live" && (
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate("/host/monitor"); }}>
                    Open Monitor
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.3 }}
        onClick={() => navigate("/host/create-event")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <Plus size={24} />
      </motion.button>
    </div>
  );
};

export default HostDashboard;
