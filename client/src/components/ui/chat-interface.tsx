import { useState, useRef, useEffect } from "react";
import { Mic, Image, Lightbulb, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessage } from "@shared/schema";
import { useChat } from "@/lib/contexts/chat-context";
import { useInterface } from "@/lib/contexts/interface-context";
import { clearChat } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";

export function ChatInterface() {
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    messages,
    isLoading,
    sendMessage,
    isTyping
  } = useChat();

  const { activeInterface } = useInterface();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const message = inputValue;
    setInputValue("");
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartVoiceInput = () => {
    setIsRecording(true);
    toast({
      title: "Voice Recording",
      description: "Voice recording not implemented in this demo.",
      duration: 3000,
    });
    // In a real implementation, this would start recording audio
    setTimeout(() => setIsRecording(false), 2000);
  };

  const handleUploadImage = () => {
    toast({
      title: "Image Upload",
      description: "Image upload not implemented in this demo.",
      duration: 3000,
    });
    // In a real implementation, this would open a file picker
  };

  const handleShowSuggestions = () => {
    // Examples of common requests
    const suggestions = [
      "Find flights from San Francisco to New York",
      "Show me luxury hotels in Manhattan",
      "What shopping discounts are available with my Amex card?",
      "How can I maximize my travel points?"
    ];
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    setInputValue(randomSuggestion);
  };

  const handleClearChat = async () => {
    try {
      await clearChat();
      toast({
        title: "Chat Cleared",
        description: "Started a new conversation.",
        duration: 3000,
      });
      window.location.reload(); // Refresh to update UI
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear chat. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="w-full md:w-2/5 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
      <div className="bg-[#2A3080] p-4 text-white">
        <h2 className="font-sf-pro font-semibold">Your AI Travel Assistant</h2>
        <p className="text-sm opacity-80">Ask about flights, hotels, or shopping with your cards</p>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 chat-container scrollbar-thin"
      >
        {isLoading ? (
          // Loading skeleton
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-start mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-300 mr-3"></div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-60" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>
          ))
        ) : (
          // Actual messages
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex items-start mb-4 ${
                message.role === "user" ? "justify-end" : ""
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#1A1F71] flex items-center justify-center text-white flex-shrink-0 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M12 2v8" />
                    <path d="m4.93 10.93 1.41 1.41" />
                    <path d="M2 18h2" />
                    <path d="M20 18h2" />
                    <path d="m19.07 10.93-1.41 1.41" />
                    <path d="M22 22H2" />
                    <path d="m16 6-4 4-4-4" />
                    <path d="M16 18a4 4 0 0 0-8 0" />
                  </svg>
                </div>
              )}
              
              <div className={`${
                message.role === "user" 
                  ? "bg-[#1A1F71] text-white" 
                  : "bg-gray-100 text-gray-800"
                } rounded-lg p-3 max-w-[80%]`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 flex-shrink-0 ml-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start mb-4">
            <div className="w-8 h-8 rounded-full bg-[#1A1F71] flex items-center justify-center text-white flex-shrink-0 mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M12 2v8" />
                <path d="m4.93 10.93 1.41 1.41" />
                <path d="M2 18h2" />
                <path d="M20 18h2" />
                <path d="m19.07 10.93-1.41 1.41" />
                <path d="M22 22H2" />
                <path d="m16 6-4 4-4-4" />
                <path d="M16 18a4 4 0 0 0-8 0" />
              </svg>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              <p className="text-sm typing-animation">Thinking...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t">
        <div className="flex items-center">
          <Input
            type="text"
            placeholder="Ask about your travel plans..."
            className="flex-1 border border-gray-300 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#1A1F71]"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isTyping}
          />
          <Button
            className="bg-[#1A1F71] text-white px-4 py-2 rounded-r-lg hover:bg-[#141A5E] transition-colors"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex mt-3 text-xs text-gray-500 justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center hover:text-[#1A1F71] transition"
            onClick={handleStartVoiceInput}
            disabled={isTyping}
          >
            <Mic className="h-3 w-3 mr-1" />
            <span>Voice</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center hover:text-[#1A1F71] transition"
            onClick={handleUploadImage}
            disabled={isTyping}
          >
            <Image className="h-3 w-3 mr-1" />
            <span>Upload image</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center hover:text-[#1A1F71] transition"
            onClick={handleShowSuggestions}
            disabled={isTyping}
          >
            <Lightbulb className="h-3 w-3 mr-1" />
            <span>Suggestions</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center hover:text-[#1A1F71] transition"
            onClick={handleClearChat}
            disabled={isTyping}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            <span>New chat</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
