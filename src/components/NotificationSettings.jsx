import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast.js";
import SMSService from "../services/smsService";
import { 
  Bell,
  Phone,
  MessageSquare,
  Settings,
  TestTube,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    smsEnabled: true,
    medicationReminders: true,
    healthLogReminders: true,
    appointmentReminders: true,
    phoneNumber: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadScheduledJobs();
  }, []);

  const loadSettings = async () => {
    try {
      // Load user profile to get phone number
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('http://localhost:5000/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSettings(prev => ({
            ...prev,
            phoneNumber: data.user.phone || ""
          }));
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadScheduledJobs = async () => {
    try {
      const response = await SMSService.getScheduledJobs();
      setScheduledJobs(response.jobs || []);
    } catch (error) {
      console.error('Error loading scheduled jobs:', error);
    }
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handlePhoneNumberUpdate = async () => {
    if (!settings.phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }

    if (!SMSService.isValidPhoneNumber(settings.phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await SMSService.updatePhoneNumber(settings.phoneNumber);
      toast({
        title: "Phone Number Updated",
        description: "Your phone number has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update phone number",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhoneNumber || !testMessage) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and message",
        variant: "destructive"
      });
      return;
    }

    if (!SMSService.isValidPhoneNumber(testPhoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    setIsTestLoading(true);
    try {
      await SMSService.testSMS(testPhoneNumber, testMessage);
      toast({
        title: "Test SMS Sent",
        description: "Test SMS has been sent successfully",
      });
      setIsTestDialogOpen(false);
      setTestPhoneNumber("");
      setTestMessage("");
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test SMS",
        variant: "destructive"
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleHealthLogReminder = async () => {
    try {
      await SMSService.sendHealthLogReminder();
      toast({
        title: "Health Log Reminder Sent",
        description: "Health log reminder has been sent to your phone",
      });
    } catch (error) {
      toast({
        title: "Reminder Failed",
        description: error.message || "Failed to send health log reminder",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* SMS Settings */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span>SMS Notification Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <div className="flex space-x-2">
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter your phone number"
                value={settings.phoneNumber}
                onChange={(e) => handleSettingChange('phoneNumber', e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handlePhoneNumberUpdate}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Update"
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              This phone number will receive all SMS notifications
            </p>
          </div>

          {/* Notification Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable SMS Notifications</Label>
                <p className="text-sm text-gray-600">Receive notifications via SMS</p>
              </div>
              <Switch
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => handleSettingChange('smsEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Medication Reminders</Label>
                <p className="text-sm text-gray-600">Get reminded to take medications</p>
              </div>
              <Switch
                checked={settings.medicationReminders}
                onCheckedChange={(checked) => handleSettingChange('medicationReminders', checked)}
                disabled={!settings.smsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Health Log Reminders</Label>
                <p className="text-sm text-gray-600">Daily reminders to log health data</p>
              </div>
              <Switch
                checked={settings.healthLogReminders}
                onCheckedChange={(checked) => handleSettingChange('healthLogReminders', checked)}
                disabled={!settings.smsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-gray-600">Reminders for upcoming appointments</p>
              </div>
              <Switch
                checked={settings.appointmentReminders}
                onCheckedChange={(checked) => handleSettingChange('appointmentReminders', checked)}
                disabled={!settings.smsEnabled}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="hover:bg-gray-100">
                  <TestTube className="h-4 w-4 mr-2" />
                  Test SMS
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Test SMS Notification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="testPhone">Phone Number</Label>
                    <Input
                      id="testPhone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="testMessage">Message</Label>
                    <Input
                      id="testMessage"
                      placeholder="Enter test message"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleTestSMS}
                    disabled={isTestLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isTestLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Test SMS"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={handleHealthLogReminder}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Health Log Reminder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Jobs */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span>Scheduled Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledJobs.length > 0 ? (
            <div className="space-y-2">
              {scheduledJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {job.running ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">{job.id}</span>
                  </div>
                  <Badge variant={job.running ? "default" : "destructive"}>
                    {job.running ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">No scheduled notifications</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preview */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-purple-600" />
            <span>Notification Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
            <h4 className="font-medium text-blue-900">Medication Reminder</h4>
            <p className="text-blue-800 text-sm mt-1">
              "Hi John, this is your Medi-Mind reminder: Take your blood pressure medication at 8:00 AM. Stay healthy!"
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
            <h4 className="font-medium text-green-900">Health Log Reminder</h4>
            <p className="text-green-800 text-sm mt-1">
              "Hi John, this is your Medi-Mind reminder: Don't forget to log your health data today! Track your progress for better health."
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-600">
            <h4 className="font-medium text-orange-900">Appointment Reminder</h4>
            <p className="text-orange-800 text-sm mt-1">
              "Hi John, this is your Medi-Mind reminder: You have an appointment scheduled for tomorrow at 2:00 PM. Don't forget to prepare!"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings; 