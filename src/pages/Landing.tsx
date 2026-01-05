import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";
import { Users, Shield, Zap, QrCode, MapPin, Award } from "lucide-react";
import { motion } from "framer-motion";
const Landing = () => {
  const navigate = useNavigate();
  const features = [{
    icon: MapPin,
    title: "GPS Verification",
    description: "Confirm presence with precise location tracking"
  }, {
    icon: QrCode,
    title: "Dynamic QR Codes",
    description: "Anti-fraud QR codes that refresh every few seconds"
  }, {
    icon: Shield,
    title: "Trusted Data",
    description: "Tamper-proof attendance records you can rely on"
  }, {
    icon: Award,
    title: "Digital Certificates",
    description: "Auto-generate beautiful attendance certificates"
  }];
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Animated gradient blobs */}
        <motion.div className="absolute top-10 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" animate={{
        x: [0, 30, 0],
        y: [0, -20, 0],
        scale: [1, 1.1, 1]
      }} transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
        <motion.div className="absolute top-40 -right-20 w-96 h-96 bg-secondary/25 rounded-full blur-3xl" animate={{
        x: [0, -40, 0],
        y: [0, 30, 0],
        scale: [1, 1.15, 1]
      }} transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
        <motion.div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-accent/20 rounded-full blur-3xl" animate={{
        x: [0, 20, 0],
        y: [0, -30, 0],
        scale: [1, 1.08, 1]
      }} transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background text-primary text-sm font-medium mb-6 backdrop-blur-sm shadow-md">
              <Zap size={16} />
              <span>Simple Presence Verification  </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Trusted Attendance
              <br />
              <span className="text-primary">Without the Fraud</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              GPS location and dynamic QR codes ensure that only those truly present can check in. 
              Perfect for classes, events, and conferences.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg" onClick={() => navigate("/guest-join")}>
                <Users className="mr-2" size={20} />
                Join Event as Guest
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 backdrop-blur-sm" onClick={() => navigate("/auth")}>
                Login / Sign up
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Check-in?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete solution for verified attendance tracking
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => <motion.div key={feature.title} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} className="bg-background rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="text-primary" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="bg-primary rounded-3xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to eliminate attendance fraud?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of educators and event organizers who trust Check-in for verified presence.
            </p>
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => navigate("/auth")}>
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © 2024 Check-in. Trusted presence verification.
        </div>
      </footer>
    </div>;
};
export default Landing;