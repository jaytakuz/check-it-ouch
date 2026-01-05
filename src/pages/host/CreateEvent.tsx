import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, CalendarDays, Repeat, Users, UserCheck, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import LeafletLocationPicker from "@/components/LeafletLocationPicker";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type EventType = "one-time" | "recurring";
type TrackingMode = "count-only" | "full-tracking";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Step-based state
  const [currentStep, setCurrentStep] = useState(1);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [trackingMode, setTrackingMode] = useState<TrackingMode | null>(null);
  
  // Form state
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 2, 4]);
  const [radius, setRadius] = useState([50]);
  const [loading, setLoading] = useState(false);
  
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
    }
  }, [user, authLoading, navigate]);

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
      location: prev.location || "Selected Location",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create an event");
      return;
    }

    if (!formData.locationLat || !formData.locationLng) {
      toast.error("Please set a location for the event");
      return;
    }

    if (eventType === "one-time" && !formData.date) {
      toast.error("Please select a date for the event");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('events').insert({
      host_id: user.id,
      name: formData.name,
      description: formData.description || null,
      is_recurring: eventType === "recurring",
      recurring_days: eventType === "recurring" ? selectedDays : null,
      event_date: eventType === "recurring" ? null : formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      location_name: formData.location,
      location_lat: formData.locationLat,
      location_lng: formData.locationLng,
      radius_meters: radius[0],
      max_attendees: parseInt(formData.maxAttendees) || 50,
      tracking_mode: trackingMode === "full-tracking" ? "full_tracking" : "count_only",
    });

    if (error) {
      console.error('Error creating event:', error);
      toast.error("Failed to create event. Please try again.");
      setLoading(false);
      return;
    }

    toast.success("Event created successfully!");
    navigate("/dashboard");
    setLoading(false);
  };

  const canProceedToStep2 = eventType !== null;
  const canProceedToStep3 = trackingMode !== null;

  const handleNextStep = () => {
    if (currentStep === 1 && canProceedToStep2) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedToStep3) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  if (authLoading) {
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
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Create Event</h1>
            <p className="text-xs text-muted-foreground">Step {currentStep} of 3</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted max-w-2xl mx-auto">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Event Type */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">What type of event?</h2>
                <p className="text-muted-foreground">Choose how your event will be scheduled</p>
              </div>

              <div className="space-y-3">
                {/* One-time Option */}
                <button
                  type="button"
                  onClick={() => setEventType("one-time")}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 text-left transition-all",
                    "flex items-start gap-4",
                    eventType === "one-time"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    eventType === "one-time" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <CalendarDays size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">One-time Event</h3>
                      {eventType === "one-time" && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check size={14} className="text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      A single event on a specific date. Perfect for workshops, seminars, or special gatherings.
                    </p>
                  </div>
                </button>

                {/* Recurring Option */}
                <button
                  type="button"
                  onClick={() => setEventType("recurring")}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 text-left transition-all",
                    "flex items-start gap-4",
                    eventType === "recurring"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    eventType === "recurring" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Repeat size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Recurring Event</h3>
                      {eventType === "recurring" && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check size={14} className="text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Repeats on selected days weekly. Ideal for classes, regular meetings, or ongoing sessions.
                    </p>
                  </div>
                </button>
              </div>

              <Button
                onClick={handleNextStep}
                disabled={!canProceedToStep2}
                className="w-full mt-8"
                size="lg"
              >
                Continue
                <ChevronRight size={18} className="ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Tracking Mode */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">How to track attendance?</h2>
                <p className="text-muted-foreground">Choose what data you want to collect</p>
              </div>

              <div className="space-y-3">
                {/* Count Only Option */}
                <button
                  type="button"
                  onClick={() => setTrackingMode("count-only")}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 text-left transition-all",
                    "flex items-start gap-4",
                    trackingMode === "count-only"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    trackingMode === "count-only" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Users size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Count Only</h3>
                      {trackingMode === "count-only" && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check size={14} className="text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Just track the total number of attendees. No login required for participants—quick and easy.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">Anonymous</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">No sign-up</span>
                    </div>
                  </div>
                </button>

                {/* Full Tracking Option */}
                <button
                  type="button"
                  onClick={() => setTrackingMode("full-tracking")}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 text-left transition-all",
                    "flex items-start gap-4",
                    trackingMode === "full-tracking"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    trackingMode === "full-tracking" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <UserCheck size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Full Tracking</h3>
                      {trackingMode === "full-tracking" && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check size={14} className="text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Collect attendee information. Attendees must log in to check in—enables certificates & detailed reports.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-primary/10 px-2 py-1 rounded-full text-primary">eCertificates</span>
                      <span className="text-xs bg-primary/10 px-2 py-1 rounded-full text-primary">Detailed logs</span>
                    </div>
                  </div>
                </button>
              </div>

              <Button
                onClick={handleNextStep}
                disabled={!canProceedToStep3}
                className="w-full mt-8"
                size="lg"
              >
                Continue
                <ChevronRight size={18} className="ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 3: Event Details Form */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Event Details</h2>
                <p className="text-muted-foreground">
                  {eventType === "one-time" ? "Set up your one-time event" : "Configure your recurring event"}
                </p>
              </div>

              {/* Summary badges */}
              <div className="flex gap-2 justify-center mb-6">
                <span className="text-xs bg-primary/10 px-3 py-1.5 rounded-full text-primary font-medium flex items-center gap-1">
                  {eventType === "one-time" ? <CalendarDays size={12} /> : <Repeat size={12} />}
                  {eventType === "one-time" ? "One-time" : "Recurring"}
                </span>
                <span className="text-xs bg-primary/10 px-3 py-1.5 rounded-full text-primary font-medium flex items-center gap-1">
                  {trackingMode === "count-only" ? <Users size={12} /> : <UserCheck size={12} />}
                  {trackingMode === "count-only" ? "Count only" : "Full tracking"}
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
                      placeholder={eventType === "recurring" ? "e.g., Web Development 101" : "e.g., Annual Conference 2025"}
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

                  {eventType === "recurring" ? (
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
                        required={eventType === "one-time"}
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
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Creating Event..." : "Create Event"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateEvent;
