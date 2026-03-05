import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { WelcomeScreen } from "@/components/welcome-screen";
import { PhaseDeliverablesView } from "@/components/phase-deliverables-view";
import { AgentIcon } from "@/components/agent-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bot, Sparkles } from "lucide-react";
import type { Agent, ConversationWithMessages, Message, CopilotBot } from "@/lib/types";

interface ChatViewProps {
  conversationId: number | null;
  selectedPhase?: string | null;
  onConversationCreated: (id: number) => void;
}

export function ChatView({ conversationId, selectedPhase, onConversationCreated }: ChatViewProps) {
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingAgentId, setStreamingAgentId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [routingInfo, setRoutingInfo] = useState<{ agentName: string; greeting: string } | null>(null);
  const [botResponse, setBotResponse] = useState<{ botName: string; skillRole: string; response: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: copilotBots = [] } = useQuery<CopilotBot[]>({
    queryKey: ["/api/admin/copilot-bots"],
  });

  const botMutation = useMutation({
    mutationFn: async ({ botId, message }: { botId: number; message: string }) => {
      const res = await apiRequest("POST", `/api/bots/${botId}/message`, { message });
      return res.json();
    },
    onSuccess: (data) => {
      setBotResponse(data);
    },
  });

  const { data: conversation, isLoading: isLoadingConv } = useQuery<ConversationWithMessages>({
    queryKey: ["/api/conversations", conversationId],
    enabled: !!conversationId,
  });

  const messages = conversation?.messages || [];

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleSend = async (content: string) => {
    let targetConvId = conversationId;

    if (!targetConvId) {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: content.substring(0, 50) }),
        });
        const newConv = await res.json();
        targetConvId = newConv.id;
        onConversationCreated(newConv.id);
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      } catch (error) {
        console.error("Failed to create conversation:", error);
        return;
      }
    }

    queryClient.setQueryData<ConversationWithMessages>(
      ["/api/conversations", targetConvId],
      (old) => {
        const userMsg: Message = {
          id: Date.now(),
          conversationId: targetConvId!,
          role: "user",
          content,
          agentId: null,
          createdAt: new Date().toISOString(),
        };
        if (!old) {
          return {
            id: targetConvId!,
            title: content.substring(0, 50),
            activeAgent: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [userMsg],
          };
        }
        return { ...old, messages: [...old.messages, userMsg] };
      }
    );

    setIsStreaming(true);
    setStreamingContent("");
    setStreamingAgentId(null);
    setRoutingInfo(null);

    try {
      const response = await fetch(`/api/conversations/${targetConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "routing") {
              setStreamingAgentId(event.agentId);
              setRoutingInfo({
                agentName: event.agentName,
                greeting: event.greeting,
              });
            } else if (event.type === "content") {
              fullContent += event.content;
              setStreamingContent(fullContent);
            } else if (event.type === "done") {
              setIsStreaming(false);
              setStreamingContent("");
              setStreamingAgentId(null);
              setRoutingInfo(null);
              queryClient.invalidateQueries({
                queryKey: ["/api/conversations", targetConvId],
              });
              queryClient.invalidateQueries({
                queryKey: ["/api/conversations"],
              });
            }
          } catch {
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  if (!conversationId && selectedPhase) {
    return (
      <div className="flex flex-col h-full">
        <PhaseDeliverablesView phaseId={selectedPhase} onDeliverableClick={handleSend} />
        <ChatInput onSend={handleSend} isLoading={isStreaming} />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex flex-col h-full">
        <WelcomeScreen onSuggestionClick={handleSend} />
        <ChatInput onSend={handleSend} isLoading={isStreaming} />
      </div>
    );
  }

  const activeAgent = conversation?.activeAgent
    ? agents.find(a => a.id === conversation.activeAgent)
    : null;

  const activePhaseBots = activeAgent
    ? copilotBots.filter(b => b.phaseId === activeAgent.id && b.isActive)
    : [];

  const lastUserMessage = messages.length > 0
    ? [...messages].reverse().find(m => m.role === "user")?.content || ""
    : "";

  return (
    <div className="flex flex-col h-full">
      {activeAgent && (
        <div className="px-4 py-2 border-b border-border bg-card/50 flex items-center gap-2 flex-wrap">
          <AgentIcon icon={activeAgent.icon} className="w-4 h-4" color={activeAgent.color} />
          <span className="text-sm font-medium">{activeAgent.name}</span>
          <Badge variant="secondary" className="text-[10px]">{activeAgent.phase} · {activeAgent.weekRange}</Badge>
          {activePhaseBots.length > 0 && (
            <div className="flex items-center gap-1.5 ml-auto">
              {activePhaseBots.map((bot) => (
                <Button
                  key={bot.id}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-7"
                  disabled={botMutation.isPending}
                  onClick={() => {
                    setBotResponse(null);
                    botMutation.mutate({ botId: bot.id, message: lastUserMessage || "Hello, I need help with this phase." });
                  }}
                  data-testid={`button-ask-specialist-${bot.id}`}
                >
                  <Bot className="w-3 h-3" />
                  Ask {bot.skillRole}
                  {botMutation.isPending && botMutation.variables?.botId === bot.id && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto p-4 space-y-6 pb-4">
          {isLoadingConv ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  agentId={msg.agentId}
                  agents={agents}
                />
              ))}

              {isStreaming && routingInfo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-11" data-testid="routing-indicator">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{routingInfo.greeting}</span>
                </div>
              )}

              {isStreaming && streamingContent && (
                <ChatMessage
                  role="assistant"
                  content={streamingContent}
                  agentId={streamingAgentId}
                  agents={agents}
                  isStreaming
                />
              )}

              {isStreaming && !streamingContent && !routingInfo && (
                <div className="flex items-center gap-2 px-11 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {botResponse && (
                <div className="border border-primary/20 rounded-lg p-4 bg-primary/5" data-testid="bot-response-panel">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">{botResponse.botName}</span>
                    <Badge variant="outline" className="text-[10px]">{botResponse.skillRole}</Badge>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{botResponse.response}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-muted-foreground"
                    onClick={() => setBotResponse(null)}
                    data-testid="button-dismiss-bot-response"
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              {botMutation.isPending && (
                <div className="border border-primary/20 rounded-lg p-4 bg-primary/5" data-testid="bot-loading-panel">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Consulting specialist bot...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <ChatInput onSend={handleSend} isLoading={isStreaming} />
    </div>
  );
}
