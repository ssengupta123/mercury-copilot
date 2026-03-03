import { AgentIcon } from "@/components/agent-icon";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { User } from "lucide-react";
import type { Agent } from "@/lib/types";

interface ChatMessageProps {
  role: string;
  content: string;
  agentId?: string | null;
  agents: Agent[];
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, agentId, agents, isStreaming }: ChatMessageProps) {
  const agent = agentId ? agents.find(a => a.id === agentId) : null;

  if (role === "user") {
    return (
      <div className="flex gap-3 justify-end" data-testid="chat-message-user">
        <div className="max-w-[75%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm">
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3" data-testid="chat-message-assistant">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-border" style={agent ? { backgroundColor: agent.color + "15" } : {}}>
        {agent ? (
          <AgentIcon icon={agent.icon} className="w-4 h-4" color={agent.color} />
        ) : (
          <div className="w-4 h-4 rounded-full bg-primary" />
        )}
      </div>
      <div className="max-w-[80%] min-w-0">
        {agent && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium" style={{ color: agent.color }}>
              {agent.name}
            </span>
            <span className="text-[10px] text-muted-foreground">{agent.weekRange}</span>
          </div>
        )}
        <div className="bg-card rounded-2xl rounded-bl-md px-4 py-2.5 border border-card-border shadow-sm">
          <MarkdownRenderer content={content} />
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 rounded-sm" />
          )}
        </div>
      </div>
    </div>
  );
}
