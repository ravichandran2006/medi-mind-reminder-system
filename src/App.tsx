import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import ReminderSystem from "./components/ReminderSystem";
import Dashboard from "./pages/Dashboard";
import MedicationScheduler from "./pages/MedicationScheduler";
import HealthLog from "./pages/HealthLog";
import AIChat from "./pages/AIChat";
import HealthTips from "./pages/HealthTips";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen w-full">
          <Navigation />
          <div className="lg:ml-64 flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/medications" element={<MedicationScheduler />} />
              <Route path="/health-log" element={<HealthLog />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/health-tips" element={<HealthTips />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <ReminderSystem />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
