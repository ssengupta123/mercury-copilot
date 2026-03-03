export interface Agent {
  id: string;
  name: string;
  weekRange: string;
  description: string;
  icon: string;
  color: string;
  prerequisites: string[];
}

export interface Conversation {
  id: number;
  title: string;
  activeAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  agentId: string | null;
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface RoutingEvent {
  type: "routing";
  agentId: string;
  agentName: string;
  greeting: string;
  reason: string;
}

export interface ContentEvent {
  type: "content";
  content: string;
}

export interface DoneEvent {
  type: "done";
}

export type SSEEvent = RoutingEvent | ContentEvent | DoneEvent;
