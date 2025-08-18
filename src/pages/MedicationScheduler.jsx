import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast.js";
import { 
  Plus,
  Pill,
  Clock,
  Calendar,
  Edit,
  Trash2,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' }
];

const MedicationScheduler = () => {
  const [medications, setMedications] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "once",
    times: [""],
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    days: [],
    instructions: "",
    reminders: true,
    tabletColor: "",
    tabletSize: "",
    tabletAppearance: ""
  });

  // API URL with fallback
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // If no token, use localStorage data only
        const storedMedications = JSON.parse(localStorage.getItem('medications') || '[]');
        setMedications(storedMedications);
        return;
      }

      // Load from backend using new medication form API
      const response = await fetch(`${API_URL}/medication-form`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedications(data.medications || []);
        // Also update localStorage for offline access
        localStorage.setItem('medications', JSON.stringify(data.medications || []));
      } else {
        // Fallback to localStorage if backend fails
        const storedMedications = JSON.parse(localStorage.getItem('medications') || '[]');
        setMedications(storedMedications);
        console.warn('Backend unavailable, using local storage');
      }
    } catch (error) {
      console.error('Error loading medications:', error);
      // Fallback to localStorage
      const storedMedications = JSON.parse(localStorage.getItem('medications') || '[]');
      setMedications(storedMedications);
    }
  };

  // Save medications to localStorage
  const saveMedications = (meds) => {
    localStorage.setItem('medications', JSON.stringify(meds));
    setMedications(meds);
  };

  // Generate time slots based on frequency
  const generateTimeSlots = (frequency) => {
    switch (frequency) {
      case 'once': return ['09:00'];
      case 'twice': return ['09:00', '21:00'];
      case 'three': return ['08:00', '14:00', '20:00'];
      case 'four': return ['08:00', '13:00', '18:00', '23:00'];
      default: return ['09:00'];
    }
  };

  const handleFrequencyChange = (frequency) => {
    const newTimes = generateTimeSlots(frequency);
    setFormData({ ...formData, frequency, times: newTimes });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.dosage || formData.times.length === 0 || !formData.tabletColor || !formData.tabletSize || !formData.tabletAppearance) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including tablet appearance details",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const newMedication = {
        id: editingMed ? editingMed.id : Date.now().toString(),
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        times: formData.times,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days: formData.days,
        instructions: formData.instructions,
        reminders: formData.reminders,
        tabletColor: formData.tabletColor,
        tabletSize: formData.tabletSize,
        tabletAppearance: formData.tabletAppearance
      };

      const token = localStorage.getItem('token');
      
      // Try to save to backend if token exists
      if (token) {
        try {
          if (editingMed) {
            // Update existing medication
            const response = await fetch(`${API_URL}/medication-form/${editingMed._id || editingMed.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(newMedication)
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || 'Failed to update medication');
            }
          } else {
            // Create new medication
            const response = await fetch(`${API_URL}/medication-form`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(newMedication)
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || 'Failed to create medication');
            }

            const result = await response.json();
            if (result.medication && result.medication._id) {
              newMedication._id = result.medication._id; // Use backend-generated ID
            }
          }
        } catch (backendError) {
          console.error('Backend error:', backendError);
          // Continue with local storage if backend fails
          toast({
            title: "Warning",
            description: "Backend unavailable, saving locally only",
            variant: "default"
          });
        }
      }

      // Always update local storage
      const updatedMedications = editingMed
        ? medications.map(med => (med._id || med.id) === (editingMed._id || editingMed.id) ? newMedication : med)
        : [...medications, newMedication];
      
      saveMedications(updatedMedications);

      // Automatic SMS reminders are handled by the backend notification scheduler
      // No need to manually schedule here as it's done automatically when medication is created

      toast({
        title: editingMed ? "Medication Updated" : "Medication Added",
        description: `${newMedication.name} has been ${editingMed ? 'updated' : 'added'} to your schedule.`,
      });

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving medication:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save medication",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      frequency: "once",
      times: [""],
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      days: [],
      instructions: "",
      reminders: true,
      tabletColor: "",
      tabletSize: "",
      tabletAppearance: ""
    });
    setEditingMed(null);
  };

  const handleEdit = (medication) => {
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      times: medication.times,
      startDate: medication.startDate,
      endDate: medication.endDate,
      days: medication.days,
      instructions: medication.instructions,
      reminders: medication.reminders,
      tabletColor: medication.tabletColor || "",
      tabletSize: medication.tabletSize || "",
      tabletAppearance: medication.tabletAppearance || ""
    });
    setEditingMed(medication);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      // Try to remove from backend if token exists
      if (token) {
        try {
          const response = await fetch(`${API_URL}/medication-form/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete medication from server');
          }
        } catch (backendError) {
          console.error('Backend delete error:', backendError);
          // Continue with local deletion if backend fails
        }
      }

      // Remove from local state and localStorage
      const newMedications = medications.filter(med => (med._id || med.id) !== id);
      saveMedications(newMedications);
      
      // Automatic SMS reminders are handled by the backend notification scheduler
      // No need to manually remove here as it's done automatically when medication is deleted
      
      toast({
        title: "Medication Removed",
        description: "Medication has been removed from your schedule.",
      });
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete medication",
        variant: "destructive"
      });
    }
  };

  const toggleDay = (day) => {
    const newDays = formData.days.includes(day)
      ? formData.days.filter(d => d !== day)
      : [...formData.days, day];
    setFormData({ ...formData, days: newDays });
  };



  const handleRefresh = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Not Authenticated",
          description: "Please log in to sync with server",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`${API_URL}/medication-form`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedications(data.medications || []);
        localStorage.setItem('medications', JSON.stringify(data.medications || []));
        toast({
          title: "Sync Complete",
          description: "Medications synced with server",
        });
      } else {
        throw new Error('Failed to fetch medications');
      }
    } catch (error) {
      console.error('Error refreshing medications:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync with server",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medication Scheduler</h1>
            <p className="text-gray-600">Manage your daily medication routine</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Sync</span>
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={resetForm}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingMed ? "Edit Medication" : "Add New Medication"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Medication Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Vitamin D, Aspirin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dosage">Dosage *</Label>
                      <Input
                        id="dosage"
                        value={formData.dosage}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                        placeholder="e.g., 500mg, 1 tablet"
                      />
                    </div>
                  </div>

                  {/* Frequency and Times */}
                  <div>
                    <Label>Frequency *</Label>
                    <Select value={formData.frequency} onValueChange={handleFrequencyChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Once daily</SelectItem>
                        <SelectItem value="twice">Twice daily</SelectItem>
                        <SelectItem value="three">Three times daily</SelectItem>
                        <SelectItem value="four">Four times daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Times */}
                  <div>
                    <Label>Times *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {formData.times.map((time, index) => (
                        <Input
                          key={index}
                          type="time"
                          value={time}
                          onChange={(e) => {
                            const newTimes = [...formData.times];
                            newTimes[index] = e.target.value;
                            setFormData({ ...formData, times: newTimes });
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date (Optional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Days of Week */}
                  <div>
                    <Label>Days of Week (Leave empty for daily)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <Button
                          key={day.id}
                          variant={formData.days.includes(day.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleDay(day.id)}
                          className={formData.days.includes(day.id) ? "bg-blue-600 text-white" : ""}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <Label htmlFor="instructions">Instructions (Optional)</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="e.g., Take with food, Before bedtime..."
                    />
                  </div>

                  {/* Physical Appearance Fields */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Physical Appearance of Tablet</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="tabletColor">Color of Tablet *</Label>
                        <Input
                          id="tabletColor"
                          value={formData.tabletColor}
                          onChange={(e) => setFormData({ ...formData, tabletColor: e.target.value })}
                          placeholder="e.g., White, Blue, Pink"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tabletSize">Size of Tablet *</Label>
                        <Input
                          id="tabletSize"
                          value={formData.tabletSize}
                          onChange={(e) => setFormData({ ...formData, tabletSize: e.target.value })}
                          placeholder="e.g., Small, Medium, Large"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tabletAppearance">Physical Appearance *</Label>
                        <Input
                          id="tabletAppearance"
                          value={formData.tabletAppearance}
                          onChange={(e) => setFormData({ ...formData, tabletAppearance: e.target.value })}
                          placeholder="e.g., Round, Oval, Square"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reminders */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="reminders"
                      checked={formData.reminders}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, reminders: checked })
                      }
                    />
                    <Label htmlFor="reminders">Enable reminders</Label>
                  </div>

                  <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    {isLoading ? "Saving..." : (editingMed ? "Update Medication" : "Add Medication")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Medications List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {medications.map((medication) => (
            <Card key={medication._id || medication.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Pill className="h-5 w-5 text-blue-600" />
                    <span>{medication.name}</span>
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(medication)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(medication._id || medication.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{medication.dosage}</Badge>
                  <Badge variant="outline">{medication.frequency} daily</Badge>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{medication.times.join(", ")}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {medication.startDate} {medication.endDate && `- ${medication.endDate}`}
                  </span>
                </div>

                {medication.days.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {medication.days.map((day) => (
                      <Badge key={day} variant="outline" className="text-xs">
                        {DAYS_OF_WEEK.find(d => d.id === day)?.label}
                      </Badge>
                    ))}
                  </div>
                )}

                {medication.instructions && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {medication.instructions}
                  </p>
                )}

                {/* Physical Appearance Information */}
                {(medication.tabletColor || medication.tabletSize || medication.tabletAppearance) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Physical Appearance:</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {medication.tabletColor && (
                        <div className="bg-blue-50 p-2 rounded">
                          <span className="font-medium text-blue-700">Color:</span>
                          <span className="text-blue-600 ml-1">{medication.tabletColor}</span>
                        </div>
                      )}
                      {medication.tabletSize && (
                        <div className="bg-green-50 p-2 rounded">
                          <span className="font-medium text-green-700">Size:</span>
                          <span className="text-green-600 ml-1">{medication.tabletSize}</span>
                        </div>
                      )}
                      {medication.tabletAppearance && (
                        <div className="bg-purple-50 p-2 rounded">
                          <span className="font-medium text-purple-700">Shape:</span>
                          <span className="text-purple-600 ml-1">{medication.tabletAppearance}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {medication.reminders ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Bell className="h-4 w-4" />
                      <span className="text-xs">Reminders enabled</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-500">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">No reminders</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {medications.length === 0 && (
          <Card className="border-0 shadow-lg text-center py-12 bg-white">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Pill className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No medications scheduled</h3>
                  <p className="text-gray-600">Add your first medication to get started</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white" onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Medication
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MedicationScheduler; 