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
} from "lucide-react";
import LeafletLocationMap from "@/components/LeafletLocationMap";
import CertificateNameZoneEditor from "@/components/CertificateNameZoneEditor";

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
  const [nameZone, setNameZone] = useState({ x: 25, y: 45, width: 50, height: 10 });
  const [savingCertificate, setSavingCertificate] = useState(false);
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

    setEvent(eventData);
    
    // Initialize certificate state based on event data
    if (eventData.certificate_url) {
      setEnableCertificate(true);
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
                    onChange={(e) => setEnableCertificate(e.target.checked)}
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
                  {/* Achievement Criteria */}
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-primary" />
                      Achievement Criteria
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Attendees who achieve <span className="font-medium text-foreground">80% attendance</span> will receive a certificate.
                    </p>
                  </div>

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
                            Set Attendee Name Position
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Drag and resize the box to define where names will appear
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
                            <p className="font-medium text-foreground">Upload certificate template</p>
                            <p className="text-sm">PNG, JPG, or other image formats</p>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSaveCertificate}
                    disabled={savingCertificate}
                  >
                    {savingCertificate ? "Saving..." : "Save Certificate Settings"}
                  </Button>
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
