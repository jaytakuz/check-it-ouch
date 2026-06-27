import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnonymousSuccessPageProps {
  /** Sequential attendee number to display (e.g. 45 → "You are attendee #45"). */
  attendeeNumber?: number;
  /** Optional event name shown under the heading. */
  eventName?: string;
  /** Override the Done button behaviour. Defaults to navigating home. */
  onDone?: () => void;
}

/**
 * Full-screen confirmation page shown to anonymous attendees after a successful
 * "Count Only" check-in. No login is required for this flow, so the page is
 * intentionally minimal: a single celebratory state with one quiet exit action.
 */
const AnonymousSuccessPage = ({
  attendeeNumber = 45,
  eventName,
  onDone,
}: AnonymousSuccessPageProps) => {
  const navigate = useNavigate();

  const handleDone = () => {
    if (onDone) onDone();
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {/* Animated success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="relative mb-8"
        >
          {/* Pulse rings */}
          <span className="absolute inset-0 rounded-full bg-success/20 animate-pulse-ring" />
          <span
            className="absolute inset-0 rounded-full bg-success/15 animate-pulse-ring"
            style={{ animationDelay: "0.6s" }}
          />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-success flex items-center justify-center shadow-lg">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 14 }}
            >
              <Check
                size={64}
                className="text-success-foreground"
                strokeWidth={3}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3"
        >
          Checked In Successfully!
        </motion.h1>

        {/* Optional event name */}
        {eventName && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-sm text-muted-foreground mb-1"
          >
            {eventName}
          </motion.p>
        )}

        {/* Attendee number — muted */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-base text-muted-foreground mb-10"
        >
          You are attendee{" "}
          <span className="font-semibold text-foreground/80">
            #{attendeeNumber}
          </span>
        </motion.p>

        {/* Quiet exit action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="w-full"
        >
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto sm:min-w-[180px]"
            onClick={handleDone}
          >
            Done
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default AnonymousSuccessPage;
