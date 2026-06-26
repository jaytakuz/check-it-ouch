import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, CalendarDays, Repeat, Users, UserCheck, ChevronRight, ChevronsUpDown, Check, Award, Plus, Trash2, Settings2, List, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import LeafletLocationPicker from "@/components/LeafletLocationPicker";
import { PageLoading } from "@/components/ui/PageLoading";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type EventType = "one-time" | "recurring";
type TrackingMode = "count-only" | "full-tracking";
type ScheduleMode = "basic" | "advanced";
type EventTier = 1 | 2 | 3;

interface AdvancedScheduleEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
}

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Step-based state
  const [currentStep, setCurrentStep] = useState(1);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [trackingMode, setTrackingMode] = useState<TrackingMode | null>(null);
  const [verificationLevel, setVerificationLevel] = useState<"basic" | "standard" | "strict">("standard");
  
  // eCertificate state
  const [enableCertificate, setEnableCertificate] = useState(false);
  
  // Event tier state
  const [eventTier, setEventTier] = useState<EventTier | null>(null);
  
  // Schedule mode state
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("basic");
  const [advancedSchedule, setAdvancedSchedule] = useState<AdvancedScheduleEntry[]>([
    { id: crypto.randomUUID(), date: "", startTime: "09:00", endTime: "10:30", topic: "" }
  ]);
  
  // Form state
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 2, 4]);
  const [radius, setRadius] = useState([50]);
  const [loading, setLoading] = useState(false);
  
  // Standardized 5-Dimension Competency Framework tags (LinkedIn skills)
  const TAG_CATEGORIES: { category: string; tags: string[] }[] = [
    {
      category: "Technology",
      tags: ["Python", "React.js", "Machine Learning", "SQL", "Cloud Computing", "Data Visualization", "UI/UX Design", "Cybersecurity", "Artificial Intelligence", "Git/Version Control"],
    },
    {
      category: "Cognitive",
      tags: ["Problem Solving", "Critical Thinking", "Data Analysis", "Research Methodology", "Strategic Planning", "System Thinking", "Decision Making", "Statistical Analysis", "Creative Thinking", "Analytical Skills"],
    },
    {
      category: "Social",
      tags: ["Effective Communication", "Team Leadership", "Public Speaking", "Cross-functional Collaboration", "Negotiation", "Conflict Resolution", "Mentoring", "Presentation Skills", "Stakeholder Management", "Empathy"],
    },
    {
      category: "Self-Efficacy",
      tags: ["Adaptability", "Time Management", "Resilience", "Continuous Learning", "Stress Management", "Proactive Nature", "Self-Motivation", "Work Ethic", "Emotional Intelligence", "Goal Setting"],
    },
    {
      category: "Domain",
      tags: ["Business Analysis", "Financial Modeling", "Market Research", "Product Management", "Agile Methodologies", "Digital Marketing", "Risk Management", "Supply Chain Management", "E-commerce", "Project Management"],
    },
  ];
  const MAX_TAGS = 5;

  const TIER_OPTIONS: { value: EventTier; label: string; icon: React.ReactNode }[] = [
    { value: 1, label: "Participation", icon: <Users size={18} /> },
    { value: 2, label: "Practice", icon: <UserCheck size={18} /> },
    { value: 3, label: "Implementation", icon: <Award size={18} /> },
  ];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    endRepeatDate: "",
    startTime: "09:00",
    endTime: "10:30",
    location: "",
    locationLat: 0,
    locationLng: 0,
    maxAttendees: "50",
  });


  // Multi-select tag state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_TAGS) {
        toast.error(`You can select up to ${MAX_TAGS} tags.`);
        return prev;
      }
      return [...prev, tag];
    });
  };

  const totalSteps = 6;

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

  // Advanced schedule helpers
  const addScheduleEntry = () => {
    setAdvancedSchedule(prev => [
      ...prev,
      { id: crypto.randomUUID(), date: "", startTime: "09:00", endTime: "10:30", topic: "" }
    ]);
  };

  const removeScheduleEntry = (id: string) => {
    if (advancedSchedule.length > 1) {
      setAdvancedSchedule(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const updateScheduleEntry = (id: string, field: keyof AdvancedScheduleEntry, value: string) => {
    setAdvancedSchedule(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
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

    const certificateUrl: string | null = enableCertificate ? "pending" : null;

    const { error } = await supabase.from('events').insert({
      host_id: user.id,
      name: formData.name,
      description: formData.description || null,
      event_tag: selectedTags.length > 0 ? selectedTags.join(", ") : null,
      is_recurring: eventType === "recurring",
      recurring_days: eventType === "recurring" ? selectedDays : null,
      event_date: eventType === "recurring" ? null : formData.date,
      end_repeat_date: eventType === "recurring" && formData.endRepeatDate ? formData.endRepeatDate : null,
      start_time: formData.startTime,
      end_time: formData.endTime,
      location_name: formData.location,
      location_lat: formData.locationLat,
      location_lng: formData.locationLng,
      radius_meters: radius[0],
      max_attendees: parseInt(formData.maxAttendees) || 50,
      tracking_mode: trackingMode === "full-tracking" ? "full_tracking" : "count_only",
      certificate_url: certificateUrl,
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
  const canProceedToStep4 = formData.name.trim() !== "";
  const canProceedToStep5 = eventType === "one-time"
    ? !!formData.date
    : selectedDays.length > 0;
  const canProceedToStep6 = formData.location.trim() !== "";

  const handleNextStep = () => {
    if (currentStep === 1 && canProceedToStep2) setCurrentStep(2);
    else if (currentStep === 2 && canProceedToStep3) setCurrentStep(3);
    else if (currentStep === 3 && canProceedToStep4) setCurrentStep(4);
    else if (currentStep === 4 && canProceedToStep5) setCurrentStep(5);
    else if (currentStep === 5 && canProceedToStep6) setCurrentStep(6);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  if (authLoading) {
    return <PageLoading />;
  }

  // Summary badges component used on steps 4 and 5
  const SummaryBadges = () => (
    <div className="flex gap-2 justify-center flex-wrap mb-6">
      <span className="text-xs bg-primary/10 px-3 py-1.5 rounded-full text-primary font-medium flex items-center gap-1">
        {eventType === "one-time" ? <CalendarDays size={12} /> : <Repeat size={12} />}
        {eventType === "one-time" ? "One-time" : "Recurring"}
      </span>
      <span className="text-xs bg-primary/10 px-3 py-1.5 rounded-full text-primary font-medium flex items-center gap-1">
        {trackingMode === "count-only" ? <Users size={12} /> : <UserCheck size={12} />}
        {trackingMode === "count-only" ? "Count only" : "Full tracking"}
      </span>
      {eventTier && (
        <span className="text-xs bg-primary/10 px-3 py-1.5 rounded-full text-primary font-medium flex items-center gap-1">
          {TIER_OPTIONS.find(t => t.value === eventTier)?.icon}
          {TIER_OPTIONS.find(t => t.value === eventTier)?.label}
        </span>
      )}
    </div>
  );

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
            <p className="text-xs text-muted-foreground">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted max-w-2xl mx-auto">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
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
                  onClick={() => {
                    setTrackingMode("count-only");
                    setEnableCertificate(false);
                  }}
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

              {/* Conditional: Verification Strictness (Full Tracking only) */}
              <AnimatePresence initial={false}>
                {trackingMode === "full-tracking" && (
                  <motion.div
                    key="verification"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 space-y-3">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">Select Verification Strictness</h3>
                        <p className="text-sm text-muted-foreground">Choose how rigorously to verify each check-in.</p>
                      </div>

                      {([
                        {
                          value: "basic" as const,
                          title: "Level 1: Time Only",
                          description: "Low strictness. Validates the check-in time window. High convenience with minimal friction.",
                        },
                        {
                          value: "standard" as const,
                          title: "Level 2: Time + Dynamic QR",
                          description: "Medium strictness. Requires scanning a live refreshing QR code. Balances security with ease of use.",
                        },
                        {
                          value: "strict" as const,
                          title: "Level 3: Time + QR + GPS",
                          description: "High strictness. Enforces location radius alongside QR and time limits. Prevents remote check-ins.",
                        },
                      ]).map((level) => {
                        const selected = verificationLevel === level.value;
                        return (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => setVerificationLevel(level.value)}
                            className={cn(
                              "w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3",
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card hover:border-primary/50"
                            )}
                          >
                            <div className={cn(
                              "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                              selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                            )}>
                              {selected && <Check size={12} className="text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground text-sm">{level.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{level.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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

          {/* Step 3: Event Identity */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Describe your event</h2>
                <p className="text-muted-foreground">Give your event an identity</p>
              </div>

              {/* Event Tier Selection */}
              <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Tag size={18} />
                  Event Tier
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select the engagement level for this event.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {TIER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEventTier(option.value)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2",
                        eventTier === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        eventTier === option.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {option.icon}
                      </div>
                      <span className={cn(
                        "text-xs font-medium",
                        eventTier === option.value ? "text-primary" : "text-muted-foreground"
                      )}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Name */}
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

              {/* Description */}
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

              {/* Event Tags - Multi-Select from Competency Framework */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag size={14} />
                  Event Tags
                  <span className="text-xs font-normal text-muted-foreground ml-auto">
                    {selectedTags.length}/{MAX_TAGS} selected
                  </span>
                </Label>

                {/* Selected tag badges */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border bg-muted/30">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 pl-2 pr-1 py-0.5 text-xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="ml-0.5 rounded-full hover:bg-background/60 p-0.5 transition-colors"
                          aria-label={`Remove ${tag}`}
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={tagPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="text-muted-foreground">
                        {selectedTags.length === 0
                          ? "Select competency tags..."
                          : `Add more tags (${MAX_TAGS - selectedTags.length} remaining)`}
                      </span>
                      <ChevronsUpDown size={16} className="opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList className="max-h-72">
                        <CommandEmpty>No tag found.</CommandEmpty>
                        {TAG_CATEGORIES.map((group) => (
                          <CommandGroup key={group.category} heading={group.category}>
                            {group.tags.map((tag) => {
                              const selected = selectedTags.includes(tag);
                              const disabled = !selected && selectedTags.length >= MAX_TAGS;
                              return (
                                <CommandItem
                                  key={tag}
                                  value={`${group.category} ${tag}`}
                                  onSelect={() => !disabled && toggleTag(tag)}
                                  className={cn(
                                    "flex items-center gap-2",
                                    disabled && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                                      selected
                                        ? "bg-primary border-primary"
                                        : "border-muted-foreground/40"
                                    )}
                                  >
                                    {selected && (
                                      <Check size={12} className="text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="flex-1">{tag}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <p className="text-xs text-muted-foreground">
                  Choose up to {MAX_TAGS} tags from the 5-Dimension Competency Framework.
                </p>
              </div>

              <Button
                onClick={handleNextStep}
                disabled={!canProceedToStep4}
                className="w-full mt-4"
                size="lg"
              >
                Continue
                <ChevronRight size={18} className="ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 4: Schedule */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Set the schedule</h2>
                <p className="text-muted-foreground">
                  {eventType === "one-time" ? "Pick the date and time for your event" : "Configure recurring days and times"}
                </p>
              </div>

              <SummaryBadges />

              <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <Clock size={18} />
                    Schedule
                  </h3>
                  
                  {eventType === "recurring" && (
                    <div className="flex items-center bg-muted rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setScheduleMode("basic")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                          scheduleMode === "basic"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <List size={14} />
                        Basic
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleMode("advanced")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                          scheduleMode === "advanced"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Settings2 size={14} />
                        Advanced
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {(eventType === "one-time" || scheduleMode === "basic") ? (
                    <motion.div
                      key="basic-schedule"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {eventType === "recurring" ? (
                        <div className="space-y-4">
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
                          
                          <div className="space-y-2">
                            <Label htmlFor="endRepeatDate">End Repeat</Label>
                            <Input
                              id="endRepeatDate"
                              type="date"
                              value={formData.endRepeatDate}
                              onChange={(e) => setFormData({ ...formData, endRepeatDate: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                              Leave empty for no end date
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="advanced-schedule"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <p className="text-xs text-muted-foreground">
                        Configure detailed schedule with multiple sessions. Topic will be appended to event name.
                      </p>
                      
                      <div className="space-y-3">
                        {advancedSchedule.map((entry, index) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-muted/50 rounded-xl p-3 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">
                                Session {index + 1}
                              </span>
                              {advancedSchedule.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => removeScheduleEntry(entry.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Date</Label>
                                <Input
                                  type="date"
                                  value={entry.date}
                                  onChange={(e) => updateScheduleEntry(entry.id, "date", e.target.value)}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Start</Label>
                                <Input
                                  type="time"
                                  value={entry.startTime}
                                  onChange={(e) => updateScheduleEntry(entry.id, "startTime", e.target.value)}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">End</Label>
                                <Input
                                  type="time"
                                  value={entry.endTime}
                                  onChange={(e) => updateScheduleEntry(entry.id, "endTime", e.target.value)}
                                  className="h-9 text-sm"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">Topic (Optional)</Label>
                              <Input
                                placeholder="e.g., Introduction, Workshop, etc."
                                value={entry.topic}
                                onChange={(e) => updateScheduleEntry(entry.id, "topic", e.target.value)}
                                className="h-9 text-sm"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addScheduleEntry}
                        className="w-full"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Session
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                onClick={handleNextStep}
                disabled={!canProceedToStep5}
                className="w-full mt-4"
                size="lg"
              >
                Continue
                <ChevronRight size={18} className="ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 5: Location & Finalize */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Set the location</h2>
                <p className="text-muted-foreground">Pin your event on the map and finalize</p>
              </div>

              <SummaryBadges />

              <div className="space-y-6">
                {/* Location */}
                <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
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
                </div>

                {/* Max Attendees */}
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

                {/* eCertificate Toggle - Only for Full Tracking */}
                {trackingMode === "full-tracking" && (
                  <div className="bg-card rounded-2xl p-4 border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Award size={20} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Enable eCertificate</h3>
                          <p className="text-sm text-muted-foreground">
                            Issue certificates to attendees who complete the event
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={enableCertificate}
                        onCheckedChange={setEnableCertificate}
                      />
                    </div>
                    {enableCertificate && (
                      <p className="text-xs text-muted-foreground mt-3 pl-13">
                        💡 You can configure the certificate design later from the Event Details page
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProceedToStep6}
                  className="w-full"
                  size="lg"
                >
                  Next: Review Summary
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 6: Summary & Submit */}
          {currentStep === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Review & Confirm</h2>
                <p className="text-muted-foreground">Double-check your event details before publishing</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                  {/* Header strip */}
                  <div className="bg-primary/5 px-5 py-4 border-b border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Event Name</p>
                    <h3 className="text-lg font-semibold text-foreground break-words">
                      {formData.name || "Untitled Event"}
                    </h3>
                    {formData.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{formData.description}</p>
                    )}
                  </div>

                  {/* Detail rows */}
                  <dl className="divide-y divide-border">
                    <div className="px-5 py-3 grid grid-cols-3 gap-3 items-start">
                      <dt className="text-sm text-muted-foreground flex items-center gap-2 col-span-1">
                        <MapPin size={14} /> Location
                      </dt>
                      <dd className="text-sm font-medium text-foreground col-span-2 break-words">
                        {formData.location || <span className="text-muted-foreground italic">Not set</span>}
                      </dd>
                    </div>

                    <div className="px-5 py-3 grid grid-cols-3 gap-3 items-start">
                      <dt className="text-sm text-muted-foreground flex items-center gap-2 col-span-1">
                        <CalendarDays size={14} /> Schedule
                      </dt>
                      <dd className="text-sm font-medium text-foreground col-span-2">
                        {eventType === "one-time"
                          ? (formData.date || "No date selected")
                          : `Recurring · ${selectedDays.length} day${selectedDays.length === 1 ? "" : "s"}/week`}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formData.startTime} – {formData.endTime}
                        </div>
                      </dd>
                    </div>

                    <div className="px-5 py-3 grid grid-cols-3 gap-3 items-start">
                      <dt className="text-sm text-muted-foreground flex items-center gap-2 col-span-1">
                        <UserCheck size={14} /> Verification
                      </dt>
                      <dd className="col-span-2">
                        {trackingMode === "full-tracking" ? (
                          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                            verificationLevel === "strict"
                              ? "bg-destructive/10 text-destructive"
                              : verificationLevel === "standard"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}>
                            {verificationLevel === "basic" && "Level 1 · Basic"}
                            {verificationLevel === "standard" && "Level 2 · Standard"}
                            {verificationLevel === "strict" && "Level 3 · Strict"}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-foreground">Count only</span>
                        )}
                      </dd>
                    </div>

                    <div className="px-5 py-3 grid grid-cols-3 gap-3 items-start">
                      <dt className="text-sm text-muted-foreground col-span-1">Skill Tags</dt>
                      <dd className="col-span-2 flex flex-wrap gap-1.5">
                        {(selectedTags.length > 0
                          ? selectedTags
                          : ["Teamwork", "Communication", "Problem Solving"]
                        ).slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </dd>
                    </div>

                    {formData.maxAttendees && (
                      <div className="px-5 py-3 grid grid-cols-3 gap-3 items-start">
                        <dt className="text-sm text-muted-foreground flex items-center gap-2 col-span-1">
                          <Users size={14} /> Capacity
                        </dt>
                        <dd className="text-sm font-medium text-foreground col-span-2">
                          {formData.maxAttendees} attendees
                        </dd>
                      </div>
                    )}

                    {trackingMode === "full-tracking" && (
                      <div className="px-5 py-3 grid grid-cols-3 gap-3 items-start">
                        <dt className="text-sm text-muted-foreground flex items-center gap-2 col-span-1">
                          <Award size={14} /> eCertificate
                        </dt>
                        <dd className="text-sm font-medium text-foreground col-span-2">
                          {enableCertificate ? "Enabled" : "Disabled"}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  You can edit any of these details later from the Event Details page.
                </p>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
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
