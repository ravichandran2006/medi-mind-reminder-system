import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Lightbulb,
  Heart,
  Droplets,
  Apple,
  Dumbbell,
  Moon,
  Sun,
  Shield,
  Activity,
  Brain,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck
} from "lucide-react";

interface HealthTip {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  icon: any;
  isPersonalized: boolean;
  bookmarked?: boolean;
}

const HealthTips = () => {
  const [tips, setTips] = useState<HealthTip[]>([]);
  const [filteredTips, setFilteredTips] = useState<HealthTip[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bookmarkedTips, setBookmarkedTips] = useState<string[]>([]);

  const categories = [
    { id: "all", label: "All Tips", icon: Lightbulb },
    { id: "medications", label: "Medications", icon: Shield },
    { id: "nutrition", label: "Nutrition", icon: Apple },
    { id: "exercise", label: "Exercise", icon: Dumbbell },
    { id: "sleep", label: "Sleep", icon: Moon },
    { id: "wellness", label: "Wellness", icon: Heart },
    { id: "mental", label: "Mental Health", icon: Brain }
  ];

  const healthTips: HealthTip[] = [
    {
      id: "1",
      title: "Take Medications with Water",
      description: "Always take your medications with a full glass of water unless instructed otherwise. This helps with absorption and prevents stomach irritation.",
      category: "medications",
      priority: "high",
      icon: Shield,
      isPersonalized: true
    },
    {
      id: "2", 
      title: "Stay Hydrated Throughout the Day",
      description: "Drink at least 8 glasses of water daily. Proper hydration helps your medications work effectively and supports overall health.",
      category: "wellness",
      priority: "high",
      icon: Droplets,
      isPersonalized: false
    },
    {
      id: "3",
      title: "Eat a Balanced Breakfast",
      description: "Start your day with a nutritious breakfast including protein, whole grains, and fruits. This provides energy and helps with medication absorption.",
      category: "nutrition",
      priority: "medium",
      icon: Apple,
      isPersonalized: false
    },
    {
      id: "4",
      title: "Set Consistent Medication Times",
      description: "Take your medications at the same time each day to maintain steady levels in your bloodstream and improve effectiveness.",
      category: "medications",
      priority: "high",
      icon: Shield,
      isPersonalized: true
    },
    {
      id: "5",
      title: "Get 7-9 Hours of Sleep",
      description: "Quality sleep is essential for recovery and helps your body process medications properly. Maintain a consistent sleep schedule.",
      category: "sleep",
      priority: "medium",
      icon: Moon,
      isPersonalized: false
    },
    {
      id: "6",
      title: "Exercise Regularly",
      description: "Aim for at least 150 minutes of moderate exercise per week. Regular activity improves heart health and can enhance medication effectiveness.",
      category: "exercise",
      priority: "medium",
      icon: Dumbbell,
      isPersonalized: false
    },
    {
      id: "7",
      title: "Monitor Your Blood Pressure",
      description: "Check your blood pressure regularly if you're on BP medications. Keep a log to share with your healthcare provider.",
      category: "wellness",
      priority: "high",
      icon: Activity,
      isPersonalized: true
    },
    {
      id: "8",
      title: "Practice Stress Management",
      description: "Chronic stress can affect how your body responds to medications. Try meditation, deep breathing, or light exercise to manage stress.",
      category: "mental",
      priority: "medium",
      icon: Brain,
      isPersonalized: false
    },
    {
      id: "9",
      title: "Don't Skip Doses",
      description: "Missing medication doses can reduce effectiveness and may cause symptoms to return. Use reminders to stay on track.",
      category: "medications",
      priority: "high",
      icon: Shield,
      isPersonalized: true
    },
    {
      id: "10",
      title: "Limit Alcohol Consumption",
      description: "Alcohol can interact with many medications and affect their effectiveness. Consult your doctor about safe limits.",
      category: "wellness",
      priority: "high",
      icon: Heart,
      isPersonalized: false
    },
    {
      id: "11",
      title: "Get Morning Sunlight",
      description: "Expose yourself to natural sunlight in the morning to regulate your circadian rhythm and improve sleep quality.",
      category: "sleep",
      priority: "low",
      icon: Sun,
      isPersonalized: false
    },
    {
      id: "12",
      title: "Keep a Health Journal",
      description: "Track your symptoms, medication effects, and daily habits. This information is valuable for your healthcare provider.",
      category: "wellness",
      priority: "medium",
      icon: Heart,
      isPersonalized: false
    }
  ];

  useEffect(() => {
    // Load bookmarked tips from localStorage
    const saved = localStorage.getItem('bookmarkedTips');
    if (saved) {
      setBookmarkedTips(JSON.parse(saved));
    }

    // Set tips with bookmark status
    const tipsWithBookmarks = healthTips.map(tip => ({
      ...tip,
      bookmarked: saved ? JSON.parse(saved).includes(tip.id) : false
    }));
    
    setTips(tipsWithBookmarks);
    setFilteredTips(tipsWithBookmarks);
  }, []);

  useEffect(() => {
    let filtered = tips;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(tip => tip.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(tip =>
        tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tip.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTips(filtered);
  }, [tips, selectedCategory, searchTerm]);

  const toggleBookmark = (tipId: string) => {
    const newBookmarked = bookmarkedTips.includes(tipId)
      ? bookmarkedTips.filter(id => id !== tipId)
      : [...bookmarkedTips, tipId];
    
    setBookmarkedTips(newBookmarked);
    localStorage.setItem('bookmarkedTips', JSON.stringify(newBookmarked));

    // Update tips state
    setTips(prevTips =>
      prevTips.map(tip => ({
        ...tip,
        bookmarked: tip.id === tipId ? !tip.bookmarked : tip.bookmarked
      }))
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-white';
      case 'medium': return 'bg-warning text-white';
      case 'low': return 'bg-muted text-foreground';
      default: return 'bg-muted text-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'High Priority';
      case 'medium': return 'Medium Priority';
      case 'low': return 'General Tip';
      default: return 'General Tip';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-accent p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Health Tips & Wellness</h1>
          <p className="text-muted-foreground">Personalized health recommendations for your well-being</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search health tips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? "bg-primary shadow-glow" : ""}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Personalized Tips Banner */}
        <Card className="border-0 bg-gradient-primary text-white shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Personalized for You</h3>
                <p className="text-white/90">
                  These tips are customized based on your medication schedule and health profile.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTips.map((tip) => {
            const Icon = tip.icon;
            return (
              <Card
                key={tip.id}
                className={`border-0 shadow-card hover:shadow-medical transition-all duration-300 ${
                  tip.isPersonalized ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${
                        tip.isPersonalized ? 'bg-primary/10' : 'bg-accent'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          tip.isPersonalized ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base leading-tight">{tip.title}</CardTitle>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleBookmark(tip.id)}
                      className="shrink-0"
                    >
                      {tip.bookmarked ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tip.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge
                      className={getPriorityColor(tip.priority)}
                      variant="secondary"
                    >
                      {getPriorityLabel(tip.priority)}
                    </Badge>
                    
                    {tip.isPersonalized && (
                      <Badge variant="outline" className="text-primary border-primary">
                        Personalized
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTips.length === 0 && (
          <Card className="border-0 shadow-card text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-accent rounded-full">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No tips found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
                <Button onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}>
                  Show All Tips
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Stats Summary */}
        <Card className="border-0 shadow-card bg-gradient-accent">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>Your Health Journey</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{bookmarkedTips.length}</div>
                <p className="text-sm text-muted-foreground">Bookmarked Tips</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {tips.filter(tip => tip.priority === 'high').length}
                </div>
                <p className="text-sm text-muted-foreground">High Priority Tips</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {tips.filter(tip => tip.isPersonalized).length}
                </div>
                <p className="text-sm text-muted-foreground">Personalized for You</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthTips;