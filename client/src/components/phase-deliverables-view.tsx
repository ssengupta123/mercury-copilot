import { useQuery } from "@tanstack/react-query";
import { AgentIcon } from "@/components/agent-icon";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PHASE_DELIVERABLES } from "@/lib/phase-deliverables";
import { FileText } from "lucide-react";
import type { Agent } from "@/lib/types";

interface PhaseDeliverablesViewProps {
  phaseId: string;
  onDeliverableClick: (text: string) => void;
}

export function PhaseDeliverablesView({ phaseId, onDeliverableClick }: PhaseDeliverablesViewProps) {
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const agent = agents.find(a => a.id === phaseId);
  const groups = PHASE_DELIVERABLES[phaseId] || [];
  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  if (!agent) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: agent.color + "15" }}
          >
            <AgentIcon icon={agent.icon} className="w-5 h-5" color={agent.color} />
          </div>
          <div>
            <h2 className="text-base font-semibold" data-testid="text-phase-title">{agent.name}</h2>
            <p className="text-xs text-muted-foreground">{agent.phase} · {agent.weekRange} · {totalItems} deliverables</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {groups.map((group, gi) => (
            <div key={gi} data-testid={`deliverable-group-${gi}`}>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">{group.subPhase}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => onDeliverableClick(d.text)}
                    className="flex items-start gap-3 p-3 rounded-lg bg-card border border-card-border text-left hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    data-testid={`deliverable-tile-${phaseId}-${gi}-${i}`}
                  >
                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-muted group-hover:bg-primary/10 transition-colors">
                      <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{d.label}</p>
                      {d.optional && (
                        <Badge variant="outline" className="text-[9px] mt-1 px-1.5 py-0">Optional</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
