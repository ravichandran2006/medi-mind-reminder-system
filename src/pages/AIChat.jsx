import React, { useState, useEffect, useRef } from "react";
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
  Loader2
} from "lucide-react";
import axios from "axios";

// Quick prompts for medical assistance
const QUICK_PROMPTS = {
  medication: "How should I take my medications?",
  vitals: "What are normal vital signs?",
  health: "How can I improve my health?",
  emergency: "What should I do in a medical emergency?",
  sideEffects: "What are common medication side effects?",
  dosage: "How do I manage my medication dosage?"
};

const AIChat = () => {
  const { logout } = useAuth();
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const scrollAreaRef = useRef(null);
  const recognitionRef = useRef(null);

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

  // Initialize speech recognition for English
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        alert(event.error === 'not-allowed' 
          ? "Microphone access was denied. Please allow microphone access in your browser settings."
          : "Failed to recognize speech");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login to use the chat");
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      language: 'en'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/chat', {
        message: inputMessage
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
        language: 'en'
      };

      setMessages(prev => [...prev, aiResponse]);

      // Speak the response if speech is enabled
      if (speechEnabled) {
        speakResponse(aiResponse.text);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("Session expired. Please login again");
        logout();
      } else {
        alert(error.response?.data?.message || "Failed to get AI response");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced speech synthesis for English
  const speakResponse = (text) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    
    // Find the best English voice
    const englishVoice = voices.find(voice => 
      voice.lang.includes('en-US') || voice.lang.includes('en-GB') || voice.name.includes('English')
    );

    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.lang = 'en-US';
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
      alert("Failed to speak the response");
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
      setIsListening(true);
      recognitionRef.current.start();
    } else if (!recognitionRef.current) {
      alert("Voice input not supported. Your browser doesn't support speech recognition. Try using Chrome or Edge.");
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
    const prompt = QUICK_PROMPTS[type];
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
                
                {/* Language Badge */}
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  English
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-4" ref={scrollAreaRef}>
                <div className="space-y-4 pr-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex w-full ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] min-w-0 p-4 rounded-lg break-words ${
                          message.sender === 'user'
                            ? 'bg-gradient-primary text-white'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.sender === 'ai' && (
                            <Bot className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                          )}
                          {message.sender === 'user' && (
                            <User className="h-5 w-5 mt-0.5 text-white flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-relaxed break-words">{message.text}</p>
                            <div className={`flex items-center justify-between mt-2 text-xs ${
                              message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                            }`}>
                              <span>{message.timestamp.toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start w-full">
                      <div className="bg-muted p-4 rounded-lg max-w-[75%]">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-5 w-5 text-primary flex-shrink-0" />
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
            </div>

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
                
                {/* Voice Input Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSpeechRecognition}
                  className={isListening ? "bg-destructive text-white" : ""}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Send Button */}
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
            onClick={() => handleQuickAction('medication')}
          >
            <div>
              <p className="font-medium">Medication Help</p>
              <p className="text-xs text-muted-foreground">
                Get guidance on taking medications
              </p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto text-left hover:bg-accent"
            onClick={() => handleQuickAction('emergency')}
          >
            <div>
              <p className="font-medium">Emergency Help</p>
              <p className="text-xs text-muted-foreground">
                Guidance for medical emergencies
              </p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto text-left hover:bg-accent"
            onClick={() => handleQuickAction('health')}
          >
            <div>
              <p className="font-medium">Health Tips</p>
              <p className="text-xs text-muted-foreground">
                Get personalized advice
              </p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
