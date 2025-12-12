import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast.js";
import { API_BASE_URL } from "@/utils/api.js";
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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";

const HealthLog = () => {
  const [healthData, setHealthData] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOCRDialogOpen, setIsOCRDialogOpen] = useState(false);
  const { toast } = useToast();
  const { API_BASE_URL } = await import('@/utils/api.js');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: "",
    heartRate: "",
    systolic: "",
    diastolic: "",
    temperature: "",
    notes: ""
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

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
    data.append("prescription", file);

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use OCR extraction.",
        variant: "destructive"
      });
      return;
    }

    toast({ title: "Processing Image", description: "Extracting health data..." });

    try {
      const response = await fetch(`${API_URL}/ocr/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      if (!response.ok) {
        let errorMessage = "OCR failed";
        try {
          const errResult = await response.json();
          errorMessage = errResult.error || errResult.details || errorMessage;
        } catch (_) {
          // ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("OCR result:", result);
      if (result.error) {
        throw new Error(result.error);
      }

      // Clean numeric values from OCR result (backend returns lowercase keys)
      const weight = result.weight ? result.weight.toString().replace(/[^\d.]/g, "") : "";
      const heartRate = result.heartRate ? result.heartRate.toString().replace(/[^\d]/g, "") : "";
      const temperature = result.temperature ? result.temperature.toString().replace(/[^\d.]/g, "") : "";
      const systolic = result.systolic ? result.systolic.toString().replace(/[^\d]/g, "") : "";
      const diastolic = result.diastolic ? result.diastolic.toString().replace(/[^\d]/g, "") : "";

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

  const statsByMonth = useMemo(() => {
    const monthMap = new Map();

    healthData.forEach((entry) => {
      const date = new Date(entry.date);
      if (isNaN(date.getTime())) return;
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      const current = monthMap.get(monthKey) || {
        label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
        weight: 0,
        heartRate: 0,
        systolic: 0,
        diastolic: 0,
        temperature: 0,
        count: 0
      };

      current.weight += entry.weight;
      current.heartRate += entry.heartRate;
      current.systolic += entry.bloodPressure.systolic;
      current.diastolic += entry.bloodPressure.diastolic;
      current.temperature += entry.temperature;
      current.count += 1;

      monthMap.set(monthKey, current);
    });

    return Array.from(monthMap.values())
      .map((values) => ({
        label: values.label,
        timestamp: values.timestamp,
        weight: parseFloat((values.weight / values.count).toFixed(1)),
        heartRate: parseFloat((values.heartRate / values.count).toFixed(0)),
        systolic: parseFloat((values.systolic / values.count).toFixed(0)),
        diastolic: parseFloat((values.diastolic / values.count).toFixed(0)),
        temperature: parseFloat((values.temperature / values.count).toFixed(1))
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [healthData]);

  const temperatureDistribution = useMemo(() => {
    const totals = { low: 0, normal: 0, high: 0 };

    healthData.forEach((entry) => {
      if (entry.temperature < 97) {
        totals.low += 1;
      } else if (entry.temperature >= 99) {
        totals.high += 1;
      } else {
        totals.normal += 1;
      }
    });

    const data = [
      { name: "Below 97°F", value: totals.low, color: "#38bdf8" },
      { name: "Normal (97-99°F)", value: totals.normal, color: "#34d399" },
      { name: "Fever (99°F+)", value: totals.high, color: "#fb7185" },
    ];

    return {
      totalPoints: totals.low + totals.normal + totals.high,
      data
    };
  }, [healthData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="w-full pl-6 pr-6 py-6 space-y-8">
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
                  <DialogDescription>
                    Select an image of your prescription or health report to auto-fill metrics.
                  </DialogDescription>
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
                  <DialogDescription>
                    Enter your latest health readings. Fields marked with * are required.
                  </DialogDescription>
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

        {/* Statistical Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle>Average Weight Trend</CardTitle>
              <p className="text-sm text-gray-500">Monthly average (kg)</p>
            </CardHeader>
            <CardContent className="h-64">
              {statsByMonth.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  Log entries to visualize trends
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle>Heart Rate Snapshot</CardTitle>
              <p className="text-sm text-gray-500">Monthly average (bpm)</p>
            </CardHeader>
            <CardContent className="h-64">
              {statsByMonth.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="heartRate" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  Heart rate entries will power this chart
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle>Blood Pressure Overview</CardTitle>
              <p className="text-sm text-gray-500">Average systolic vs diastolic</p>
            </CardHeader>
            <CardContent className="h-64">
              {statsByMonth.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statsByMonth}>
                    <defs>
                      <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="systolic" stroke="#6366f1" fillOpacity={1} fill="url(#colorSys)" />
                    <Area type="monotone" dataKey="diastolic" stroke="#f97316" fillOpacity={1} fill="url(#colorDia)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  Add blood pressure readings to compare
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle>Body Temperature Zones</CardTitle>
              <p className="text-sm text-gray-500">Live distribution (3D pie)</p>
            </CardHeader>
            <CardContent className="h-64">
              {temperatureDistribution.totalPoints ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="pieShadow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={temperatureDistribution.data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="55%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      label
                      stroke="#1f2937"
                      strokeWidth={2}
                      style={{
                        filter: "drop-shadow(0px 12px 12px rgba(15, 23, 42, 0.25))"
                      }}
                    >
                      {temperatureDistribution.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  Add temperature readings to view distribution
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
