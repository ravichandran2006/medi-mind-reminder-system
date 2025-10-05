import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast.js";
import { 
  Upload,
  FileText,
  Brain,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Pill,
  Activity,
  TrendingUp,
  Heart,
  AlertCircle,
  Info,
  Shield,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Stethoscope
} from "lucide-react";
import axios from "axios";

const MedicalAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const { toast } = useToast();

  // API URL - Force port 5001 to fix connection issue
  const API_URL = 'http://localhost:5001/api';

  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  const loadAnalysisHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/medical-analysis/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setAnalysisHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or image file (JPG, PNG, BMP, TIFF)",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a medical document to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('medicalDocument', selectedFile);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/medical-analysis/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast({
          title: "Analysis Complete",
          description: "Your medical document has been analyzed successfully",
          variant: "default"
        });

        setSelectedFile(null);
        setSelectedAnalysis(response.data.data.analysis);
        setIsAnalysisOpen(true);
        loadAnalysisHistory();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Analysis Failed",
        description: error.response?.data?.message || "Failed to analyze medical document",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const viewAnalysis = (analysis) => {
    setSelectedAnalysis(analysis.analysisResult);
    setIsAnalysisOpen(true);
  };

  const getVerificationBadgeColor = (status) => {
    switch (status) {
      case 'valid': return 'bg-green-500';
      case 'needs_review': return 'bg-yellow-500';
      case 'concerning': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLabStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'high': return 'text-red-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskLevelProgress = (level) => {
    switch (level) {
      case 'low': return 25;
      case 'moderate': return 60;
      case 'high': return 90;
      default: return 0;
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderRiskVisualization = (riskAssessment) => {
    if (!riskAssessment) return null;

    const risks = [
      { name: 'Overall Risk', level: riskAssessment.overall_risk_level, icon: Heart },
      { name: 'Cardiovascular', level: riskAssessment.cardiovascular_risk, icon: Activity },
      { name: 'Diabetic Risk', level: riskAssessment.diabetic_risk, icon: TrendingUp },
      { name: 'Medication Adherence', level: riskAssessment.medication_adherence_risk, icon: Pill }
    ];

    return (
      <div className="space-y-4">
        <h4 className="font-medium flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          Risk Assessment Visualization
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.map((risk, index) => {
            if (!risk.level || risk.level === 'unknown') return null;
            const Icon = risk.icon;
            const progress = getRiskLevelProgress(risk.level);
            const colorClass = getRiskLevelColor(risk.level);
            
            return (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Icon className={`h-4 w-4 mr-2 ${colorClass}`} />
                    <span className="text-sm font-medium">{risk.name}</span>
                  </div>
                  <Badge className={`capitalize ${colorClass}`}>
                    {risk.level}
                  </Badge>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Risk Level: {progress}%
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDosageRecommendations = (dosageRecs) => {
    if (!dosageRecs) return null;

    return (
      <div className="space-y-4">
        {/* Current Dosage Status */}
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-primary" />
          <span className="font-medium">Dosage Assessment</span>
          {dosageRecs.current_dosages_appropriate ? (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Appropriate
            </Badge>
          ) : (
            <Badge className="bg-yellow-500 text-white">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Needs Review
            </Badge>
          )}
        </div>

        {/* Dosage Adjustments */}
        {dosageRecs.recommended_adjustments && dosageRecs.recommended_adjustments.length > 0 && (
          <div>
            <h5 className="font-medium text-orange-600 mb-2">Recommended Adjustments</h5>
            <div className="space-y-2">
              {dosageRecs.recommended_adjustments.map((adj, index) => (
                <div key={index} className="p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{adj.medication}</p>
                    <Badge 
                      className={`${
                        adj.urgency === 'high' ? 'bg-red-500' : 
                        adj.urgency === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      } text-white`}
                    >
                      {adj.urgency} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Current: {adj.current_dose} → Recommended: {adj.recommended_dose}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Reason: {adj.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Medications */}
        {dosageRecs.new_medications_suggested && dosageRecs.new_medications_suggested.length > 0 && (
          <div>
            <h5 className="font-medium text-blue-600 mb-2">Suggested New Medications</h5>
            <div className="space-y-2">
              {dosageRecs.new_medications_suggested.map((med, index) => (
                <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{med.medication}</p>
                    <Badge 
                      className={`${
                        med.priority === 'high' ? 'bg-red-500' : 
                        med.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      } text-white`}
                    >
                      {med.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Dosage: {med.dosage} - {med.frequency}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Reason: {med.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contraindications */}
        {dosageRecs.contraindications && dosageRecs.contraindications.length > 0 && (
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Contraindications:</strong>
              <ul className="list-disc list-inside mt-1">
                {dosageRecs.contraindications.map((contra, index) => (
                  <li key={index}>{contra}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Monitoring Required */}
        {dosageRecs.monitoring_required && dosageRecs.monitoring_required.length > 0 && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded">
            <h5 className="font-medium text-purple-700 flex items-center mb-2">
              <Stethoscope className="h-4 w-4 mr-2" />
              Monitoring Required
            </h5>
            <ul className="list-disc list-inside text-sm text-purple-700">
              {dosageRecs.monitoring_required.map((monitor, index) => (
                <li key={index}>{monitor}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderDrugInteractions = (interactions) => {
    if (!interactions) return null;

    const hasInteractions = 
      (interactions.major_interactions && interactions.major_interactions.length > 0) ||
      (interactions.moderate_interactions && interactions.moderate_interactions.length > 0) ||
      (interactions.food_interactions && interactions.food_interactions.length > 0) ||
      (interactions.supplement_interactions && interactions.supplement_interactions.length > 0);

    if (!hasInteractions) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-medium flex items-center text-red-600">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Drug Interactions Warning
        </h4>

        {interactions.major_interactions && interactions.major_interactions.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Major Interactions (Critical):</strong>
              <ul className="list-disc list-inside mt-1">
                {interactions.major_interactions.map((interaction, index) => (
                  <li key={index}>{interaction}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {interactions.moderate_interactions && interactions.moderate_interactions.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Moderate Interactions (Caution):</strong>
              <ul className="list-disc list-inside mt-1">
                {interactions.moderate_interactions.map((interaction, index) => (
                  <li key={index}>{interaction}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {interactions.food_interactions && interactions.food_interactions.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h5 className="font-medium text-yellow-700 mb-2">Food Interactions</h5>
            <ul className="list-disc list-inside text-sm text-yellow-700">
              {interactions.food_interactions.map((interaction, index) => (
                <li key={index}>{interaction}</li>
              ))}
            </ul>
          </div>
        )}

        {interactions.supplement_interactions && interactions.supplement_interactions.length > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <h5 className="font-medium text-orange-700 mb-2">Supplement Interactions</h5>
            <ul className="list-disc list-inside text-sm text-orange-700">
              {interactions.supplement_interactions.map((interaction, index) => (
                <li key={index}>{interaction}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-accent p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Medical Document Analysis</h1>
          <p className="text-lg text-muted-foreground">
            Upload your medical reports or prescriptions for AI-powered analysis and verification
          </p>
        </div>

        {/* Upload Section */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-primary" />
              <span>Upload Medical Document</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="medicalFile">Select Medical Report or Prescription</Label>
              <Input
                id="medicalFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Supported formats: PDF, JPG, PNG, BMP, TIFF (max 10MB)
              </p>
            </div>

            {selectedFile && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Selected file: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Brain className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing Document...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5 mr-2" />
                  Analyze Document
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis History */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Analysis History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No medical documents analyzed yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analysisHistory.map((analysis) => (
                  <div 
                    key={analysis._id} 
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{analysis.originalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(analysis.uploadDate).toLocaleDateString()} at{' '}
                          {new Date(analysis.uploadDate).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={`${getVerificationBadgeColor(analysis.analysisResult?.prescription_verification_summary)} text-white`}
                      >
                        {analysis.analysisResult?.prescription_verification_summary || 'processed'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewAnalysis(analysis)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results Dialog */}
        <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-primary" />
                <span>Medical Analysis Results</span>
              </DialogTitle>
            </DialogHeader>

            {selectedAnalysis && (
              <div className="space-y-6">
                
                {/* Overall Verification Status */}
                <Card className="border-0 bg-gradient-accent">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {selectedAnalysis.prescription_verification_summary === 'valid' ? (
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        ) : selectedAnalysis.prescription_verification_summary === 'concerning' ? (
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                        ) : (
                          <AlertCircle className="h-8 w-8 text-yellow-600" />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold">Prescription Verification</h3>
                          <p className="text-muted-foreground capitalize">
                            {selectedAnalysis.prescription_verification_summary?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        className={`${getVerificationBadgeColor(selectedAnalysis.prescription_verification_summary)} text-white`}
                      >
                        {selectedAnalysis.prescription_verification_summary}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Patient Details */}
                {selectedAnalysis.patient_details && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Patient Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedAnalysis.patient_details.name && (
                          <div>
                            <Label className="text-sm font-medium">Name</Label>
                            <p>{selectedAnalysis.patient_details.name}</p>
                          </div>
                        )}
                        {selectedAnalysis.patient_details.age && (
                          <div>
                            <Label className="text-sm font-medium">Age</Label>
                            <p>{selectedAnalysis.patient_details.age}</p>
                          </div>
                        )}
                        {selectedAnalysis.patient_details.gender && (
                          <div>
                            <Label className="text-sm font-medium">Gender</Label>
                            <p>{selectedAnalysis.patient_details.gender}</p>
                          </div>
                        )}
                        {selectedAnalysis.patient_details.weight && (
                          <div>
                            <Label className="text-sm font-medium">Weight</Label>
                            <p>{selectedAnalysis.patient_details.weight}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Conditions Found */}
                {selectedAnalysis.conditions_found && selectedAnalysis.conditions_found.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Heart className="h-5 w-5" />
                        <span>Conditions Found</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.conditions_found.map((condition, index) => (
                          <Badge key={index} variant="outline">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Medications */}
                {selectedAnalysis.medications && selectedAnalysis.medications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Pill className="h-5 w-5" />
                        <span>Prescribed Medications</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedAnalysis.medications.map((med, index) => (
                          <div key={index} className="p-4 rounded-lg border">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-medium">{med.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Dosage: {med.dosage}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Frequency: {med.frequency}
                                </p>
                                {med.duration && (
                                  <p className="text-sm text-muted-foreground">
                                    Duration: {med.duration}
                                  </p>
                                )}
                              </div>
                              <Badge 
                                className={`${getVerificationBadgeColor(med.verification_status)} text-white`}
                              >
                                {med.verification_status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lab Values */}
                {selectedAnalysis.lab_values && selectedAnalysis.lab_values.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5" />
                        <span>Lab Results</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedAnalysis.lab_values.map((lab, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{lab.parameter}</p>
                              <p className="text-sm text-muted-foreground">
                                {lab.reference_range && `Reference: ${lab.reference_range}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${getLabStatusColor(lab.status)}`}>
                                {lab.value} {lab.unit}
                              </p>
                              <Badge 
                                variant={lab.status === 'normal' ? 'default' : 'destructive'}
                              >
                                {lab.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Risk Assessment */}
                {selectedAnalysis.risk_assessment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5" />
                        <span>Risk Assessment</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Overall Risk Level:</span>
                          <Badge className={`${getRiskLevelColor(selectedAnalysis.risk_assessment.overall_risk_level)}`}>
                            {selectedAnalysis.risk_assessment.overall_risk_level}
                          </Badge>
                        </div>
                        
                        {selectedAnalysis.risk_assessment.high_risk_factors && 
                         selectedAnalysis.risk_assessment.high_risk_factors.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-red-600">High Risk Factors</Label>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {selectedAnalysis.risk_assessment.high_risk_factors.map((factor, index) => (
                                <li key={index}>{factor}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {selectedAnalysis.risk_assessment.moderate_risk_factors && 
                         selectedAnalysis.risk_assessment.moderate_risk_factors.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-yellow-600">Moderate Risk Factors</Label>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {selectedAnalysis.risk_assessment.moderate_risk_factors.map((factor, index) => (
                                <li key={index}>{factor}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced Risk Visualization */}
                      {renderRiskVisualization(selectedAnalysis.risk_assessment)}
                    </CardContent>
                  </Card>
                )}

                {/* Dosage Recommendations */}
                {selectedAnalysis.dosage_recommendations && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5" />
                        <span>Dosage Recommendations</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderDosageRecommendations(selectedAnalysis.dosage_recommendations)}
                    </CardContent>
                  </Card>
                )}

                {/* Drug Interactions */}
                {selectedAnalysis.drug_interactions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Drug Interactions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderDrugInteractions(selectedAnalysis.drug_interactions)}
                    </CardContent>
                  </Card>
                )}

                {/* Analysis Confidence Score */}
                {selectedAnalysis.confidence_score && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>Analysis Confidence</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Confidence Score:</span>
                          <Badge className={getConfidenceColor(selectedAnalysis.confidence_score)}>
                            {selectedAnalysis.confidence_score}%
                          </Badge>
                        </div>
                        <Progress value={selectedAnalysis.confidence_score} className="h-3" />
                        <p className="text-sm text-muted-foreground">
                          {selectedAnalysis.confidence_score >= 80 ? 
                            "High confidence analysis based on comprehensive data extraction." :
                            selectedAnalysis.confidence_score >= 60 ?
                            "Moderate confidence - some information may need verification." :
                            "Low confidence - manual review recommended for accuracy."
                          }
                        </p>
                        {selectedAnalysis.extraction_quality && (
                          <div className="text-xs text-muted-foreground mt-2">
                            <p>Text Length: {selectedAnalysis.extraction_quality.text_length} characters</p>
                            <p>OCR Used: {selectedAnalysis.extraction_quality.ocr_used ? 'Yes' : 'No'}</p>
                            <p>Extraction Quality: {selectedAnalysis.extraction_quality.confidence}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {selectedAnalysis.recommendations && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Info className="h-5 w-5" />
                        <span>Recommendations</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      {selectedAnalysis.recommendations.red_flags && 
                       selectedAnalysis.recommendations.red_flags.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Critical Concerns:</strong>
                            <ul className="list-disc list-inside mt-2">
                              {selectedAnalysis.recommendations.red_flags.map((flag, index) => (
                                <li key={index}>{flag}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {selectedAnalysis.recommendations.immediate_actions && 
                       selectedAnalysis.recommendations.immediate_actions.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-red-600">Immediate Actions Required</Label>
                          <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                            {selectedAnalysis.recommendations.immediate_actions.map((action, index) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedAnalysis.recommendations.follow_up_required && 
                       selectedAnalysis.recommendations.follow_up_required.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-blue-600">Follow-up Required</Label>
                          <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                            {selectedAnalysis.recommendations.follow_up_required.map((followup, index) => (
                              <li key={index}>{followup}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedAnalysis.recommendations.lifestyle_changes && 
                       selectedAnalysis.recommendations.lifestyle_changes.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-green-600">Lifestyle Changes</Label>
                          <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                            {selectedAnalysis.recommendations.lifestyle_changes.map((change, index) => (
                              <li key={index}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Overall Assessment */}
                {selectedAnalysis.overall_assessment && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Overall Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{selectedAnalysis.overall_assessment}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Error Display */}
                {selectedAnalysis.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Analysis Error: {selectedAnalysis.error}
                    </AlertDescription>
                  </Alert>
                )}

              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default MedicalAnalysis;