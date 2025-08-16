export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const getWelcomeMessage = (): Message => ({
  id: "welcome",
  text: "Hello! I'm your AI assistant. How can I help you today?",
  isUser: false,
  timestamp: new Date()
});
