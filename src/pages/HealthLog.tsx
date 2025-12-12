import { useState, useEffect, ChangeEvent, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  Plus,
  Activity,
  Heart,
  Scale,
  Thermometer,
  Upload,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Calendar
} from "lucide-react";

interface HealthData {
  id: string;
  date: string;
  weight: number;
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  temperature: number;
  notes: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

const HealthLog = () => {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
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
    const saved = localStorage.getItem('healthData');
    if (saved) {
      setHealthData(JSON.parse(saved));
    }
  }, []);

  // Save health data to localStorage
  const saveHealthData = (data: HealthData[]) => {
    localStorage.setItem('healthData', JSON.stringify(data));
    setHealthData(data);
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

    const newHealthData: HealthData = {
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

    const updatedData = [...healthData, newHealthData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    saveHealthData(updatedData);
    setIsDialogOpen(false);
    resetForm();

    toast({
      title: "Health Data Logged",
      description: "Your health data has been recorded successfully.",
    });
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

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use OCR extraction.",
        variant: "destructive"
      });
      return;
    }

    const data = new FormData();
    data.append("prescription", file);

    toast({
      title: "Processing Image",
      description: "Extracting health data from prescription..."
    });

    try {
      const response = await fetch(`${API_URL}/ocr/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      if (!response.ok) {
        let message = "OCR failed";
        try {
          const errResult = await response.json();
          message = errResult.error || errResult.details || message;
        } catch {
          // ignore JSON parsing failure
        }
        throw new Error(message);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      const toNumericString = (value: string | number | undefined | null, allowDecimal = false) => {
        if (!value && value !== 0) return "";
        const cleaned = value.toString().replace(allowDecimal ? /[^\d.]/g : /[^\d]/g, "");
        return cleaned;
      };

      setFormData((prev) => ({
        ...prev,
        weight: toNumericString(result.weight, true),
        heartRate: toNumericString(result.heartRate),
        systolic: toNumericString(result.systolic),
        diastolic: toNumericString(result.diastolic),
        temperature: toNumericString(result.temperature, true),
      }));

      setIsOCRDialogOpen(false);
      setIsDialogOpen(true);

      toast({
        title: "OCR Processing Complete",
        description: "Health data extracted from prescription image."
      });
    } catch (error) {
      const err = error as Error;
      console.error("OCR error:", err);
      toast({
        title: "OCR Failed",
        description: err.message || "Unable to extract data from the image.",
        variant: "destructive"
      });
    } finally {
      event.target.value = "";
    }
  };

  const getHealthStatus = (type: string, value: number) => {
    switch (type) {
      case 'heartRate':
        if (value < 60) return { status: 'low', color: 'text-blue-600' };
        if (value > 100) return { status: 'high', color: 'text-red-600' };
        return { status: 'normal', color: 'text-green-600' };
      case 'systolic':
        if (value < 90) return { status: 'low', color: 'text-blue-600' };
        if (value > 140) return { status: 'high', color: 'text-red-600' };
        return { status: 'normal', color: 'text-green-600' };
      case 'weight':
        return { status: 'normal', color: 'text-green-600' };
      default:
        return { status: 'normal', color: 'text-green-600' };
    }
  };

  const exportData = () => {
    const csvContent = [
      "Date,Weight(kg),Heart Rate(bpm),Blood Pressure,Temperature(°F),Notes",
      ...healthData.map(data => 
        `${data.date},${data.weight},${data.heartRate},${data.bloodPressure.systolic}/${data.bloodPressure.diastolic},${data.temperature},${data.notes}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'health-log.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Health log exported as CSV file.",
    });
  };

  const statsByMonth = useMemo(() => {
    const monthMap = new Map<string, {
      label: string;
      timestamp: number;
      weight: number;
      heartRate: number;
      systolic: number;
      diastolic: number;
      temperature: number;
      count: number;
    }>();

    healthData.forEach((entry) => {
      if (!entry.date) return;
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
      if (entry.temperature === undefined || entry.temperature === null) return;
      if (entry.temperature < 97) {
        totals.low += 1;
      } else if (entry.temperature >= 99) {
        totals.high += 1;
      } else {
        totals.normal += 1;
      }
    });

    const totalPoints = totals.low + totals.normal + totals.high;

    return {
      totalPoints,
      data: [
        { name: "Below 97°F", value: totals.low, color: "#38bdf8" },
        { name: "Normal (97-99°F)", value: totals.normal, color: "#34d399" },
        { name: "Fever (99°F+)", value: totals.high, color: "#fb7185" },
      ]
    };
  }, [healthData]);

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
            <Dialog open={isOCRDialogOpen} onOpenChange={setIsOCRDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="hover:bg-gray-100">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Prescription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Prescription Image</DialogTitle>
                  <DialogDescription>
                    Select a prescription or medical report. We will extract vitals automatically.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Upload a prescription or medical report image. Our OCR system will extract health data automatically.
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={resetForm}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Log Health Data
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Health Data</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (kg) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="70.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="heartRate">Heart Rate (bpm) *</Label>
                      <Input
                        id="heartRate"
                        type="number"
                        value={formData.heartRate}
                        onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                        placeholder="72"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Blood Pressure *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        value={formData.systolic}
                        onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                        placeholder="120 (Systolic)"
                      />
                      <Input
                        type="number"
                        value={formData.diastolic}
                        onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                        placeholder="80 (Diastolic)"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="temperature">Temperature (°F)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      placeholder="98.6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white">
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

        {/* Stats Overview */}
        {healthData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Scale className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Latest Weight</p>
                    <p className="text-2xl font-bold">{healthData[0]?.weight} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Heart className="h-8 w-8 text-red-600 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Heart Rate</p>
                    <p className="text-2xl font-bold">{healthData[0]?.heartRate} BPM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Blood Pressure</p>
                    <p className="text-2xl font-bold">
                      {healthData[0]?.bloodPressure.systolic}/{healthData[0]?.bloodPressure.diastolic}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Temperature</p>
                    <p className="text-2xl font-bold">{healthData[0]?.temperature}°F</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export Button */}
        {healthData.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={exportData} variant="outline" className="hover:bg-gray-100">
              <Download className="h-4 w-4 mr-2" />
              Export Data (CSV)
            </Button>
          </div>
        )}

        {/* Health Data List */}
        <div className="space-y-4">
          {healthData.map((data) => (
            <Card key={data.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{new Date(data.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">Health Log</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Scale className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="font-semibold">{data.weight} kg</p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Heart className="h-5 w-5 mx-auto mb-1 text-red-600" />
                    <p className="text-sm text-gray-600">Heart Rate</p>
                    <p className={`font-semibold ${getHealthStatus('heartRate', data.heartRate).color}`}>
                      {data.heartRate} BPM
                    </p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Activity className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <p className="text-sm text-gray-600">Blood Pressure</p>
                    <p className={`font-semibold ${getHealthStatus('systolic', data.bloodPressure.systolic).color}`}>
                      {data.bloodPressure.systolic}/{data.bloodPressure.diastolic}
                    </p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Thermometer className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                    <p className="text-sm text-gray-600">Temperature</p>
                    <p className="font-semibold">{data.temperature}°F</p>
                  </div>
                </div>

                {data.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>Notes:</strong> {data.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {healthData.length === 0 && (
          <Card className="border-0 shadow-lg text-center py-12 bg-white">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No health data logged yet</h3>
                  <p className="text-gray-600">Start tracking your health metrics</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white" onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Log Your First Entry
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

export default HealthLog;