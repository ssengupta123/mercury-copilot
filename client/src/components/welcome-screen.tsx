import { useQuery } from "@tanstack/react-query";
import { AgentIcon } from "@/components/agent-icon";
import logoPath from "@assets/Reason_Group_Logo_CMYK_(1)_1772539075105.png";
import type { Agent } from "@/lib/types";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-3">
          <img
            src={logoPath}
            alt="Reason Group"
            className="h-12 mx-auto object-contain"
            data-testid="img-welcome-logo"
          />
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-welcome-title">Mercury Copilot</h2>
            <p className="text-sm text-primary font-medium mt-1">by Reason Group</p>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your AI-powered delivery assistant for the Mercury Method — delivering guaranteed outcomes in 13 weeks. Ask about any phase from Mobilisation through Approval.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-card-border"
              data-testid={`welcome-phase-${agent.id}`}
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: agent.color + "15" }}
              >
                <AgentIcon icon={agent.icon} className="w-4 h-4" color={agent.color} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{agent.name}</p>
                <p className="text-[10px] text-muted-foreground">{agent.phase} · {agent.weekRange}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground/60">
          Click a phase in the sidebar to explore its deliverables
        </p>
      </div>
    </div>
  );
}
