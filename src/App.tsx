import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import RoleSelect from "./pages/RoleSelect";
import GuestJoin from "./pages/GuestJoin";
import HostDashboard from "./pages/host/Dashboard";
import CreateEvent from "./pages/host/CreateEvent";
import LiveMonitor from "./pages/host/LiveMonitor";
import UserDashboard from "./pages/user/Dashboard";
import UserProfile from "./pages/user/Profile";
import CheckIn from "./pages/CheckIn";
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
          <Route path="/host/dashboard" element={<HostDashboard />} />
          <Route path="/host/create-event" element={<CreateEvent />} />
          <Route path="/host/monitor/:eventId" element={<LiveMonitor />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/profile" element={<UserProfile />} />
          <Route path="/checkin" element={<CheckIn />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
