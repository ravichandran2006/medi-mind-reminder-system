import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  Heart,
  Activity,
  Pill,
  TrendingUp,
  Bell,
  CheckCircle
} from "lucide-react";
import medicalHero from "@/assets/medical-hero.jpg";
import ScheduledReminders from "@/components/ScheduledReminders";


const Dashboard = () => {
  const [upcomingMeds] = useState([
    { name: "Vitamin D", time: "09:00", status: "pending" },
    { name: "Blood Pressure Med", time: "14:00", status: "pending" },
    { name: "Calcium", time: "20:00", status: "taken" }
  ]);

  const [healthStats] = useState({
    heartRate: 72,
    bloodPressure: "120/80",
    weight: 70.5,
    temperature: 98.6
  });

  return (
    <div className="min-h-screen bg-gradient-accent">
      {/* Hero Section */}
      <div 
        className="relative h-96 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${medicalHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-6">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-slide-up">
              Welcome to MediMate
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 animate-slide-up">
              Your Personal Health & Medicine Companion
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Link to="/medications">
                <Button variant="medical" size="lg" className="w-full sm:w-auto">
                  <Pill className="h-5 w-5 mr-2" />
                  Manage Medications
                </Button>
              </Link>
              <Link to="/health-log">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Heart className="h-5 w-5 mr-2" />
                  Track Health
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 -mt-16 relative z-20">

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-card hover:shadow-medical transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-destructive animate-pulse-medical" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                  <p className="text-2xl font-bold">{healthStats.heartRate} BPM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover:shadow-medical transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Blood Pressure</p>
                  <p className="text-2xl font-bold">{healthStats.bloodPressure}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover:shadow-medical transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Weight</p>
                  <p className="text-2xl font-bold">{healthStats.weight} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover:shadow-medical transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Pill className="h-8 w-8 text-warning animate-float" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Meds</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Medications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Today's Medications</span>
              </CardTitle>
              <CardDescription>Your scheduled medications for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingMeds.map((med, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                  <div className="flex items-center space-x-3">
                    <Pill className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-muted-foreground">{med.time}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={med.status === "taken" ? "default" : "secondary"}
                    className={med.status === "taken" ? "bg-success text-success-foreground" : ""}
                  >
                    {med.status === "taken" ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Bell className="h-3 w-3 mr-1" />
                    )}
                    {med.status === "taken" ? "Taken" : "Pending"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Manage your health routine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/medications">
                <Button variant="medical" className="w-full justify-start" size="lg">
                  <Pill className="h-5 w-5 mr-2" />
                  Add New Medication
                </Button>
              </Link>
              <Link to="/health-log">
                <Button variant="outline" className="w-full justify-start hover:bg-accent" size="lg">
                  <Heart className="h-5 w-5 mr-2" />
                  Log Health Data
                </Button>
              </Link>
              <Link to="/health-log">
                <Button variant="outline" className="w-full justify-start hover:bg-accent" size="lg">
                  <Activity className="h-5 w-5 mr-2" />
                  View Health Charts
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Reminders */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>SMS Medication Reminders</span>
            </CardTitle>
            <CardDescription>Your scheduled medication reminders via SMS</CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduledReminders />
          </CardContent>
        </Card>

        {/* Health Tips */}
        <Card className="border-0 shadow-card bg-gradient-medical text-white">
          <CardHeader>
            <CardTitle>💡 Today's Health Tip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              Remember to drink at least 8 glasses of water today! Staying hydrated helps your medications work more effectively and supports overall health.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;