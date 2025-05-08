import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ChatMessage } from '@shared/schema';
import { sendMessage, getChatHistory, ChatResponseType } from '@/lib/openai';
import { useInterface } from './interface-context';
import { useToast } from '@/hooks/use-toast';

type ChatContextType = {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  sendMessage: (message: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType>({
  messages: [],
  isLoading: false,
  isTyping: false,
  sendMessage: async () => {},
});

export const ChatContextProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const { setActiveInterface } = useInterface();
  const { toast } = useToast();

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await getChatHistory();
        setMessages(history);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load chat history. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [toast]);

  const handleSendMessage = async (message: string) => {
    try {
      // Add user message to the UI immediately
      const tempUserMessage: ChatMessage = {
        id: Date.now(),
        userId: 1,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, tempUserMessage]);
      setIsTyping(true);
      
      // Send message to the API
      const response = await sendMessage(message);
      
      // Update messages with the real response
      setMessages((prev) => {
        // Remove the temp user message and add the real one
        const filtered = prev.filter(m => m.id !== tempUserMessage.id);
        return [...filtered, response.userMessage, response.aiMessage];
      });
      
      // Set the appropriate interface based on context
      switch (response.contextAnalysis.context) {
        case 'flight':
          setActiveInterface('flight');
          break;
        case 'hotel':
          setActiveInterface('hotel');
          break;
        case 'shopping':
          setActiveInterface('shopping');
          break;
        default:
          // Keep the current interface
          break;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        isTyping,
        sendMessage: handleSendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
