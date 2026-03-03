import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AgentIcon } from "@/components/agent-icon";
import { useTheme } from "@/components/theme-provider";
import logoPath from "@assets/Reason_Group_Logo_Stacked_CMYK_(1)_1772514975025.png";
import { Link } from "wouter";
import {
  Plus,
  MessageSquare,
  Trash2,
  Sun,
  Settings,
  Moon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Conversation, Agent } from "@/lib/types";

interface ChatSidebarProps {
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => void;
}

export function ChatSidebar({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ChatSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const [showAgents, setShowAgents] = useState(true);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <img
          src={logoPath}
          alt="Reason Group"
          className="w-10 h-10 rounded-md object-cover"
          data-testid="img-reason-logo"
        />
        <div className="min-w-0">
          <h1 className="font-semibold text-sm leading-tight truncate" data-testid="text-app-title">Mercury Copilot</h1>
          <p className="text-xs text-sidebar-foreground/60 truncate">by Reason Group</p>
        </div>
      </div>

      <div className="px-3 pb-2">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2"
          variant="default"
          size="sm"
          data-testid="button-new-conversation"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </Button>
      </div>

      <Separator className="bg-sidebar-border" />

      <ScrollArea className="flex-1 px-2">
        <div className="py-2 space-y-1">
          <p className="px-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider mb-2">
            Recent Chats
          </p>
          {conversations.length === 0 ? (
            <p className="px-2 text-xs text-sidebar-foreground/40 py-4">
              No conversations yet. Start a new one to get help with your Mercury delivery process.
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                  activeConversationId === conv.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover-elevate"
                }`}
                onClick={() => onSelectConversation(conv.id)}
                data-testid={`conversation-item-${conv.id}`}
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-sidebar-foreground/50" />
                <span className="flex-1 text-sm truncate">{conv.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(conv.id);
                    if (activeConversationId === conv.id) {
                      onNewConversation();
                    }
                  }}
                  data-testid={`button-delete-conversation-${conv.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        <Separator className="my-2 bg-sidebar-border" />

        <div className="py-2">
          <button
            className="flex items-center gap-2 px-2 py-1.5 w-full text-left rounded-md hover-elevate"
            onClick={() => setShowAgents(!showAgents)}
            data-testid="button-toggle-agents"
          >
            {showAgents ? (
              <ChevronDown className="w-3 h-3 text-sidebar-foreground/50" />
            ) : (
              <ChevronRight className="w-3 h-3 text-sidebar-foreground/50" />
            )}
            <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              Mercury Phases
            </p>
          </button>

          {showAgents && (
            <div className="space-y-0.5 mt-1">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                  data-testid={`agent-info-${agent.id}`}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: agent.color + "20" }}>
                    <AgentIcon icon={agent.icon} className="w-3 h-3" color={agent.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate text-sidebar-foreground/90">{agent.name}</p>
                  </div>
                  <span className="text-[10px] text-sidebar-foreground/40 shrink-0">{agent.weekRange}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />
      <div className="p-3 space-y-1">
        <Link href="/admin">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/70"
            data-testid="button-admin-settings"
          >
            <Settings className="w-4 h-4" />
            Admin Settings
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/70"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
      </div>
    </div>
  );
}
