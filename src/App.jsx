import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navigation from "./components/Navigation.jsx";
import ReminderSystem from "./components/ReminderSystem.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MedicationScheduler from "./pages/MedicationScheduler.jsx";
import HealthLog from "./pages/HealthLog.jsx";
import AIChat from "./pages/AIChat.jsx";
import HealthTips from "./pages/HealthTips.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import NotFound from "./pages/NotFound.jsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <div className="flex min-h-screen w-full">
                  <Navigation />
                  <div className="lg:ml-64 flex-1">
                    <Dashboard />
                  </div>
                  <ReminderSystem />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/medications" element={
              <ProtectedRoute>
                <div className="flex min-h-screen w-full">
                  <Navigation />
                  <div className="lg:ml-64 flex-1">
                    <MedicationScheduler />
                  </div>
                  <ReminderSystem />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/health-log" element={
              <ProtectedRoute>
                <div className="flex min-h-screen w-full">
                  <Navigation />
                  <div className="lg:ml-64 flex-1">
                    <HealthLog />
                  </div>
                  <ReminderSystem />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/ai-chat" element={
              <ProtectedRoute>
                <div className="flex min-h-screen w-full">
                  <Navigation />
                  <div className="lg:ml-64 flex-1">
                    <AIChat />
                  </div>
                  <ReminderSystem />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/health-tips" element={
              <ProtectedRoute>
                <div className="flex min-h-screen w-full">
                  <Navigation />
                  <div className="lg:ml-64 flex-1">
                    <HealthTips />
                  </div>
                  <ReminderSystem />
                </div>
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App; 