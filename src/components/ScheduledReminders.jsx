import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, Calendar } from "lucide-react";
import { format } from 'date-fns';

/**
 * Component to display scheduled SMS reminders for medications
 */
const ScheduledReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScheduledReminders = async () => {
      try {
        setLoading(true);
        // Get the JWT token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('You must be logged in to view reminders');
          setLoading(false);
          return;
        }

        // Fetch scheduled jobs from the API
        const response = await axios.get('/api/sms/scheduled-jobs', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Filter only medication reminders
        const medicationReminders = response.data.jobs.filter(job => 
          job.id.startsWith('medication_')
        );

        setReminders(medicationReminders);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching scheduled reminders:', err);
        setError('Failed to load scheduled reminders. Please try again later.');
        setLoading(false);
      }
    };

    fetchScheduledReminders();

    // Refresh reminders every 5 minutes
    const intervalId = setInterval(fetchScheduledReminders, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Parse job ID to extract medication name
  const getMedicationInfo = (jobId) => {
    // Format: medication_userId_medicationId_time
    const parts = jobId.split('_');
    if (parts.length >= 4) {
      // The last part is the time
      const time = parts[parts.length - 1];
      // Everything between medication_userId_ and _time is the medication ID or name
      const medicationPart = parts.slice(3, parts.length - 1).join('_');
      return { time, medicationPart };
    }
    return { time: 'Unknown', medicationPart: 'Unknown' };
  };

  // Format the next run date
  const formatNextRunDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPpp'); // Format: Apr 29, 2023, 9:30 AM
    } catch (err) {
      return dateString || 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (reminders.length === 0) {
    return (
      <Alert className="mt-4">
        <AlertDescription>
          No scheduled medication reminders found. Add medications with reminders enabled to see them here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Bell className="mr-2 h-5 w-5" />
        Scheduled Medication Reminders
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reminders.map((reminder) => {
          const { time, medicationPart } = getMedicationInfo(reminder.id);
          
          return (
            <Card key={reminder.id} className="overflow-hidden">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">
                  {medicationPart}
                </h3>
                
                <div className="flex items-center mb-2 text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Daily at {time}
                  </span>
                </div>
                
                <div className="flex items-center mb-3 text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Next reminder: {formatNextRunDate(reminder.nextDate)}
                  </span>
                </div>
                
                <div>
                  <Badge variant={reminder.running ? "success" : "destructive"}>
                    {reminder.running ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduledReminders;