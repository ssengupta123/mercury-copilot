import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentIcon } from "@/components/agent-icon";
import { useTheme } from "@/components/theme-provider";
import logoPath from "@assets/Reason_Group_Logo_CMYK_(1)_1772539075105.png";
import { Link } from "wouter";
import {
  Sun,
  Settings,
  Moon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Agent } from "@/lib/types";

interface ChatSidebarProps {
  activeConversationId: number | null;
  selectedPhase: string | null;
  onNewConversation: () => void;
  onSelectPhase: (phaseId: string | null) => void;
}

export function ChatSidebar({
  selectedPhase,
  onNewConversation,
  onSelectPhase,
}: ChatSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const [showAgents, setShowAgents] = useState(true);

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  return (
    <div className="flex flex-col h-full">
      <div className="h-12 flex items-center px-4 border-b border-sidebar-border shrink-0">
        <img
          src={logoPath}
          alt="Reason Group"
          className="h-6 object-contain object-left"
          data-testid="img-reason-logo"
        />
      </div>

      <div className="px-4 pt-3 pb-1">
        <h1 className="font-semibold text-sm leading-tight" data-testid="text-app-title">Mercury Copilot</h1>
      </div>

      <ScrollArea className="flex-1 px-2">
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
              {agents.map((agent) => {
                const isSelected = selectedPhase === agent.id;
                return (
                  <button
                    key={agent.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md w-full text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/50"
                    }`}
                    onClick={() => onSelectPhase(isSelected ? null : agent.id)}
                    data-testid={`phase-button-${agent.id}`}
                  >
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: agent.color + "20" }}>
                      <AgentIcon icon={agent.icon} className="w-3 h-3" color={agent.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate text-sidebar-foreground/90">{agent.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3 space-y-1">
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
