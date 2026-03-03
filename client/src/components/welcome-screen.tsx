import { useQuery } from "@tanstack/react-query";
import { AgentIcon } from "@/components/agent-icon";
import { Badge } from "@/components/ui/badge";
import logoPath from "@assets/Reason_Group_Logo_Stacked_CMYK_(1)_1772514975025.png";
import type { Agent } from "@/lib/types";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const suggestions = [
  {
    label: "Mission Placemat",
    text: "Help me create a mission placemat for our Mercury engagement with scope, guardrails, and success criteria",
    agentHint: "mobilization",
  },
  {
    label: "Team Assembly",
    text: "I need to assemble a Mercury team — help me determine the right size and roles for our project",
    agentHint: "planning",
  },
  {
    label: "Customer Research",
    text: "Help me plan customer research and set up a customer panel for our discovery phase",
    agentHint: "discovery",
  },
  {
    label: "Value Showcase",
    text: "I need to structure a weekly value showcase to demonstrate progress to stakeholders",
    agentHint: "delivery",
  },
  {
    label: "Sandbox Setup",
    text: "Help me plan a sandbox environment for rapid prototyping with obfuscated data",
    agentHint: "planning",
  },
  {
    label: "Final Handover",
    text: "Help me prepare the final showcase and handover documentation for our Mercury approval phase",
    agentHint: "approval",
  },
];

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <img
            src={logoPath}
            alt="Reason Group"
            className="w-20 h-20 rounded-xl mx-auto object-cover"
            data-testid="img-welcome-logo"
          />
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-welcome-title">Mercury Copilot</h2>
            <p className="text-sm text-primary font-medium mt-1">by Reason Group</p>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your AI-powered delivery assistant for the Mercury Method — delivering guaranteed outcomes in 13 weeks. Ask about any phase from Mobilization through Approval.
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
          <p className="text-xs text-muted-foreground mb-2">
            5 phases across 13 weeks
          </p>
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {agents.map((agent) => (
              <Badge key={agent.id} variant="secondary" className="text-[10px] gap-1">
                <AgentIcon icon={agent.icon} className="w-3 h-3" color={agent.color} />
                {agent.name}
                <span className="text-muted-foreground ml-0.5">{agent.weekRange}</span>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
