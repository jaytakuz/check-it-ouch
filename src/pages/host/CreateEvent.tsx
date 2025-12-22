import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Upload, X, Check, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CreateEvent = () => {
  const navigate = useNavigate();
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 2, 4]); // Mon, Wed, Fri
  const [radius, setRadius] = useState([50]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    startTime: "09:00",
    endTime: "10:30",
    location: "",
    maxAttendees: "50",
  });

  const toggleDay = (index: number) => {
    setSelectedDays((prev) =>
      prev.includes(index)
        ? prev.filter((d) => d !== index)
        : [...prev, index].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Event created successfully!");
    navigate("/host/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Create Event</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Event Type Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">Recurring Event</h3>
              <p className="text-sm text-muted-foreground">
                Repeat on selected days weekly
              </p>
            </div>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>
        </motion.div>

        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              placeholder="e.g., Web Development 101"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your event..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxAttendees">Max Attendees</Label>
            <Input
              id="maxAttendees"
              type="number"
              placeholder="50"
              value={formData.maxAttendees}
              onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
            />
          </div>
        </motion.div>

        {/* Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-4 border border-border space-y-4"
        >
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Clock size={18} />
            Schedule
          </h3>

          {isRecurring ? (
            <div className="space-y-4">
              {/* Day Selection */}
              <div className="space-y-2">
                <Label>Select Days</Label>
                <div className="flex gap-2 justify-between">
                  {DAYS.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={cn(
                        "w-10 h-10 rounded-full text-sm font-medium transition-all",
                        "flex items-center justify-center",
                        selectedDays.includes(index)
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      title={DAY_LABELS[index]}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required={!isRecurring}
              />
            </div>
          )}

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-4 border border-border space-y-4"
        >
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <MapPin size={18} />
            Location
          </h3>

          <div className="space-y-2">
            <Label htmlFor="location">Venue / Address</Label>
            <Input
              id="location"
              placeholder="Search for a location..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          {/* Map Placeholder */}
          <div className="aspect-video rounded-xl bg-muted flex items-center justify-center border border-border">
            <div className="text-center text-muted-foreground">
              <MapPin size={32} className="mx-auto mb-2" />
              <p className="text-sm">Map will appear here</p>
              <p className="text-xs">Pin the exact location</p>
            </div>
          </div>

          {/* Radius Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Check-in Radius</Label>
              <span className="text-sm font-medium text-primary">{radius[0]}m</span>
            </div>
            <Slider
              value={radius}
              onValueChange={setRadius}
              max={200}
              min={10}
              step={10}
            />
            <p className="text-xs text-muted-foreground">
              Attendees must be within this radius to check in
            </p>
          </div>
        </motion.div>

        {/* Certificate Upload */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-4 border border-border space-y-4"
        >
          <h3 className="font-medium text-foreground">Certificate Template (Optional)</h3>
          
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag and drop or click to upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG (Max 5MB)
            </p>
          </div>
        </motion.div>

        {/* Submit */}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating Event..." : "Create Event"}
        </Button>
      </form>
    </div>
  );
};

export default CreateEvent;
