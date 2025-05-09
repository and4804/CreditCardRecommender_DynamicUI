import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ChatMessage } from '@shared/schema';
import { sendMessage, getChatHistory, clearChat, ChatResponseType } from '@/lib/openai';
import { useInterface } from './interface-context';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Define a ChatSession type for tracking sessions
type ChatSession = {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  messages: ChatMessage[];
};

type ChatContextType = {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  recentChats: ChatSession[];
  activeChat: string | null;
  sendMessage: (message: string) => Promise<void>;
  startNewChat: () => Promise<void>;
  loadChatSession: (sessionId: string) => void;
};

const ChatContext = createContext<ChatContextType>({
  messages: [],
  isLoading: false,
  isTyping: false,
  recentChats: [],
  activeChat: null,
  sendMessage: async () => {},
  startNewChat: async () => {},
  loadChatSession: () => {},
});

export const ChatContextProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const { setActiveInterface } = useInterface();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Generate a unique ID for each chat session
  const generateSessionId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Start a new chat by clearing history and creating a new session
  const startNewChat = async () => {
    setIsLoading(true);
    try {
      // Clear existing chat on the server
      await clearChat();
      
      // Generate a new session ID
      const newSessionId = generateSessionId();
      setActiveChat(newSessionId);
      
      // Load fresh messages (should be just the welcome message)
      const freshMessages = await getChatHistory();
      setMessages(freshMessages);
      
      // Add this new session to recent chats
      if (freshMessages.length > 0) {
        const welcomeMsg = freshMessages[0];
        const newSession: ChatSession = {
          id: newSessionId,
          title: "New Conversation",
          preview: welcomeMsg.content.substring(0, 60) + "...",
          timestamp: new Date().toISOString(),
          messages: [...freshMessages],
        };
        
        setRecentChats(prev => [newSession, ...prev.slice(0, 4)]); // Keep only 5 recent chats
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start a new chat. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load a specific chat session from recent chats
  const loadChatSession = (sessionId: string) => {
    const session = recentChats.find(chat => chat.id === sessionId);
    if (session) {
      setMessages(session.messages);
      setActiveChat(sessionId);
    }
  };

  // Effect to start a new chat on login
  useEffect(() => {
    if (isAuthenticated) {
      startNewChat();
    }
  }, [isAuthenticated]);

  // Effect to load initial chat data
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await getChatHistory();
        
        // If there are messages, create an initial chat session
        if (history.length > 0) {
          const initialSessionId = generateSessionId();
          setActiveChat(initialSessionId);
          setMessages(history);
          
          // Create the initial session in recent chats
          const initialSession: ChatSession = {
            id: initialSessionId,
            title: "Previous Conversation",
            preview: history[0].content.substring(0, 60) + "...",
            timestamp: history[0].timestamp || new Date().toISOString(),
            messages: [...history],
          };
          
          setRecentChats([initialSession]);
        }
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

  // Update recent chats when messages change
  useEffect(() => {
    if (messages.length > 0 && activeChat) {
      // Find the current chat session and update its messages
      setRecentChats(prev => {
        return prev.map(chat => {
          if (chat.id === activeChat) {
            // Update the session with the latest messages
            return {
              ...chat,
              messages: [...messages],
              // Update preview to the latest user message if possible
              preview: messages.find(m => m.role === 'user')?.content.substring(0, 60) + "..." || chat.preview,
            };
          }
          return chat;
        });
      });
    }
  }, [messages, activeChat]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        isTyping,
        recentChats,
        activeChat,
        sendMessage: handleSendMessage,
        startNewChat,
        loadChatSession,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
