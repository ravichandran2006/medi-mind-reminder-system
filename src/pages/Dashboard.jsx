import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast.js";
import { 
  Calendar,
  Clock,
  Heart,
  Activity,
  Pill,
  TrendingUp,
  Bell,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import medicalHero from "@/assets/medical-hero.jpg";
import ScheduledReminders from "@/components/ScheduledReminders";

import { API_BASE_URL } from '@/utils/api.js';
const API_URL = API_BASE_URL;

// Dynamic Health Tips
const healthTips = [
  "Remember to drink at least 8 glasses of water today! Staying hydrated helps your medications work more effectively and supports overall health.",
  "Take your medications at the same time each day to maintain consistent levels in your bloodstream.",
  "Regular exercise, even a 30-minute walk, can significantly improve your cardiovascular health and overall well-being.",
  "Get 7-9 hours of quality sleep each night. Good sleep is essential for your body's recovery and medication effectiveness.",
  "Eat a balanced diet rich in fruits, vegetables, and whole grains to support your medication therapy.",
  "Always take medications with a full glass of water unless instructed otherwise by your doctor.",
  "Keep a medication log to track when you take your medicines and any side effects you experience.",
  "Store medications in a cool, dry place away from direct sunlight to maintain their effectiveness.",
  "Never skip doses or double up on medications. If you miss a dose, consult your doctor or pharmacist.",
  "Regular health check-ups help monitor how well your medications are working and catch any issues early."
];

const Dashboard = () => {
  const [healthData, setHealthData] = useState([]);
  const [medications, setMedications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTip, setCurrentTip] = useState("");
  const { toast } = useToast();

  // Load data on mount and when refresh is clicked
  useEffect(() => {
    loadAllData();
    // Set a random health tip
    setCurrentTip(healthTips[Math.floor(Math.random() * healthTips.length)]);
  }, []);

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      // Load health data from localStorage
      const savedHealthData = localStorage.getItem("healthData");
      if (savedHealthData) {
        setHealthData(JSON.parse(savedHealthData));
      }

      // Load medications
      await loadMedications();

      // Rotate health tip
      setCurrentTip(healthTips[Math.floor(Math.random() * healthTips.length)]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadMedications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // If no token, use localStorage data only
        const storedMedications = JSON.parse(localStorage.getItem('medications') || '[]');
        setMedications(storedMedications);
        return;
      }

      // Load from backend
      const response = await fetch(`${API_URL}/medication-form`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedications(data.medications || []);
        localStorage.setItem('medications', JSON.stringify(data.medications || []));
      } else {
        // Fallback to localStorage if backend fails
        const storedMedications = JSON.parse(localStorage.getItem('medications') || '[]');
        setMedications(storedMedications);
      }
    } catch (error) {
      console.error('Error loading medications:', error);
      const storedMedications = JSON.parse(localStorage.getItem('medications') || '[]');
      setMedications(storedMedications);
    }
  };

  // Get latest health stats
  const getLatestHealthStats = () => {
    if (healthData.length === 0) {
      return {
        heartRate: null,
        bloodPressure: null,
        weight: null,
        temperature: null
      };
    }

    const latest = healthData[0]; // Already sorted by date (newest first)
    return {
      heartRate: latest.heartRate,
      bloodPressure: `${latest.bloodPressure.systolic}/${latest.bloodPressure.diastolic}`,
      weight: latest.weight,
      temperature: latest.temperature
    };
  };

  // Get today's medications
  const getTodaysMedications = () => {
    const today = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
    const todayStr = today.toISOString().split('T')[0];

    const todaysMeds = [];

    medications.forEach(med => {
      const startDate = new Date(med.startDate);
      const endDate = med.endDate ? new Date(med.endDate) : null;
      const todayDate = new Date(todayStr);

      // Check if medication is active today
      if (todayDate >= startDate && (!endDate || todayDate <= endDate)) {
        // Check if it's scheduled for today (check days array or if it's daily)
        if (!med.days || med.days.length === 0 || med.days.includes(dayOfWeek)) {
          // Get all times for today
          if (med.times && med.times.length > 0) {
            med.times.forEach(time => {
              if (time) {
                const [hours, minutes] = time.split(':');
                const medTime = new Date();
                medTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                const now = new Date();

                todaysMeds.push({
                  name: med.name,
                  time: time,
                  dosage: med.dosage,
                  status: medTime < now ? "taken" : "pending",
                  id: `${med._id || med.id}-${time}`
                });
              }
            });
          }
        }
      }
    });

    // Sort by time
    return todaysMeds.sort((a, b) => {
      const [aHours, aMins] = a.time.split(':').map(Number);
      const [bHours, bMins] = b.time.split(':').map(Number);
      return aHours * 60 + aMins - (bHours * 60 + bMins);
    });
  };

  const healthStats = getLatestHealthStats();
  const todaysMeds = getTodaysMedications();
  const activeMedicationsCount = medications.filter(med => {
    const today = new Date();
    const startDate = new Date(med.startDate);
    const endDate = med.endDate ? new Date(med.endDate) : null;
    return today >= startDate && (!endDate || today <= endDate);
  }).length;

  const handleRefresh = () => {
    loadAllData();
    toast({
      title: "Data Refreshed",
      description: "All data has been updated successfully."
    });
  };

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
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-slide-up">
                Welcome to MediMate
              </h1>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                title="Refresh Data"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
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

      <div className="w-full pl-4 pr-6 py-6 space-y-8 -mt-16 relative z-20">

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-card hover:shadow-medical transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-destructive animate-pulse-medical" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                  <p className="text-2xl font-bold">
                    {healthStats.heartRate ? `${healthStats.heartRate} BPM` : "N/A"}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {healthStats.bloodPressure || "N/A"}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {healthStats.weight ? `${healthStats.weight} kg` : "N/A"}
                  </p>
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
                  <p className="text-2xl font-bold">{activeMedicationsCount}</p>
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
              {todaysMeds.length > 0 ? (
                todaysMeds.map((med) => (
                  <div key={med.id} className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                    <div className="flex items-center space-x-3">
                      <Pill className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-muted-foreground">{med.time} • {med.dosage}</p>
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
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No medications scheduled for today</p>
                </div>
              )}
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
            <CardTitle className="flex items-center justify-between">
              <span>💡 Today's Health Tip</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentTip(healthTips[Math.floor(Math.random() * healthTips.length)])}
                className="text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                New Tip
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{currentTip}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
