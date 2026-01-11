import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, CalendarDays, Repeat, Users, UserCheck, ChevronRight, Check, Award, Download, Upload, FileImage, CheckCircle2, Plus, Trash2, Settings2, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import LeafletLocationPicker from "@/components/LeafletLocationPicker";
import CertificateNameZoneEditor from "@/components/CertificateNameZoneEditor";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type EventType = "one-time" | "recurring";
type TrackingMode = "count-only" | "full-tracking";
type ScheduleMode = "basic" | "advanced";

interface AdvancedScheduleEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
}

// eCertificate templates
const CERTIFICATE_TEMPLATES = [
  {
    id: "modern-blue",
    name: "Modern Blue",
    preview: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=280&fit=crop&auto=format",
    description: "Clean and professional design with blue accents"
  },
  {
    id: "classic-gold",
    name: "Classic Gold",
    preview: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=280&fit=crop&auto=format",
    description: "Elegant traditional style with gold borders"
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    preview: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=280&fit=crop&auto=format",
    description: "Modern minimalist dark theme"
  },
  {
    id: "corporate-green",
    name: "Corporate Green",
    preview: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=400&h=280&fit=crop&auto=format",
    description: "Professional corporate style with green tones"
  },
];

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Step-based state
  const [currentStep, setCurrentStep] = useState(1);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [trackingMode, setTrackingMode] = useState<TrackingMode | null>(null);
  
  // eCertificate state
  const [enableCertificate, setEnableCertificate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [uploadedTemplate, setUploadedTemplate] = useState<File | null>(null);
  const [uploadedTemplatePreview, setUploadedTemplatePreview] = useState<string | null>(null);
  const [nameZone, setNameZone] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 25,
    y: 45,
    width: 50,
    height: 10,
  });
  
  // Schedule mode state
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("basic");
  const [advancedSchedule, setAdvancedSchedule] = useState<AdvancedScheduleEntry[]>([
    { id: crypto.randomUUID(), date: "", startTime: "09:00", endTime: "10:30", topic: "" }
  ]);
  
  // Form state
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 2, 4]);
  const [radius, setRadius] = useState([50]);
  const [loading, setLoading] = useState(false);
  
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

  // Calculate total steps
  const totalSteps = enableCertificate && trackingMode === "full-tracking" ? 4 : 3;

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

  const handleTemplateExport = (templateId: string) => {
    // In a real app, this would download a template file
    toast.success(`Template "${CERTIFICATE_TEMPLATES.find(t => t.id === templateId)?.name}" exported! Edit it on your device and import back.`);
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file (PNG, JPG, etc.)");
        return;
      }
      
      setUploadedTemplate(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedTemplatePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success("Template uploaded successfully!");
    }
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

    // TODO: If uploadedTemplate exists, upload it to storage and get URL
    let certificateUrl: string | null = null;
    if (enableCertificate && uploadedTemplate) {
      // For now, we'll store a placeholder. In production, upload to storage
      certificateUrl = `certificate-template-${Date.now()}`;
    }

    const { error } = await supabase.from('events').insert({
      host_id: user.id,
      name: formData.name,
      description: formData.description || null,
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
  const canProceedToStep4 = enableCertificate && selectedTemplate !== null;

  const handleNextStep = () => {
    if (currentStep === 1 && canProceedToStep2) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedToStep3) {
      setCurrentStep(3);
    } else if (currentStep === 3 && enableCertificate && trackingMode === "full-tracking") {
      setCurrentStep(4);
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

              <form onSubmit={enableCertificate && trackingMode === "full-tracking" ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit} className="space-y-6">
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
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Clock size={18} />
                      Schedule
                    </h3>
                    
                    {/* Schedule Mode Toggle - Only show for recurring events */}
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
                    {/* For one-time events, always show basic schedule */}
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
                            {/* Time Selection Slots */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                  id="startTime"
                                  type="time"
                                  placeholder="e.g. 09:00"
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
                                  placeholder="e.g. 17:00"
                                  value={formData.endTime}
                                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                  required
                                />
                              </div>
                            </div>
                            
                            {/* Select Days */}
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
                            
                            {/* End Repeat Date */}
                            <div className="space-y-2">
                              <Label htmlFor="endRepeatDate">End Repeat</Label>
                              <Input
                                id="endRepeatDate"
                                type="date"
                                placeholder="Select end date"
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
                                placeholder="Select event date"
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
                                  placeholder="e.g. 09:00"
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
                                  placeholder="e.g. 17:00"
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
                        
                        {/* Schedule Table */}
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

                {/* eCertificate Toggle - Only for Full Tracking */}
                {trackingMode === "full-tracking" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-2xl p-4 border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Award size={20} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Create eCertificate</h3>
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
                  </motion.div>
                )}

                {/* Submit or Continue */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  disabled={loading}
                >
                  {enableCertificate && trackingMode === "full-tracking" ? (
                    <>
                      Continue to Certificate Setup
                      <ChevronRight size={18} className="ml-1" />
                    </>
                  ) : (
                    loading ? "Creating Event..." : "Create Event"
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {/* Step 4: eCertificate Setup */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">eCertificate Setup</h2>
                <p className="text-muted-foreground">
                  Easy format template — ready to use
                </p>
              </div>

              {/* Achievement Criteria */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/5 rounded-2xl p-4 border border-primary/20"
              >
                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Award size={18} className="text-primary" />
                  Achievement Criteria
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Attendees will receive a certificate when they meet the following requirement:
                </p>
                <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">80% Attendance Rate</p>
                    <p className="text-xs text-muted-foreground">
                      Participants must attend at least 80% of all sessions
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Certificate Image Guideline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                <Label className="flex items-center gap-2">
                  <FileImage size={16} />
                  Certificate Image Guideline
                </Label>
                <p className="text-xs text-muted-foreground">
                  Design your certificate following this template layout. The system will automatically embed user data.
                </p>
                
                {/* Certificate Preview Template - Elegant Real Certificate Look */}
                <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40 rounded-2xl border-4 border-double border-amber-400 dark:border-amber-600 overflow-hidden aspect-[4/3] shadow-xl">
                  {/* Decorative Corner Ornaments */}
                  <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-amber-500/60 dark:border-amber-400/60 rounded-tl-lg" />
                  <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-amber-500/60 dark:border-amber-400/60 rounded-tr-lg" />
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-amber-500/60 dark:border-amber-400/60 rounded-bl-lg" />
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-amber-500/60 dark:border-amber-400/60 rounded-br-lg" />
                  
                  {/* Inner Decorative Border */}
                  <div className="absolute inset-5 border border-amber-300/70 dark:border-amber-700/70 rounded-lg pointer-events-none" />
                  
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_transparent_0%,_transparent_50%,_rgba(180,120,50,0.3)_100%)]" />
                  
                  {/* Certificate Content */}
                  <div className="relative h-full flex flex-col items-center justify-between p-6 pt-4">
                    {/* Top Section - Topic */}
                    <div className="text-center space-y-1">
                      <p className="text-[9px] text-amber-600/80 dark:text-amber-400/80 font-medium uppercase tracking-[0.2em]">
                        Certificate of Completion
                      </p>
                      <div className="px-4 py-1 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent dark:via-amber-800/30">
                        <p className="text-xs font-serif text-amber-800 dark:text-amber-200 italic">
                          {formData.name ? "Session Topic / Module Name" : "Session Topic"}
                        </p>
                      </div>
                    </div>

                    {/* Main Title - Event Name */}
                    <div className="text-center space-y-1 -mt-1">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-px bg-gradient-to-r from-transparent to-amber-400 dark:to-amber-500" />
                        <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                        <div className="w-8 h-px bg-gradient-to-l from-transparent to-amber-400 dark:to-amber-500" />
                      </div>
                      <p className="text-lg font-bold font-serif text-amber-900 dark:text-amber-100 tracking-wide">
                        {formData.name || "Your Event Name"}
                      </p>
                    </div>

                    {/* This certifies section */}
                    <div className="text-center space-y-1">
                      <p className="text-[8px] text-amber-700/70 dark:text-amber-300/70 uppercase tracking-wider">
                        This is to certify that
                      </p>
                      <div className="relative">
                        <p className="text-base font-semibold font-serif text-amber-800 dark:text-amber-200">
                          John Doe
                        </p>
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                      </div>
                      <p className="text-[7px] text-muted-foreground mt-1">
                        (Attendee name auto-filled)
                      </p>
                    </div>

                    {/* Completion Text & Date */}
                    <div className="text-center space-y-0.5">
                      <p className="text-[8px] text-amber-700/80 dark:text-amber-300/80">
                        has successfully completed all requirements on
                      </p>
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        {formData.date || "January 13, 2026"}
                      </p>
                    </div>

                    {/* Bottom Section - QR Code & Signature */}
                    <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                      {/* QR Code Section - Left */}
                      <div className="flex items-end gap-2">
                        <div className="bg-white dark:bg-gray-900 p-1.5 rounded-lg border border-amber-300/80 dark:border-amber-700/80 shadow-sm">
                          <QRCodeSVG 
                            value="https://app.example.com/verify/event-123"
                            size={40}
                            level="L"
                            bgColor="transparent"
                            fgColor="currentColor"
                            className="text-amber-900 dark:text-amber-100"
                          />
                        </div>
                        <div className="space-y-0.5 pb-0.5">
                          <p className="text-[7px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                            Verify Certificate
                          </p>
                          <p className="text-[6px] text-muted-foreground leading-tight max-w-[70px]">
                            Scan to verify authenticity
                          </p>
                        </div>
                      </div>

                      {/* Signature Section - Right */}
                      <div className="text-center">
                        <div className="w-20 h-6 mb-0.5">
                          <svg viewBox="0 0 100 30" className="w-full h-full text-amber-700 dark:text-amber-300">
                            <path 
                              d="M10 20 Q20 10 30 18 T50 15 T70 20 Q80 25 90 18" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <div className="w-20 h-px bg-amber-600/50 dark:bg-amber-400/50" />
                        <p className="text-[7px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide mt-0.5">
                          Authorized Signature
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  ↑ Preview of auto-generated certificate. Upload your custom design below.</p>
              </motion.div>

              {/* Upload Customized Template */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <Label>Upload Your Certificate Design</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleTemplateUpload}
                  className="hidden"
                />
                
{uploadedTemplatePreview ? (
                  <div className="space-y-4">
                    {/* Status bar */}
                    <div className="p-3 flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-medium">Template uploaded</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change
                      </Button>
                    </div>

                    {/* Name Zone Editor */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Settings2 size={16} />
                        Set Attendee Name Position
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Drag and resize the box to define where attendee names will appear on the certificate
                      </p>
                      <CertificateNameZoneEditor
                        imageUrl={uploadedTemplatePreview}
                        zone={nameZone}
                        onZoneChange={setNameZone}
                        className="mt-2"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        <Upload size={24} />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">Upload your template</p>
                        <p className="text-sm">PNG, JPG, or other image formats</p>
                      </div>
                    </div>
                  </button>
                )}
              </motion.div>

              {/* Submit */}
              <Button 
                type="button" 
                className="w-full" 
                size="lg" 
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? "Creating Event..." : "Create Event with Certificate"}
              </Button>

              {/* Skip option */}
              <Button 
                type="button" 
                variant="ghost"
                className="w-full" 
                onClick={() => {
                  setEnableCertificate(false);
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                }}
              >
                Skip certificate setup for now
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateEvent;
