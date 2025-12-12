import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "../contexts/AuthContext.jsx";
import { 
  Home,
  Pill,
  Activity,
  MessageCircle,
  Lightbulb,
  Menu,
  X,
  Stethoscope,
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Medications", href: "/medications", icon: Pill },
    { name: "Health Log", href: "/health-log", icon: Activity },
    { name: "AI Assistant", href: "/ai-chat", icon: MessageCircle },
    { name: "Health Tips", href: "/health-tips", icon: Lightbulb },
  ];

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    return path !== "/" && location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white shadow-lg"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)} />
      )}

      {/* Navigation Sidebar */}
      <div className={cn(
        "h-screen w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex-shrink-0 overflow-y-auto",
        "lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0 fixed left-0 top-0 z-40" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 h-full">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-8">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MediMate</h1>
              <p className="text-xs text-muted-foreground">Health Companion</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                    "hover:bg-accent group",
                    active 
                      ? "bg-gradient-primary text-white shadow-glow" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-white" : "text-muted-foreground group-hover:text-primary"
                  )} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Card */}
          <Card className="mt-8 p-4 bg-gradient-accent border-0">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="mt-2 w-full text-xs hover:bg-white/20"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Sign Out
              </Button>
            </div>
          </Card>
        </div>
      </div>

    </>
  );
};

export default Navigation; 