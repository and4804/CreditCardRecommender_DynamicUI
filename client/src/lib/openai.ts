import { ChatMessage } from "@shared/schema";
import { apiRequest } from "./queryClient";

export type ContextAnalysisType = {
  context: "flight" | "hotel" | "shopping" | "general";
  intent: string;
  entities: {
    location?: string;
    dates?: {
      start?: string;
      end?: string;
    };
    travelers?: number;
    cardPreference?: string;
    budget?: string;
    category?: string;
  };
};

export type ChatResponseType = {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  contextAnalysis: ContextAnalysisType;
};

export async function sendMessage(message: string): Promise<ChatResponseType> {
  try {
    const response = await apiRequest("POST", "/api/chat", { message });
    const data = await response.json();
    return data as ChatResponseType;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message. Please try again.");
  }
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  try {
    const response = await fetch("/api/chat", {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chat history: ${response.status}`);
    }
    
    return await response.json() as ChatMessage[];
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw new Error("Failed to load chat history. Please refresh the page.");
  }
}

export async function clearChat(): Promise<{ message: string }> {
  try {
    const response = await apiRequest("DELETE", "/api/chat", {});
    return await response.json();
  } catch (error) {
    console.error("Error clearing chat:", error);
    throw new Error("Failed to clear chat. Please try again.");
  }
}

export async function processVoiceInput(audioBlob: Blob): Promise<string> {
  // This would normally send the audio to a speech-to-text API
  // For now, return a placeholder message
  return "This is a placeholder for voice input transcription. In a real implementation, the audio would be sent to a speech-to-text API.";
}
