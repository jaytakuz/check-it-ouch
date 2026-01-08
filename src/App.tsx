import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import RoleSelect from "./pages/RoleSelect";
import GuestJoin from "./pages/GuestJoin";
import UnifiedDashboard from "./pages/UnifiedDashboard";
import CreateEvent from "./pages/host/CreateEvent";
import EditEvent from "./pages/host/EditEvent";
import LiveMonitor from "./pages/host/LiveMonitor";
import AttendanceLogs from "./pages/host/AttendanceLogs";
import UserProfile from "./pages/user/Profile";
import CheckIn from "./pages/CheckIn";
import EventDetails from "./pages/EventDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/role-select" element={<RoleSelect />} />
          <Route path="/guest-join" element={<GuestJoin />} />
          
          {/* Main Dashboard */}
          <Route path="/dashboard" element={<UnifiedDashboard />} />
          
          {/* Legacy routes - redirect to unified dashboard */}
          <Route path="/host/dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/user/dashboard" element={<Navigate to="/dashboard" replace />} />
          
          {/* Host-specific pages */}
          <Route path="/host/create-event" element={<CreateEvent />} />
          <Route path="/host/edit-event/:eventId" element={<EditEvent />} />
          <Route path="/host/monitor/:eventId" element={<LiveMonitor />} />
          <Route path="/host/attendance/:eventId" element={<AttendanceLogs />} />
          <Route path="/host/event/:eventId" element={<EventDetails />} />
          
          {/* User-specific pages */}
          <Route path="/user/profile" element={<UserProfile />} />
          
          {/* Shared pages */}
          <Route path="/event/:eventId" element={<EventDetails />} />
          <Route path="/checkin" element={<CheckIn />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
