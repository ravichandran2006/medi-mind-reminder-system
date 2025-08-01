import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Bot,
  User,
  Volume2,
  VolumeX
} from "lucide-react";

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hello! I'm your AI health assistant. I can help you with medication questions, health tips, and general medical information. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollAreaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Mock AI responses for demo
  const getMockResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('medication') || message.includes('medicine') || message.includes('pill')) {
      return "I can help with medication information! Remember to always take medications as prescribed by your doctor. Never stop or change medications without consulting your healthcare provider. Is there a specific medication you'd like to know about?";
    }
    
    if (message.includes('blood pressure')) {
      return "Normal blood pressure is typically around 120/80 mmHg. High blood pressure (hypertension) is a serious condition that should be monitored regularly. Make sure to take any prescribed blood pressure medications consistently and maintain a healthy lifestyle with regular exercise and a low-sodium diet.";
    }
    
    if (message.includes('heart rate') || message.includes('pulse')) {
      return "A normal resting heart rate for adults is typically 60-100 beats per minute. Athletes may have lower resting heart rates. If you notice unusual changes in your heart rate, consult your healthcare provider.";
    }
    
    if (message.includes('weight') || message.includes('diet')) {
      return "Maintaining a healthy weight is important for overall health. Focus on a balanced diet with fruits, vegetables, lean proteins, and whole grains. Regular physical activity is also key. Consult with a healthcare provider or nutritionist for personalized advice.";
    }
    
    if (message.includes('temperature') || message.includes('fever')) {
      return "Normal body temperature is around 98.6°F (37°C). A fever is generally considered 100.4°F (38°C) or higher. If you have a persistent fever or other concerning symptoms, contact your healthcare provider.";
    }
    
    if (message.includes('reminder') || message.includes('schedule')) {
      return "Setting up medication reminders is crucial for treatment success! You can use the Medication Scheduler in this app to set up automatic reminders. Taking medications at consistent times helps maintain proper levels in your body.";
    }
    
    return "I understand you're asking about health-related topics. While I can provide general information, please remember that I'm not a substitute for professional medical advice. Always consult with your healthcare provider for personalized medical guidance. Is there something specific about medications or health monitoring I can help you with?";
  };

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: getMockResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);

      // Text-to-speech for AI response
      if (speechEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiResponse.text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }
    }, 1000);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-accent p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="h-[calc(100vh-8rem)] border-0 shadow-card flex flex-col">
          <CardHeader className="border-b bg-gradient-primary text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-6 w-6" />
                <span>AI Health Assistant</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSpeechEnabled(!speechEnabled)}
                  className="text-white hover:bg-white/20"
                >
                  {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {speechEnabled ? "Voice On" : "Voice Off"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-gradient-primary text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.sender === 'ai' && (
                          <Bot className="h-5 w-5 mt-0.5 text-primary" />
                        )}
                        {message.sender === 'user' && (
                          <User className="h-5 w-5 mt-0.5 text-white" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <p className={`text-xs mt-2 ${
                            message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-4 rounded-lg max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 bg-accent/30">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about health, medications, or wellness..."
                    className="pr-12"
                    disabled={isLoading}
                  />
                  {isListening && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={isListening ? stopListening : startListening}
                  className={isListening ? "bg-destructive text-white" : ""}
                  disabled={!recognitionRef.current}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  Press Enter to send, click mic for voice input
                </p>
                <Badge variant="outline" className="text-xs">
                  {isListening ? "Listening..." : "Ready"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="p-4 h-auto text-left hover:bg-accent"
            onClick={() => setInputMessage("How should I take my medications?")}
          >
            <div>
              <p className="font-medium">Medication Help</p>
              <p className="text-xs text-muted-foreground">Get guidance on taking medications</p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto text-left hover:bg-accent"
            onClick={() => setInputMessage("What are normal vital signs?")}
          >
            <div>
              <p className="font-medium">Vital Signs</p>
              <p className="text-xs text-muted-foreground">Learn about healthy ranges</p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto text-left hover:bg-accent"
            onClick={() => setInputMessage("How can I improve my health?")}
          >
            <div>
              <p className="font-medium">Health Tips</p>
              <p className="text-xs text-muted-foreground">Get personalized advice</p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat; 