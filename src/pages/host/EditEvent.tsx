import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, CalendarDays, Repeat, Users, UserCheck, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import LeafletLocationPicker from "@/components/LeafletLocationPicker";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EditEvent = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading: authLoading } = useAuth();
  
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [radius, setRadius] = useState([50]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [trackingMode, setTrackingMode] = useState<string>("count_only");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    startTime: "09:00",
    endTime: "10:30",
    location: "",
    locationLat: 0,
    locationLng: 0,
    maxAttendees: "50",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (eventId && user) {
      fetchEvent();
    }
  }, [user, authLoading, eventId, navigate]);

  const fetchEvent = async () => {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !data) {
      toast.error("Event not found");
      navigate("/dashboard");
      return;
    }

    // Check if user owns this event
    if (data.host_id !== user?.id) {
      toast.error("You don't have permission to edit this event");
      navigate("/dashboard");
      return;
    }

    setFormData({
      name: data.name,
      description: data.description || "",
      date: data.event_date || "",
      startTime: data.start_time,
      endTime: data.end_time,
      location: data.location_name,
      locationLat: data.location_lat,
      locationLng: data.location_lng,
      maxAttendees: data.max_attendees?.toString() || "50",
    });
    setRadius([data.radius_meters]);
    setIsRecurring(data.is_recurring);
    setSelectedDays(data.recurring_days || []);
    setTrackingMode(data.tracking_mode);
    setLoading(false);
  };

  const toggleDay = (index: number) => {
    setSelectedDays((prev) =>
      prev.includes(index)
        ? prev.filter((d) => d !== index)
        : [...prev, index].sort()
    );
  };

  const handleLocationChange = (location: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      locationLat: location.lat,
      locationLng: location.lng,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !eventId) {
      toast.error("Unable to save changes");
      return;
    }

    if (!formData.locationLat || !formData.locationLng) {
      toast.error("Please set a location for the event");
      return;
    }

    if (!isRecurring && !formData.date) {
      toast.error("Please select a date for the event");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("events")
      .update({
        name: formData.name,
        description: formData.description || null,
        recurring_days: isRecurring ? selectedDays : null,
        event_date: isRecurring ? null : formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        location_name: formData.location,
        location_lat: formData.locationLat,
        location_lng: formData.locationLng,
        radius_meters: radius[0],
        max_attendees: parseInt(formData.maxAttendees) || 50,
      })
      .eq("id", eventId);

    if (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event. Please try again.");
      setSaving(false);
      return;
    }

    toast.success("Event updated successfully!");
    navigate(`/host/event/${eventId}`);
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Edit Event</h1>
            <p className="text-xs text-muted-foreground">Update your event details</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Summary badges */}
          <div className="flex gap-2 justify-center mb-6">
            <span className="text-xs bg-primary/10 px-3 py-1.5 rounded-full text-primary font-medium flex items-center gap-1">
              {isRecurring ? <Repeat size={12} /> : <CalendarDays size={12} />}
              {isRecurring ? "Recurring" : "One-time"}
            </span>
            <span className="text-xs bg-primary/10 px-3 py-1.5 rounded-full text-primary font-medium flex items-center gap-1">
              {trackingMode === "count_only" ? <Users size={12} /> : <UserCheck size={12} />}
              {trackingMode === "count_only" ? "Count only" : "Full tracking"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  placeholder="Event name"
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
                <Label htmlFor="maxAttendees">Expected Attendees</Label>
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
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-4 border border-border space-y-4"
            >
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Clock size={18} />
                Schedule
              </h3>

              {isRecurring ? (
                <div className="space-y-4">
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
              transition={{ delay: 0.2 }}
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
                  placeholder="Enter venue name..."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              <LeafletLocationPicker
                value={formData.locationLat && formData.locationLng ? { lat: formData.locationLat, lng: formData.locationLng } : null}
                onChange={handleLocationChange}
                radius={radius[0]}
              />

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

            {/* Submit */}
            <Button type="submit" className="w-full" size="lg" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EditEvent;
