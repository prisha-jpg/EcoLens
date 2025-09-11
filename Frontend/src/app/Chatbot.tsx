"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, ArrowRight, X, Mic, MicOff, Volume2, VolumeX, Leaf, Sparkles } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string, isUser: boolean }>>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // const qaPairs = {
  //   "What's my carbon footprint?": "Based on your recent activities, your carbon footprint is 2.1 tons CO₂ this month - 15% lower than average! Keep up the great work with sustainable choices.",
  //   "How can I reduce waste?": "Here are some tips: Use reusable containers, compost organic waste, choose products with minimal packaging, and donate items instead of throwing them away."
  // };
const qaPairs: Record<string, string> = {
  "What's my carbon footprint?": "Based on your recent activities, your carbon footprint is 2.1 tons CO₂ this month - 15% lower than average! Keep up the great work with sustainable choices.",
  "How can I reduce waste?": "Here are some tips: Use reusable containers, compost organic waste, choose products with minimal packaging, and donate items instead of throwing them away."
};

  const keywordResponses: { [key: string]: string } = {
    "carbon.*footprint|emissions": "🌱 Your carbon emissions this month: 2.1 tons CO₂ (15% below average)\n\nTop contributors:\n• Transportation: 45%\n• Energy use: 35%\n• Food choices: 20%\n\nSuggestion: Try cycling or public transport to reduce by 30%!",
    "renewable.*energy|solar|wind": "☀️ Great choice! Renewable energy options available:\n\n• Solar panels: 25% cost reduction this year\n• Wind energy plans: Available in your area\n• Green energy providers: 3 options nearby\n\nEstimated savings: $180/month + 80% emission reduction",
    "recycle|recycling|waste": "♻️ Smart recycling tips:\n\n• Separate plastics by number (1,2,5 accepted locally)\n• Glass & aluminum: 100% recyclable\n• Electronics: Drop-off at tech stores\n• Composting reduces waste by 30%\n\nNearest recycling center: 0.8 miles away",
    "sustainable.*transport|electric.*car|bike": "🚲 Eco-friendly transport options:\n\n• E-bikes: 90% less emissions than cars\n• Public transit: Save $3,200/year\n• Car sharing: Available 5 locations nearby\n• Electric vehicles: $7,500 tax credit available",
    "plant.*based|vegetarian|vegan": "🌿 Plant-based impact calculator:\n\nSwitching 3 meals/week saves:\n• 520 lbs CO₂/year\n• 133,000 gallons water\n• $520 annually\n\nTry: Meatless Mondays for easy start!"
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const speechRecognition = new (window as any).webkitSpeechRecognition();
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'en-US';

      speechRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      speechRecognition.onerror = () => {
        setIsRecording(false);
      };

      speechRecognition.onend = () => {
        setIsRecording(false);
      };

      setRecognition(speechRecognition);
    }
  }, []);

  const startRecording = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (recognition && !isRecording) {
      setIsRecording(true);
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsRecording(false);
      }
    }
  };

  const stopRecording = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const speak = (text: string) => {
    if (!speechEnabled) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clean text for speech (remove emojis and special characters)
    const cleanText = text.replace(/[^\w\s.,!?-]/g, ' ').replace(/\s+/g, ' ').trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    utterance.volume = 0.8;
    
    // Try to find a suitable voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('karen') ||
      voice.name.toLowerCase().includes('susan')
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeech = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSpeechEnabled(!speechEnabled);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSend = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!input.trim() || isRecording) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInput('');

    const response = getCustomResponse(userMessage);

    setTimeout(() => {
      setMessages(prev => [...prev, { text: response, isUser: false }]);
      if (speechEnabled) {
        speak(response);
      }
    }, 500);
  };

  const getCustomResponse = (userMessage: string): string => {
    if (qaPairs[userMessage]) return qaPairs[userMessage];

    for (const pattern in keywordResponses) {
      const regex = new RegExp(pattern, "i");
      if (regex.test(userMessage)) {
        return keywordResponses[pattern];
      }
    }

    return "I'd love to help you with sustainability questions! Ask me about carbon footprint, renewable energy, recycling, or sustainable living tips.";
  };

  const handleQuestionClick = (question: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setMessages(prev => [...prev, { text: question, isUser: true }]);
    setTimeout(() => {
      const response = qaPairs[question as keyof typeof qaPairs];
      setMessages(prev => [...prev, { text: response, isUser: false }]);
      if (speechEnabled) {
        speak(response);
      }
    }, 500);
  };

  const toggleChatbot = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const closeChatbot = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={toggleChatbot}
        className={`group relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300/50 ${
          isOpen
            ? 'bg-transparent border border-transparent'
            : 'bg-gradient-to-tr from-green-400 via-green-500 to-emerald-600 hover:from-green-500 hover:via-emerald-500 hover:to-green-600 shadow-green-300'
        }`}
        style={{ 
          boxShadow: isOpen 
            ? '0 20px 50px rgba(34, 197, 94, 0.3), 0 0 0 1px rgba(34, 197, 94, 0.1)' 
            : '0 20px 50px rgba(34, 197, 94, 0.4), 0 8px 32px rgba(16, 185, 129, 0.3)',
          zIndex: 1000
        }}
        aria-label="EcoAssistant"
      >
        {/* Animated background effect */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-300/20 to-emerald-400/20 animate-ping pointer-events-none"></div>
        )}
        
        <Leaf className="w-8 h-8 text-white transform group-hover:rotate-12 transition-transform duration-300" />
        
        {/* Sparkle effects */}
        {!isOpen && (
          <>
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-green-300 animate-pulse pointer-events-none" />
            <Sparkles className="absolute -bottom-1 -left-1 w-3 h-3 text-emerald-300 animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="absolute bottom-1 right-0 w-[380px] h-[520px] bg-gradient-to-br from-green-50/95 via-white/95 to-emerald-50/95 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col border-2 border-green-200/60 overflow-hidden z-100"
          style={{ 
            boxShadow: '0 25px 80px rgba(34, 197, 94, 0.25), 0 0 0 1px rgba(34, 197, 94, 0.1)',
            zIndex: 999
          }}
        >
          {/* Magical Header */}
          <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white p-4">
            {/* Animated background patterns */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-green-400/20 rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-400/20 rounded-full translate-x-12 translate-y-12"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
            </div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
              <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-6 left-16 w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Controls - Fixed positioning and z-index */}
            <div className="absolute top-3 right-3 flex gap-2" style={{ zIndex: 50 }}>
              <button
                type="button"
                onClick={toggleSpeech}
                className="relative text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                title={speechEnabled ? "Disable voice" : "Enable voice"}
                aria-label={speechEnabled ? "Disable voice" : "Enable voice"}
                style={{ zIndex: 51 }}
              >
                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={closeChatbot}
                className="relative text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label="Close chatbot"
                style={{ zIndex: 51 }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative" style={{ zIndex: 20 }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm -z-10 pointer-events-none"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg tracking-wide">EcoAssistant</h3>
                </div>
              </div>
              
              {isSpeaking && (
                <div className="flex items-center gap-3 mt-3 bg-white/10 rounded-xl p-2 backdrop-blur-sm">
                  <div className="flex gap-1">
                    <div className="w-1 h-3 bg-white/70 rounded-full animate-bounce"></div>
                    <div className="w-1 h-4 bg-white/90 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  <span className="text-xs text-white/90 font-medium">Speaking...</span>
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-transparent to-green-50/30">
            {messages.length === 0 ? (
              <div className="text-center mt-16">
                <div className="relative mx-auto mb-6 w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center shadow-lg">
                    <Leaf className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-green-300/40 to-emerald-400/40 rounded-3xl animate-ping pointer-events-none"></div>
                  <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-green-400 animate-pulse pointer-events-none" />
                </div>
                {/* <h4 className="text-xl font-bold text-green-700 mb-2">Let's Save the Planet! 🌍</h4> */}
                <p className="text-sm text-green-600 leading-relaxed px-4">Ask me anything about sustainability, green living, or eco-friendly tips!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`relative max-w-[85%] p-4 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                        msg.isUser
                          ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 text-white rounded-br-md border border-green-400/20'
                          : 'bg-white/90 border-2 border-green-200/50 text-gray-800 rounded-bl-md backdrop-blur-sm'
                      }`}
                    >
                      <p className={`text-sm leading-relaxed ${msg.isUser ? 'text-white' : 'text-gray-800'} whitespace-pre-line`}>
                        {msg.text}
                      </p>
                      {/* Message glow effect */}
                      {msg.isUser && (
                        <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-2xl blur-sm -z-10 pointer-events-none"></div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Enhanced Input Area */}
          <div className="p-4 bg-gradient-to-r from-green-50/80 via-white/80 to-emerald-50/80 backdrop-blur-sm border-t-2 border-green-200/30">
            <div className="relative">
              <div 
                className="flex items-center bg-white/90 rounded-2xl border-2 border-green-300/40 focus-within:border-green-500 focus-within:shadow-lg focus-within:shadow-green-200/50 transition-all duration-300 backdrop-blur-sm overflow-hidden"
                style={{
                  boxShadow: 'inset 0 2px 4px rgba(34, 197, 94, 0.1)'
                }}
              >
                <input
                  type="text"
                  placeholder={isRecording ? "🎤 Listening..." : "Ask me anything green..."}
                  className="flex-1 px-4 py-3 text-gray-700 bg-transparent text-sm focus:outline-none placeholder-green-500/70 font-medium"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isRecording}
                />
                
                {/* Voice Button */}
                {recognition && (
                  <button
                    type="button"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`relative p-3 rounded-full transition-all duration-300 mx-1 focus:outline-none focus:ring-2 focus:ring-green-300 ${
                      isRecording 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-200 animate-pulse scale-110' 
                        : 'text-green-600 hover:text-green-700 hover:bg-green-100 hover:scale-105'
                    }`}
                    title={isRecording ? "Release to stop" : "Hold to record voice"}
                    aria-label={isRecording ? "Recording voice input" : "Start voice input"}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    
                    {/* Recording pulse effect */}
                    {isRecording && (
                      <div className="absolute inset-0 bg-red-400/40 rounded-full animate-ping pointer-events-none"></div>
                    )}
                  </button>
                )}
                
                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSend}
                  className="p-3 text-green-600 hover:text-white hover:bg-gradient-to-br hover:from-green-500 hover:to-emerald-600 rounded-r-2xl transition-all duration-300 hover:shadow-lg hover:shadow-green-200 group focus:outline-none focus:ring-2 focus:ring-green-300"
                  disabled={isRecording || !input.trim()}
                  aria-label="Send message"
                >
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
              
              {isRecording && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-medium shadow-lg pointer-events-none">
                  Release when done
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-green-600"></div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Quick Questions */}
          {/* {messages.length === 0 && (
            <div className="p-4 pt-0 bg-gradient-to-r from-green-50/80 via-white/80 to-emerald-50/80 backdrop-blur-sm">
              <p className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">
                <span className="text-lg">🌱</span> Quick start:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(qaPairs).map((question, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => handleQuestionClick(question, e)}
                    className="group relative text-xs bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 px-4 py-2.5 rounded-2xl border-2 border-green-200/60 hover:border-green-300 transition-all duration-300 hover:shadow-lg hover:shadow-green-200/50 hover:scale-105 font-medium focus:outline-none focus:ring-2 focus:ring-green-300/50"
                    aria-label={`Ask: ${question}`}
                  >
                    {question}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-300/20 to-emerald-300/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm -z-10 pointer-events-none"></div>
                  </button>
                ))}
              </div>
            </div> */}
          )}
        </div>
      )}
    </div>
  );
};

export default Chatbot;
