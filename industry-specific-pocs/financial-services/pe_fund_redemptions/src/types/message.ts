export interface Citation {
  toolUseId: string;
  source: string;
  index: number;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  citations?: Citation[];
}

export const getWelcomeMessage = (): Message => ({
  id: "welcome",
  text: "Hello! I'm your AI assistant. How can I help you today?",
  isUser: false,
  timestamp: new Date()
});
