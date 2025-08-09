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
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Pill,
  Clock,
  Calendar,
  Edit,
  Trash2,
  Bell,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate: string;
  days: string[];
  instructions: string;
  reminders: boolean;
}

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
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "once",
    times: [""],
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    days: [] as string[],
    instructions: "",
    reminders: true
  });

  // Load medications from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('medications');
    if (saved) {
      setMedications(JSON.parse(saved));
    }
  }, []);

  // Save medications to localStorage
  const saveMedications = (meds: Medication[]) => {
    localStorage.setItem('medications', JSON.stringify(meds));
    setMedications(meds);
  };

  // Generate time slots based on frequency
  const generateTimeSlots = (frequency: string) => {
    switch (frequency) {
      case 'once': return ['09:00'];
      case 'twice': return ['09:00', '21:00'];
      case 'three': return ['08:00', '14:00', '20:00'];
      case 'four': return ['08:00', '13:00', '18:00', '23:00'];
      default: return [''];
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    const newTimes = generateTimeSlots(frequency);
    setFormData({ ...formData, frequency, times: newTimes });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.dosage || formData.times.some(t => !t)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const medication: Medication = {
      id: editingMed ? editingMed.id : Date.now().toString(),
      ...formData
    };

    let newMedications;
    if (editingMed) {
      newMedications = medications.map(med => 
        med.id === editingMed.id ? medication : med
      );
      toast({
        title: "Medication Updated",
        description: `${medication.name} has been updated successfully.`,
      });
    } else {
      newMedications = [...medications, medication];
      toast({
        title: "Medication Added",
        description: `${medication.name} has been added to your schedule.`,
      });
    }

    saveMedications(newMedications);
    setIsDialogOpen(false);
    resetForm();
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
      reminders: true
    });
    setEditingMed(null);
  };

  const handleEdit = (medication: Medication) => {
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      times: medication.times,
      startDate: medication.startDate,
      endDate: medication.endDate,
      days: medication.days,
      instructions: medication.instructions,
      reminders: medication.reminders
    });
    setEditingMed(medication);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const newMedications = medications.filter(med => med.id !== id);
    saveMedications(newMedications);
    toast({
      title: "Medication Removed",
      description: "Medication has been removed from your schedule.",
    });
  };

  const toggleDay = (day: string) => {
    const newDays = formData.days.includes(day)
      ? formData.days.filter(d => d !== day)
      : [...formData.days, day];
    setFormData({ ...formData, days: newDays });
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

                {/* Reminders */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminders"
                    checked={formData.reminders}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, reminders: checked as boolean })
                    }
                  />
                  <Label htmlFor="reminders">Enable reminders</Label>
                </div>

                <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                  {editingMed ? "Update Medication" : "Add Medication"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Medications List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {medications.map((medication) => (
            <Card key={medication.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
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
                      onClick={() => handleDelete(medication.id)}
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