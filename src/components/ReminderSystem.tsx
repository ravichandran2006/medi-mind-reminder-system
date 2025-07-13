import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Pill, CheckCircle2, X, Volume2 } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  days: string[];
  reminders: boolean;
}

interface ReminderNotification {
  id: string;
  medicationName: string;
  dosage: string;
  time: string;
  timestamp: Date;
}

const ReminderSystem = () => {
  const [notifications, setNotifications] = useState<ReminderNotification[]>([]);
  const [activeReminder, setActiveReminder] = useState<ReminderNotification | null>(null);
  const { toast } = useToast();

  // Check for medication reminders
  useEffect(() => {
    const checkReminders = () => {
      const medications = JSON.parse(localStorage.getItem('medications') || '[]') as Medication[];
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      medications.forEach((medication) => {
        if (!medication.reminders) return;

        // Check if medication should be taken today
        const shouldTakeToday = medication.days.length === 0 || 
                               medication.days.some(day => currentDay.includes(day));

        if (shouldTakeToday && medication.times.includes(currentTime)) {
          // Check if we already showed this reminder today
          const reminderKey = `${medication.id}-${currentTime}-${now.toDateString()}`;
          const shownReminders = JSON.parse(localStorage.getItem('shownReminders') || '[]');

          if (!shownReminders.includes(reminderKey)) {
            const reminder: ReminderNotification = {
              id: Date.now().toString(),
              medicationName: medication.name,
              dosage: medication.dosage,
              time: currentTime,
              timestamp: now
            };

            setNotifications(prev => [...prev, reminder]);
            setActiveReminder(reminder);
            
            // Mark as shown
            shownReminders.push(reminderKey);
            localStorage.setItem('shownReminders', JSON.stringify(shownReminders));

            // Request browser notification permission and show notification
            showBrowserNotification(reminder);
            
            // Play sound reminder
            playReminderSound();

            // Show toast
            toast({
              title: "Medication Reminder",
              description: `Time to take ${medication.name} (${medication.dosage})`,
              duration: 10000,
            });
          }
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkReminders, 60000);
    
    // Check immediately
    checkReminders();

    return () => clearInterval(interval);
  }, [toast]);

  const showBrowserNotification = (reminder: ReminderNotification) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('MediMate - Medication Reminder', {
          body: `Time to take ${reminder.medicationName} (${reminder.dosage})`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: reminder.id,
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('MediMate - Medication Reminder', {
              body: `Time to take ${reminder.medicationName} (${reminder.dosage})`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: reminder.id,
            });
          }
        });
      }
    }
  };

  const playReminderSound = () => {
    // Use Web Audio API or Speech Synthesis for audio reminder
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Medication reminder: It\'s time to take your medicine.');
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const markAsTaken = (reminderId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== reminderId));
    setActiveReminder(null);
    
    toast({
      title: "Medication Taken",
      description: "Great job staying on track with your medication!",
      variant: "default",
    });
  };

  const snoozeReminder = (reminderId: string) => {
    setActiveReminder(null);
    
    // Re-show reminder in 5 minutes
    setTimeout(() => {
      const reminder = notifications.find(n => n.id === reminderId);
      if (reminder) {
        setActiveReminder(reminder);
        toast({
          title: "Medication Reminder (Snoozed)",
          description: `Don't forget: ${reminder.medicationName} (${reminder.dosage})`,
          duration: 10000,
        });
      }
    }, 5 * 60 * 1000); // 5 minutes

    toast({
      title: "Reminder Snoozed",
      description: "We'll remind you again in 5 minutes",
    });
  };

  const dismissReminder = (reminderId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== reminderId));
    setActiveReminder(null);
  };

  return (
    <>
      {/* Floating Reminder Bell */}
      {notifications.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setActiveReminder(notifications[0])}
            className="h-14 w-14 rounded-full bg-gradient-primary shadow-glow animate-pulse-medical"
            size="icon"
          >
            <Bell className="h-6 w-6 animate-bounce" />
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-destructive">
              {notifications.length}
            </Badge>
          </Button>
        </div>
      )}

      {/* Active Reminder Modal */}
      <Dialog open={!!activeReminder} onOpenChange={() => setActiveReminder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Pill className="h-6 w-6 text-primary" />
              </div>
              <span>Medication Reminder</span>
            </DialogTitle>
          </DialogHeader>

          {activeReminder && (
            <div className="space-y-6">
              <Card className="border-0 bg-gradient-accent">
                <CardContent className="p-4 text-center">
                  <div className="mb-3">
                    <Bell className="h-12 w-12 mx-auto text-primary animate-bounce" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Time for your medication!</h3>
                  <p className="text-xl font-bold text-primary mb-1">
                    {activeReminder.medicationName}
                  </p>
                  <p className="text-muted-foreground">
                    {activeReminder.dosage} • {activeReminder.time}
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button
                  onClick={() => markAsTaken(activeReminder.id)}
                  className="w-full bg-success hover:bg-success/90 text-white"
                  size="lg"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Mark as Taken
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => snoozeReminder(activeReminder.id)}
                    variant="outline"
                    size="lg"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Snooze 5min
                  </Button>
                  
                  <Button
                    onClick={() => dismissReminder(activeReminder.id)}
                    variant="outline"
                    size="lg"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Dismiss
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playReminderSound}
                  className="text-muted-foreground"
                >
                  <Volume2 className="h-4 w-4 mr-1" />
                  Repeat Audio
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReminderSystem;