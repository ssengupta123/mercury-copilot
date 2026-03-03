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
    label: "Statement of Work",
    text: "I need help creating a Statement of Work (SOW) for a new project engagement",
    agentHint: "initiation",
  },
  {
    label: "Requirements & User Stories",
    text: "Help me structure requirements into Epics, Features, User Stories with Acceptance Criteria",
    agentHint: "discovery-design",
  },
  {
    label: "Testing Strategy",
    text: "I need to create a testing strategy covering unit testing, SIT, and UAT",
    agentHint: "planning",
  },
  {
    label: "Change Impact Analysis",
    text: "Help me create a change management and communication plan for our project",
    agentHint: "discovery-design",
  },
  {
    label: "Sprint Planning",
    text: "Help me set up sprint planning with proper backlog structure and capacity planning",
    agentHint: "design",
  },
  {
    label: "Release & Deployment",
    text: "I need a release checklist and deployment plan including TVT and BVT",
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
            Your AI-powered delivery assistant. Ask me about any phase of the Mercury delivery methodology and I'll guide you through templates, best practices, and deliverables.
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
            9 delivery phases covered
          </p>
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {agents.map((agent) => (
              <Badge key={agent.id} variant="secondary" className="text-[10px] gap-1">
                <AgentIcon icon={agent.icon} className="w-3 h-3" color={agent.color} />
                {agent.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
