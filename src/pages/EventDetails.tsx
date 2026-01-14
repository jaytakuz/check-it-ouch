import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, isToday } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  QrCode,
  Share2,
  BookOpen,
  Award,
  Target,
  Play,
  User,
  Star,
  Pencil,
  Tag,
  Upload,
  Settings2,
  FileImage,
  Info,
  ChevronRight,
  ChevronLeft,
  Move,
  Maximize2,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import LeafletLocationMap from "@/components/LeafletLocationMap";
import CertificateMultiZoneEditor, { CertificateZones } from "@/components/CertificateMultiZoneEditor";

interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  is_recurring: boolean;
  recurring_days: number[] | null;
  start_time: string;
  end_time: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  radius_meters: number;
  max_attendees: number | null;
  is_active: boolean;
  host_id: string;
  certificate_url: string | null;
  event_tag: string | null;
  certificate_threshold: number;
  certificate_zones: CertificateZones | null;
}

interface HostProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface CheckInStats {
  total: number;
  userCheckIns: number;
  lastCheckIn: string | null;
}

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);
  const [checkInStats, setCheckInStats] = useState<CheckInStats>({
    total: 0,
    userCheckIns: 0,
    lastCheckIn: null,
  });
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  // Certificate configuration state
  const [enableCertificate, setEnableCertificate] = useState(false);
  const [uploadedTemplatePreview, setUploadedTemplatePreview] = useState<string | null>(null);
  const [certificateZones, setCertificateZones] = useState<CertificateZones>({
    eventName: { x: 10, y: 15, width: 80, height: 8 },
    attendeeName: { x: 25, y: 45, width: 50, height: 10 },
    verification: { x: 70, y: 80, width: 20, height: 15 },
  });
  const [savingCertificate, setSavingCertificate] = useState(false);
  const [certificateStep, setCertificateStep] = useState<1 | 2 | 3>(1);
  const [certificateThreshold, setCertificateThreshold] = useState(80);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect if viewing as host (from /host/event/... route)
  const isHostView = window.location.pathname.startsWith("/host/event");

  useEffect(() => {
    if (!eventId) {
      navigate("/");
      return;
    }
    fetchEventDetails();
  }, [eventId, user]);

  const fetchEventDetails = async () => {
    if (!eventId) return;

    // Fetch event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !eventData) {
      console.error("Error fetching event:", eventError);
      toast.error("Event not found");
      navigate("/");
      return;
    }

    // Cast certificate_zones to CertificateZones type
    const parsedEvent: Event = {
      ...eventData,
      certificate_zones: eventData.certificate_zones as unknown as CertificateZones | null,
    };

    setEvent(parsedEvent);
    
    // Initialize certificate state based on event data
    if (eventData.certificate_url) {
      setEnableCertificate(true);
    }
    
    // Initialize certificate threshold from event data
    if (eventData.certificate_threshold) {
      setCertificateThreshold(eventData.certificate_threshold);
    }
    
    // Initialize certificate zones from event data
    if (eventData.certificate_zones) {
      setCertificateZones(eventData.certificate_zones as unknown as CertificateZones);
    }

    // Fetch host profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", eventData.host_id)
      .maybeSingle();

    setHostProfile(profileData);

    // Fetch check-in stats
    const { count: totalCheckIns } = await supabase
      .from("check_ins")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    let userCheckIns = 0;
    let lastCheckIn = null;
    let enrolled = false;

    if (user) {
      const { data: userCheckInsData, count: userCheckInCount } = await supabase
        .from("check_ins")
        .select("*", { count: "exact" })
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .order("checked_in_at", { ascending: false });

      userCheckIns = userCheckInCount || 0;
      enrolled = userCheckIns > 0;
      if (userCheckInsData && userCheckInsData.length > 0) {
        lastCheckIn = userCheckInsData[0].checked_in_at;
      }
    }

    setCheckInStats({
      total: totalCheckIns || 0,
      userCheckIns,
      lastCheckIn,
    });
    setIsEnrolled(enrolled);
    setLoading(false);
  };

  const formatEventSchedule = (): string => {
    if (!event) return "";

    if (event.is_recurring && event.recurring_days) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayNames = event.recurring_days.map((d) => days[d]).join(", ");
      return `Every ${dayNames}`;
    }
    if (event.event_date) {
      return format(parseISO(event.event_date), "EEEE, MMMM d, yyyy");
    }
    return "Schedule TBD";
  };

  const formatTime = (time: string): string => {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const isEventLive = (): boolean => {
    if (!event) return false;

    const now = new Date();
    const currentTime = format(now, "HH:mm:ss");

    if (event.is_recurring && event.recurring_days) {
      const currentDay = now.getDay();
      return (
        event.recurring_days.includes(currentDay) &&
        currentTime >= event.start_time &&
        currentTime <= event.end_time
      );
    }
    if (event.event_date && isToday(parseISO(event.event_date))) {
      return currentTime >= event.start_time && currentTime <= event.end_time;
    }
    return false;
  };

  const getAttendanceProgress = (): number => {
    if (!event?.max_attendees) return 0;
    return Math.min(100, Math.round((checkInStats.total / event.max_attendees) * 100));
  };

  // Calculate user's attendance percentage
  const getUserAttendancePercentage = (): number => {
    if (!event) return 0;
    
    // For now, use a simple calculation based on total sessions
    // In a real scenario, this would need to count total available sessions
    if (event.is_recurring) {
      // For recurring events, we'd need to calculate based on recurring_days and date range
      // For simplicity, just use check-in count / estimated sessions
      const estimatedTotalSessions = 10; // Placeholder - should be calculated
      return Math.min(100, Math.round((checkInStats.userCheckIns / estimatedTotalSessions) * 100));
    }
    // For one-time events, if they checked in, it's 100%
    return checkInStats.userCheckIns > 0 ? 100 : 0;
  };

  const canDownloadCertificate = (): boolean => {
    if (!event || !enableCertificate) return false;
    const attendancePercentage = getUserAttendancePercentage();
    return attendancePercentage >= event.certificate_threshold;
  };

  const handleGenerateCertificate = async () => {
    if (!event || !user) return;

    setGeneratingCertificate(true);
    try {
      const response = await supabase.functions.invoke('generate-certificate', {
        body: {
          eventId: event.id,
          userId: user.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.certificate) {
        setGeneratedCertificate(data.certificate);
        // Create download link
        const blob = new Blob([data.certificate], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Certificate downloaded!');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const handleSaveThreshold = async () => {
    if (!event) return;
    
    setSavingCertificate(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ certificate_threshold: certificateThreshold })
        .eq('id', event.id);

      if (error) throw error;
      toast.success('Certificate threshold saved!');
    } catch (error) {
      console.error('Error saving threshold:', error);
      toast.error('Failed to save threshold');
    } finally {
      setSavingCertificate(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.name,
          text: event?.description || `Check out this event: ${event?.name}`,
          url,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleCheckIn = () => {
    navigate("/checkin", { state: { eventId } });
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file (PNG, JPG, etc.)");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedTemplatePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Template uploaded successfully!");
    }
  };

  const handleSaveCertificate = async () => {
    if (!event || !eventId) return;
    
    setSavingCertificate(true);
    
    // For now, store a placeholder URL. In production, upload to storage
    const certificateUrl = enableCertificate ? `certificate-${eventId}-${Date.now()}` : null;
    
    const { error } = await supabase
      .from("events")
      .update({ certificate_url: certificateUrl })
      .eq("id", eventId);
    
    if (error) {
      console.error("Error saving certificate:", error);
      toast.error("Failed to save certificate settings");
    } else {
      toast.success(enableCertificate ? "Certificate settings saved!" : "Certificate disabled");
      // Refresh event data
      setEvent({ ...event, certificate_url: certificateUrl });
    }
    
    setSavingCertificate(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const isLive = isEventLive();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-2">
              {isHostView && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate(`/host/edit-event/${eventId}`)}
                >
                  <Pencil size={20} />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 pt-4"
      >
        {/* Event Banner */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-border overflow-hidden mb-4">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {isLive && (
                <Badge className="bg-success text-success-foreground">
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse mr-1.5" />
                  Live Now
                </Badge>
              )}
              <Badge variant="outline">
                {event.is_recurring ? "Recurring" : "One-time"}
              </Badge>
              {event.certificate_url && (
                <Badge variant="secondary">
                  <Award size={12} className="mr-1" />
                  Certificate
                </Badge>
              )}
              {event.event_tag && (
                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                  <Tag size={12} className="mr-1" />
                  {event.event_tag}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-2">{event.name}</h1>

            {/* Instructor */}
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                {hostProfile?.avatar_url ? (
                  <img
                    src={hostProfile.avatar_url}
                    alt={hostProfile.full_name || "Host"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hosted by</p>
                <p className="font-medium text-foreground">
                  {hostProfile?.full_name || "Anonymous Host"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Users size={18} className="mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold text-foreground">{checkInStats.total}</div>
            <div className="text-xs text-muted-foreground">Attendees</div>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Star size={18} className="mx-auto mb-1 text-warning" />
            <div className="text-lg font-bold text-foreground">
              {checkInStats.userCheckIns}
            </div>
            <div className="text-xs text-muted-foreground">Your Sessions</div>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Target size={18} className="mx-auto mb-1 text-success" />
            <div className="text-lg font-bold text-foreground">
              {getAttendanceProgress()}%
            </div>
            <div className="text-xs text-muted-foreground">Capacity</div>
          </div>
        </div>

        {/* Enrollment Progress (Coursera style) - only show for attendees */}
        {isEnrolled && !isHostView && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-success/10 border border-success/20 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-success">You're enrolled!</p>
                <p className="text-sm text-success/80">
                  {checkInStats.userCheckIns} check-in{checkInStats.userCheckIns !== 1 ? "s" : ""} completed
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="about" className="max-w-2xl mx-auto px-4">
        <TabsList className={`w-full grid mb-4 ${isHostView ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          {isHostView && <TabsTrigger value="certificate">Certificate</TabsTrigger>}
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          {/* Description */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={18} className="text-primary" />
              <h3 className="font-semibold text-foreground">About this Event</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {event.description || "No description provided for this event."}
            </p>
          </div>

          {/* What you'll learn / Key Features */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-primary" />
              <h3 className="font-semibold text-foreground">Key Features</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                <span className="text-muted-foreground text-sm">
                  QR code check-in for verified attendance
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                <span className="text-muted-foreground text-sm">
                  GPS-based location verification
                </span>
              </li>
              {event.certificate_url && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                  <span className="text-muted-foreground text-sm">
                    Certificate of completion available
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                <span className="text-muted-foreground text-sm">
                  Real-time attendance tracking
                </span>
              </li>
            </ul>
          </div>

          {/* Certificate Download - Attendee View Only */}
          {!isHostView && enableCertificate && isEnrolled && user && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Award size={18} className="text-primary" />
                <h3 className="font-semibold text-foreground">Certificate</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your Attendance</span>
                  <span className="font-medium text-foreground">{getUserAttendancePercentage()}%</span>
                </div>
                <Progress value={getUserAttendancePercentage()} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Required: {event.certificate_threshold}% to earn certificate
                </p>
                
                {canDownloadCertificate() ? (
                  <Button
                    onClick={handleGenerateCertificate}
                    disabled={generatingCertificate}
                    className="w-full"
                  >
                    {generatingCertificate ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download size={16} className="mr-2" />
                        Download Certificate
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      Attend more sessions to earn your certificate
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Capacity */}
          {event.max_attendees && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Enrollment</span>
                <span className="text-sm font-medium text-foreground">
                  {checkInStats.total} / {event.max_attendees}
                </span>
              </div>
              <Progress value={getAttendanceProgress()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {event.max_attendees - checkInStats.total} spots remaining
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-primary" />
              <h3 className="font-semibold text-foreground">Schedule</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Date</p>
                  <p className="text-sm text-muted-foreground">{formatEventSchedule()}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                  </p>
                </div>
              </div>

              {event.is_recurring && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                      <Play size={18} className="text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Recurring Event</p>
                      <p className="text-sm text-muted-foreground">
                        This event repeats on the scheduled days
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Last Check-in */}
          {checkInStats.lastCheckIn && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={18} className="text-success" />
                <h3 className="font-semibold text-foreground">Your Last Check-in</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(checkInStats.lastCheckIn), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="location" className="space-y-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={18} className="text-primary" />
              <h3 className="font-semibold text-foreground">Location</h3>
            </div>

            <div className="mb-4">
              <p className="font-medium text-foreground">{event.location_name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check-in radius: {event.radius_meters}m
              </p>
            </div>

            {/* Map */}
            <div className="h-[200px] rounded-xl overflow-hidden border border-border">
              <LeafletLocationMap
                eventLocation={{ lat: event.location_lat, lng: event.location_lng }}
                radiusMeters={event.radius_meters}
              />
            </div>
          </div>
        </TabsContent>

        {/* Certificate Tab - Host Only */}
        {isHostView && (
          <TabsContent value="certificate" className="space-y-4">
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Award size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">eCertificate</h3>
                    <p className="text-sm text-muted-foreground">
                      Issue certificates to attendees
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCertificate}
                    onChange={(e) => {
                      setEnableCertificate(e.target.checked);
                      if (e.target.checked) setCertificateStep(1);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>

              {enableCertificate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4 pt-4 border-t border-border"
                >
                  {/* Step Indicators */}
                  <div className="flex items-center justify-between mb-6">
                    {[
                      { step: 1, label: "Guideline", icon: Info },
                      { step: 2, label: "Edit Zone", icon: Settings2 },
                      { step: 3, label: "Preview", icon: Eye },
                    ].map(({ step, label, icon: Icon }, index) => (
                      <React.Fragment key={step}>
                        <button
                          onClick={() => setCertificateStep(step as 1 | 2 | 3)}
                          className={`flex flex-col items-center gap-1 transition-all ${
                            certificateStep === step
                              ? "text-primary"
                              : certificateStep > step
                              ? "text-primary/60"
                              : "text-muted-foreground"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              certificateStep === step
                                ? "bg-primary text-primary-foreground"
                                : certificateStep > step
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                        {index < 2 && (
                          <div
                            className={`flex-1 h-0.5 mx-2 ${
                              certificateStep > step ? "bg-primary/60" : "bg-muted"
                            }`}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Step 1: Guideline */}
                  {certificateStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      {/* Achievement Criteria with Slider */}
                      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-primary" />
                          Achievement Criteria
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Required Attendance</span>
                            <span className="text-lg font-bold text-primary">{certificateThreshold}%</span>
                          </div>
                          <Slider
                            value={[certificateThreshold]}
                            onValueChange={(value) => setCertificateThreshold(value[0])}
                            min={50}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                          </div>
                          <Button
                            onClick={handleSaveThreshold}
                            disabled={savingCertificate}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            {savingCertificate ? (
                              <>
                                <Loader2 size={14} className="mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Threshold'
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Info size={18} className="text-primary" />
                          Certificate Guideline
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Below is an example certificate showing which parts you can configure in{" "}
                          <span className="font-medium text-foreground">Step 3</span>.
                        </p>
                      </div>

                      {/* Example Certificate Diagram */}
                      <div className="relative bg-gradient-to-br from-muted/50 to-muted rounded-xl p-6 border-2 border-dashed border-border overflow-hidden">
                        {/* Mock Certificate */}
                        <div className="bg-background rounded-lg shadow-lg p-6 space-y-4 relative">
                          <div className="text-center space-y-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Certificate of Attendance</p>
                            
                            {/* Event Name Zone */}
                            <div className="relative inline-block w-full">
                              <div className="border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-4 py-2">
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">event_name</p>
                              </div>
                              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <Move size={10} />
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-center text-muted-foreground">This is to certify that</p>

                          {/* Attendee Name Zone - Highlighted as editable */}
                          <div className="relative">
                            <div className="border-2 border-dashed border-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg px-4 py-3">
                              <p className="text-xl font-bold text-center text-green-600 dark:text-green-400">attendee_name</p>
                            </div>
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <Move size={10} />
                              <Maximize2 size={10} />
                            </div>
                          </div>

                          <p className="text-xs text-center text-muted-foreground pt-4">
                            has successfully completed the requirements for this event.
                          </p>

                          {/* Verification Zone */}
                          <div className="flex justify-end mt-4">
                            <div className="relative">
                              <div className="border-2 border-dashed border-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded-lg px-3 py-2 flex flex-col items-center gap-1">
                                <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded flex items-center justify-center">
                                  <QrCode size={24} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <p className="text-[10px] text-purple-600 dark:text-purple-400">verification</p>
                              </div>
                              <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <Move size={10} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Parameter Boxes Explanation */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-foreground text-sm">Parameter Boxes:</h5>
                        
                        <div className="grid gap-2">
                          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">event_name</p>
                              <p className="text-xs text-muted-foreground">
                                Displays the event name. <span className="text-blue-600 dark:text-blue-400 font-medium">Movable only.</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">attendee_name</p>
                              <p className="text-xs text-muted-foreground">
                                Displays the attendee's name. <span className="text-green-600 dark:text-green-400 font-medium">Movable + Resizable</span> — adjust for max name alignment (vertical & horizontal).
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="w-3 h-3 rounded-full bg-purple-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">verification</p>
                              <p className="text-xs text-muted-foreground">
                                QR code / URL link to event detail page for verification. <span className="text-purple-600 dark:text-purple-400 font-medium">Movable only.</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            <strong>Note:</strong> Our system only edits the text inside each parameter box. You can move all boxes freely, but only <strong>attendee_name</strong> can be resized.
                          </p>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => setCertificateStep(2)}
                      >
                        Next: Upload Template
                        <ChevronRight size={18} className="ml-2" />
                      </Button>
                    </motion.div>
                  )}

                  {/* Step 2: Edit Zone */}
                  {certificateStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      {/* Upload Template */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <FileImage size={16} />
                          Certificate Template
                        </label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleTemplateUpload}
                          className="hidden"
                        />
                        
                        {uploadedTemplatePreview ? (
                          <div className="space-y-4">
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

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Settings2 size={14} />
                                Configure Zone Positions
                              </label>
                              <p className="text-xs text-muted-foreground">
                                Drag any zone to move. Only Attendee Name can be resized.
                              </p>
                              <CertificateMultiZoneEditor
                                imageUrl={uploadedTemplatePreview}
                                zones={certificateZones}
                                onZonesChange={setCertificateZones}
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
                                <p className="font-medium text-foreground">Upload certificate template</p>
                                <p className="text-sm">PNG, JPG, or other image formats</p>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setCertificateStep(1)}
                        >
                          <ChevronLeft size={18} className="mr-2" />
                          Back
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => setCertificateStep(3)}
                          disabled={!uploadedTemplatePreview}
                        >
                          Next: Preview
                          <ChevronRight size={18} className="ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Preview */}
                  {certificateStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                          <Eye size={16} className="text-primary" />
                          Certificate Preview
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          This is how the certificate will look with attendee information filled in.
                        </p>
                      </div>

                      {/* Preview with zones */}
                      {uploadedTemplatePreview && (
                        <div className="relative rounded-xl overflow-hidden border border-border">
                          <img
                            src={uploadedTemplatePreview}
                            alt="Certificate Preview"
                            className="w-full h-auto"
                          />
                          
                          {/* Event Name Zone Preview */}
                          <div
                            className="absolute border-2 border-blue-400 bg-blue-500/20 rounded flex items-center justify-center"
                            style={{
                              left: `${certificateZones.eventName.x}%`,
                              top: `${certificateZones.eventName.y}%`,
                              width: `${certificateZones.eventName.width}%`,
                              height: `${certificateZones.eventName.height}%`,
                            }}
                          >
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-background/80 px-2 py-0.5 rounded">
                              {event?.name || "Event Name"}
                            </span>
                          </div>

                          {/* Attendee Name Zone Preview */}
                          <div
                            className="absolute border-2 border-green-400 bg-green-500/20 rounded flex items-center justify-center"
                            style={{
                              left: `${certificateZones.attendeeName.x}%`,
                              top: `${certificateZones.attendeeName.y}%`,
                              width: `${certificateZones.attendeeName.width}%`,
                              height: `${certificateZones.attendeeName.height}%`,
                            }}
                          >
                            <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-background/80 px-2 py-0.5 rounded">
                              John Doe
                            </span>
                          </div>

                          {/* Verification Zone Preview */}
                          <div
                            className="absolute border-2 border-purple-400 bg-purple-500/20 rounded flex items-center justify-center"
                            style={{
                              left: `${certificateZones.verification.x}%`,
                              top: `${certificateZones.verification.y}%`,
                              width: `${certificateZones.verification.width}%`,
                              height: `${certificateZones.verification.height}%`,
                            }}
                          >
                            <QrCode size={20} className="text-purple-600 dark:text-purple-400" />
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground text-center">
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500" /> Event Name
                        </span>
                        <span className="mx-3">|</span>
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" /> Attendee Name
                        </span>
                        <span className="mx-3">|</span>
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-purple-500" /> Verification
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setCertificateStep(2)}
                        >
                          <ChevronLeft size={18} className="mr-2" />
                          Back
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleSaveCertificate}
                          disabled={savingCertificate}
                        >
                          {savingCertificate ? "Saving..." : "Save Certificate"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {!enableCertificate && event.certificate_url && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleSaveCertificate}
                  disabled={savingCertificate}
                >
                  {savingCertificate ? "Saving..." : "Disable Certificate"}
                </Button>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Fixed Bottom CTA - only show for attendees */}
      {!isHostView && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border">
          <div className="flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={handleCheckIn}
              disabled={!isLive && !event.is_recurring}
            >
              <QrCode size={18} className="mr-2" />
              {isLive ? "Check In Now" : "Scan QR Code"}
            </Button>
          </div>
          {!isLive && !event.is_recurring && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Check-in available when the event is live
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EventDetails;
