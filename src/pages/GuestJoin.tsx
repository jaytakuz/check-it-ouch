import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Hash, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const GuestJoin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    eventCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate finding event
    await new Promise((resolve) => setTimeout(resolve, 800));

    toast.success("Event found! Redirecting to check-in...");
    navigate("/checkin");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Join as Guest
            </h1>
            <p className="text-muted-foreground">
              Enter your details and event code to check in
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventCode">Event Code</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="eventCode"
                  type="text"
                  placeholder="e.g., ABC123"
                  className="pl-10 uppercase"
                  value={formData.eventCode}
                  onChange={(e) => setFormData({ ...formData, eventCode: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ask your host for the event code
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Finding event..." : "Join Event"}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Note:</strong> As a guest, your check-in will be stored locally on this device.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GuestJoin;
