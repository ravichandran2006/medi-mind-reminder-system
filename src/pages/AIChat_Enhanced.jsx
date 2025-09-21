import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "../contexts/AuthContext";
import { 
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Bot,
  User,
  Volume2,
  VolumeX,
  Languages,
  Loader2,
  Globe
} from "lucide-react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

// Supported languages - English & Tamil focus
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', voiceCode: 'en-US', flag: '🇺🇸' },
  { code: 'ta', name: 'Tamil', voiceCode: 'ta-IN', flag: '🇮🇳' }
];

// Enhanced quick prompts for medical assistance
const QUICK_PROMPTS = {
  en: {
    medication: "How should I take my medications?",
    vitals: "What are normal vital signs?",
    health: "How can I improve my health?",
    emergency: "What should I do in a medical emergency?",
    sideEffects: "What are common medication side effects?",
    dosage: "How do I manage my medication dosage?"
  },
  ta: {
    medication: "நான் என் மருந்துகளை எப்படி எடுக்க வேண்டும்?",
    vitals: "சாதாரண முக்கிய அறிகுறிகள் என்ன?",
    health: "என் ஆரோக்கியத்தை எப்படி மேம்படுத்த முடியும்?",
    emergency: "மருத்துவ அவசரநிலையில் நான் என்ன செய்ய வேண்டும்?",
    sideEffects: "பொதுவான மருந்து பக்க விளைவுகள் என்ன?",
    dosage: "என் மருந்து அளவை எப்படி நிர்வகிக்க வேண்டும்?"
  }
};

const AIChat = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hello! I'm your AI health assistant. I can help you with medication questions, health tips, and general medical information. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date(),
      language: 'en'
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const scrollAreaRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const { toast } = useToast();

  // Initialize speech synthesis voices
  useEffect(() => {
    if (speechEnabled && 'speechSynthesis' in window) {
      speechSynthesis.getVoices();
    }
  }, [speechEnabled]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = getVoiceCode(language);

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: event.error === 'not-allowed' 
            ? "Microphone access was denied. Please allow microphone access in your browser settings."
            : "Failed to recognize speech",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language, toast]);

  // Update welcome message when language changes
  useEffect(() => {
    const welcomeMessage = language === 'ta' 
      ? "வணக்கம்! நான் உங்கள் AI ஆரோக்கிய உதவியாளர். மருந்து கேள்விகள், ஆரோக்கிய குறிப்புகள் மற்றும் பொதுவான மருத்துவ தகவல்களில் உங்களுக்கு உதவ முடியும். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?"
      : "Hello! I'm your AI health assistant. I can help you with medication questions, health tips, and general medical information. How can I assist you today?";
    
    setMessages(prev => [
      {
        id: "1",
        text: welcomeMessage,
        sender: 'ai',
        timestamp: new Date(),
        language: language
      },
      ...prev.slice(1)
    ]);
  }, [language]);

  // Get voice code for current language
  const getVoiceCode = (langCode) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    return lang ? lang.voiceCode : 'en-US';
  };

  // Get language name for display
  const getLanguageName = (code) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? lang.name : 'Unknown';
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please login to use the chat",
        variant: "destructive"
      });
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      language
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/chat', {
        message: inputMessage,
        language
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        sender: 'ai',
        timestamp: new Date(),
        language: response.data.language || language
      };

      setMessages(prev => [...prev, aiResponse]);

      // Speak the response if speech is enabled
      if (speechEnabled) {
        speakResponse(aiResponse.text, aiResponse.language);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive"
        });
        logout();
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to get AI response",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced speech synthesis with better voice selection
  const speakResponse = (text, langCode) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    
    // Find the best voice for the language
    let selectedVoice = null;
    if (langCode === 'ta') {
      selectedVoice = voices.find(voice => 
        voice.lang.includes('ta') || voice.name.includes('Tamil')
      );
    } else {
      selectedVoice = voices.find(voice => 
        voice.lang.includes('en-US') || voice.lang.includes('en-GB')
      );
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.lang = getVoiceCode(langCode);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    setIsSpeaking(true);
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      toast({
        title: "Voice output error",
        description: "Failed to speak the response",
        variant: "destructive"
      });
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start/stop browser speech recognition
  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.lang = getVoiceCode(language);
      setIsListening(true);
      recognitionRef.current.start();
    } else if (!recognitionRef.current) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support speech recognition. Try using Chrome or Edge.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  // Handle key press in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick action handlers
  const handleQuickAction = (type) => {
    const prompt = QUICK_PROMPTS[language]?.[type] || QUICK_PROMPTS.en[type];
    if (prompt) {
      setInputMessage(prompt);
    }
  };

  // Stop all voice activities when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-accent p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="h-[calc(100vh-8rem)] border-0 shadow-card flex flex-col">
          <CardHeader className="border-b bg-gradient-primary text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-6 w-6" />
                <span>MediMate AI Assistant</span>
              </CardTitle>
              <div className="flex items-center space-x-3">
                {/* Enhanced Language Selector */}
                <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-1">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={language === lang.code ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setLanguage(lang.code)}
                      className={`text-xs font-medium transition-all duration-200 ${
                        language === lang.code
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      <span className="mr-1">{lang.flag}</span>
                      {lang.name}
                    </Button>
                  ))}
                </div>
                
                {/* Voice Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSpeechEnabled(!speechEnabled)}
                  className={`text-white hover:bg-white/20 ${
                    isSpeaking ? 'animate-pulse' : ''
                  }`}
                >
                  {speechEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Current Language Badge */}
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {getLanguageName(language)}
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
                          <div className={`flex items-center justify-between mt-2 text-xs ${
                            message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                          }`}>
                            <span>{message.timestamp.toLocaleTimeString()}</span>
                            {message.language && message.language !== 'en' && (
                              <span className="ml-2 italic">
                                {getLanguageName(message.language)}
                              </span>
                            )}
                          </div>
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
                    placeholder={
                      language === 'ta' ? "ஆரோக்கியம், மருந்துகள் அல்லது நல்வாழ்வைப் பற்றி கேளுங்கள்..." :
                      "Ask me anything about health, medications, or wellness..."
                    }
                    className="pr-12"
                    disabled={isLoading || isProcessingAudio}
                  />
                  {(isListening || isProcessingAudio) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                
                {/* Voice Input Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSpeechRecognition}
                  className={isListening ? "bg-destructive text-white" : ""}
                  disabled={isProcessingAudio}
                >
                  {isProcessingAudio ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading || isProcessingAudio}
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {language === 'ta' ? "அனுப்ப Enter அழுத்தவும், குரல் உள்ளீட்டிற்கு மைக்கைக் கிளிக் செய்க" :
                   "Press Enter to send, click mic for voice input"}
                </p>
                <Badge variant="outline" className="text-xs">
                  {isProcessingAudio ? 
                    (language === 'ta' ? "செயலாக்கம்..." : "Processing...") : 
                    isListening ? 
                    (language === 'ta' ? "கேட்டுக்கொண்டிருக்கிறது..." : "Listening...") : 
                    (language === 'ta' ? "தயார்" : "Ready")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Quick Actions */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="p-4 h-auto text-left hover:bg-accent"
            onClick={() => handleQuickAction('medication')}
          >
            <div>
              <p className="font-medium">
                {language === 'ta' ? "மருந்து உதவி" : "Medication Help"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'ta' ? "மருந்துகளை எடுப்பது பற்றி வழிகாட்டலைப் பெறவும்" : 
                 "Get guidance on taking medications"}
              </p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto text-left hover:bg-accent"
            onClick={() => handleQuickAction('emergency')}
          >
            <div>
              <p className="font-medium">
                {language === 'ta' ? "அவசர உதவி" : "Emergency Help"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'ta' ? "மருத்துவ அவசரநிலைகளுக்கான வழிகாட்டுதல்" : 
                 "Guidance for medical emergencies"}
              </p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto text-left hover:bg-accent"
            onClick={() => handleQuickAction('health')}
          >
            <div>
              <p className="font-medium">
                {language === 'ta' ? "ஆரோக்கிய உதவிக்குறிப்புகள்" : "Health Tips"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'ta' ? "தனிப்பட்ட ஆலோசனையைப் பெறுங்கள்" : 
                 "Get personalized advice"}
              </p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
