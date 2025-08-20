import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast.js";
import { 
  Plus,
  Activity,
  Heart,
  Scale,
  Thermometer,
  Upload,
  Download,
  Calendar
} from "lucide-react";

const HealthLog = () => {
  const [healthData, setHealthData] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOCRDialogOpen, setIsOCRDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: "",
    heartRate: "",
    systolic: "",
    diastolic: "",
    temperature: "",
    notes: ""
  });

  // Load health data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("healthData");
    if (saved) setHealthData(JSON.parse(saved));
  }, []);

  // Save health data to localStorage
  const saveHealthData = (data) => {
    localStorage.setItem("healthData", JSON.stringify(data));
    setHealthData(data);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      weight: "",
      heartRate: "",
      systolic: "",
      diastolic: "",
      temperature: "",
      notes: ""
    });
  };

  const handleSubmit = () => {
    if (!formData.weight || !formData.heartRate || !formData.systolic || !formData.diastolic) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      date: formData.date,
      weight: parseFloat(formData.weight),
      heartRate: parseInt(formData.heartRate),
      bloodPressure: {
        systolic: parseInt(formData.systolic),
        diastolic: parseInt(formData.diastolic)
      },
      temperature: formData.temperature ? parseFloat(formData.temperature) : 98.6,
      notes: formData.notes
    };

    const updatedData = [...healthData, newEntry].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    saveHealthData(updatedData);
    setIsDialogOpen(false);
    resetForm();

    toast({
      title: "Health Data Logged",
      description: "Your health data has been recorded successfully."
    });
  };

  // OCR Upload Handler
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);

    toast({ title: "Processing Image", description: "Extracting health data..." });

    try {
      const response = await fetch("http://127.0.0.1:5000/test-ocr", {
        method: "POST",
        body: data
      });

      if (!response.ok) {
        const errResult = await response.json();
        throw new Error(errResult.error || "OCR failed");
      }

      const result = await response.json();

      // Clean numeric values from OCR result
      const weight = result.Weight ? result.Weight.replace(/[^\d.]/g, "") : "";
      const heartRate = result.HeartRate ? result.HeartRate.replace(/[^\d]/g, "") : "";
      const temperature = result.BodyTemperature ? result.BodyTemperature.replace(/[^\d.]/g, "") : "";
      const systolic = result.BloodPressure ? result.BloodPressure.split("/")[0].replace(/[^\d]/g, "") : "";
      const diastolic = result.BloodPressure ? result.BloodPressure.split("/")[1].replace(/[^\d]/g, "") : "";
      

      // Update form data
      setFormData(prev => ({
        ...prev,
        weight,
        heartRate,
        systolic,
        diastolic,
        temperature
      }));

      // Close OCR dialog and open the form dialog
      setIsOCRDialogOpen(false);
      setIsDialogOpen(true);

      toast({ title: "OCR Complete", description: "Health data extracted and filled in the form." });
    } catch (err) {
      console.error(err);
      toast({ title: "OCR Failed", description: err.message, variant: "destructive" });
    }
  };

  const getHealthStatus = (type, value) => {
    switch (type) {
      case "heartRate":
        if (value < 60) return { color: "text-blue-600" };
        if (value > 150) return { color: "text-red-600" };
        return { color: "text-green-600" };
      case "systolic":
        if (value < 70) return { color: "text-blue-600" };
        if (value > 140) return { color: "text-red-600" };
        return { color: "text-green-600" };
      default:
        return { color: "text-green-600" };
    }
  };

  const exportData = () => {
    const csvContent = [
      "Date,Weight(kg),Heart Rate(bpm),Blood Pressure,Temperature(°F),Notes",
      ...healthData.map(d =>
        `${d.date},${d.weight},${d.heartRate},${d.bloodPressure.systolic}/${d.bloodPressure.diastolic},${d.temperature},${d.notes}`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "health-log.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Data Exported", description: "CSV file downloaded." });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health Log</h1>
            <p className="text-gray-600">Track your vital signs and health metrics</p>
          </div>

          <div className="flex space-x-3">
            {/* OCR Upload */}
            <Dialog open={isOCRDialogOpen} onOpenChange={setIsOCRDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="hover:bg-gray-100">
                  <Upload className="h-4 w-4 mr-2" /> Upload Prescription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Prescription Image</DialogTitle>
                </DialogHeader>
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer" />
              </DialogContent>
            </Dialog>

            {/* Log Health Data */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  onClick={resetForm}
                >
                  <Plus className="h-4 w-4 mr-2" /> Log Health Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Health Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Label>Date *</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Weight (kg) *</Label>
                      <Input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                    </div>
                    <div>
                      <Label>Heart Rate (bpm) *</Label>
                      <Input type="number" value={formData.heartRate} onChange={e => setFormData({ ...formData, heartRate: e.target.value })} />
                    </div>
                  </div>

                  <Label>Blood Pressure *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" value={formData.systolic} onChange={e => setFormData({ ...formData, systolic: e.target.value })} placeholder="Systolic" />
                    <Input type="number" value={formData.diastolic} onChange={e => setFormData({ ...formData, diastolic: e.target.value })} placeholder="Diastolic" />
                  </div>

                  <Label>Temperature (°F)</Label>
                  <Input type="number" step="0.1" value={formData.temperature} onChange={e => setFormData({ ...formData, temperature: e.target.value })} />

                  <Label>Notes</Label>
                  <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />

                  <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white">
                    Log Health Data
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        {healthData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-lg">
              <CardContent className="p-6 flex items-center space-x-2">
                <Scale className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Weight</p>
                  <p className="text-2xl font-bold">{healthData[0].weight} kg</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6 flex items-center space-x-2">
                <Heart className="h-8 w-8 text-red-600 animate-pulse" />
                <div>
                  <p className="text-sm text-gray-600">Heart Rate</p>
                  <p className="text-2xl font-bold">{healthData[0].heartRate} BPM</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6 flex items-center space-x-2">
                <Activity className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Blood Pressure</p>
                  <p className="text-2xl font-bold">{healthData[0].bloodPressure.systolic}/{healthData[0].bloodPressure.diastolic}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6 flex items-center space-x-2">
                <Thermometer className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-2xl font-bold">{healthData[0].temperature}°F</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export CSV */}
        {healthData.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={exportData} variant="outline" className="hover:bg-gray-100">
              <Download className="h-4 w-4 mr-2" /> Export Data
            </Button>
          </div>
        )}

        {/* Health Data List */}
        <div className="space-y-4">
          {healthData.map((d) => (
            <Card key={d.id} className="shadow-lg hover:shadow-xl transition-all bg-white">
              <CardContent>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>{new Date(d.date).toLocaleDateString()}</span>
                  </div>
                  <Badge variant="outline">Health Log</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Scale className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="font-semibold">{d.weight} kg</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Heart className="h-5 w-5 mx-auto mb-1 text-red-600" />
                    <p className="text-sm text-gray-600">Heart Rate</p>
                    <p className={`font-semibold ${getHealthStatus("heartRate", d.heartRate).color}`}>{d.heartRate} BPM</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Activity className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <p className="text-sm text-gray-600">Blood Pressure</p>
                    <p className={`font-semibold ${getHealthStatus("systolic", d.bloodPressure.systolic).color}`}>
                      {d.bloodPressure.systolic}/{d.bloodPressure.diastolic}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Thermometer className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                    <p className="text-sm text-gray-600">Temperature</p>
                    <p className="font-semibold">{d.temperature}°F</p>
                  </div>
                </div>

                {d.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>Notes:</strong> {d.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {healthData.length === 0 && (
          <Card className="text-center py-12 shadow-lg">
            <CardContent>
              <Activity className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No health data logged yet</h3>
              <p className="text-gray-600">Start tracking your health metrics</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HealthLog;
