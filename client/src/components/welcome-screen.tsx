import { useQuery } from "@tanstack/react-query";
import { AgentIcon } from "@/components/agent-icon";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import type { Agent } from "@/lib/types";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const suggestions = [
  {
    label: "Business Requirements",
    text: "I need help creating a Business Requirements Document template for my project",
    agentHint: "business-analysis",
  },
  {
    label: "Change Impact Analysis",
    text: "Help me create a Change Management impact analysis for our system migration",
    agentHint: "change-management",
  },
  {
    label: "Project Charter",
    text: "I need to create a project charter for a new initiative",
    agentHint: "discovery",
  },
  {
    label: "Test Strategy",
    text: "Help me define a test strategy and create test case templates",
    agentHint: "testing",
  },
  {
    label: "Solution Architecture",
    text: "I need to design the solution architecture for our new platform",
    agentHint: "solution-architecture",
  },
  {
    label: "Go-Live Readiness",
    text: "Help me assess our go-live readiness and create a deployment plan",
    agentHint: "deployment",
  },
];

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold" data-testid="text-welcome-title">Welcome to Mercury Copilot</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your AI-powered delivery orchestrator. I route your questions to 12 specialist agents covering every phase of the Mercury 12-week delivery process.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((s) => {
            const agent = agents.find(a => a.id === s.agentHint);
            return (
              <button
                key={s.label}
                onClick={() => onSuggestionClick(s.text)}
                className="flex items-start gap-3 p-3 rounded-lg bg-card border border-card-border text-left hover-elevate transition-all"
                data-testid={`suggestion-${s.agentHint}`}
              >
                {agent && (
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: agent.color + "15" }}
                  >
                    <AgentIcon icon={agent.icon} className="w-4 h-4" color={agent.color} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.text}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Powered by 12 specialist agents
          </p>
          <div className="flex items-center justify-center gap-1 mt-2 flex-wrap">
            {agents.slice(0, 6).map((agent) => (
              <Badge key={agent.id} variant="secondary" className="text-[10px] gap-1">
                <AgentIcon icon={agent.icon} className="w-3 h-3" color={agent.color} />
                {agent.name}
              </Badge>
            ))}
            {agents.length > 6 && (
              <Badge variant="secondary" className="text-[10px]">
                +{agents.length - 6} more
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
