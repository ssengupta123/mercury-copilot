import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AgentIcon } from "@/components/agent-icon";
import { Badge } from "@/components/ui/badge";
import logoPath from "@assets/Reason_Group_Logo_Stacked_CMYK_(1)_1772514975025.png";
import { ChevronRight, FileText } from "lucide-react";
import type { Agent } from "@/lib/types";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const PHASE_DELIVERABLES: Record<string, { label: string; text: string }[]> = {
  mobilisation: [
    { label: "Internal Job Plan — Identify Resources", text: "Help me create an internal job plan to identify and allocate the right resources for our Mercury engagement" },
    { label: "Mission Placemat — Scope & Guardrails", text: "Help me create a mission placemat with scope, guardrails, and success criteria for our Mercury engagement" },
    { label: "Success Criteria Definition", text: "Help me define quantifiable success criteria for our Mercury engagement" },
    { label: "Governance Structure", text: "Help me set up the governance structure and reporting lines for our Mercury engagement" },
    { label: "Stakeholder Identification & Mapping", text: "Help me identify and map key stakeholders for our Mercury engagement" },
    { label: "Seven Guardrails Checklist", text: "Walk me through setting up Mercury's seven guardrails for our engagement" },
  ],
  planning: [
    { label: "Team Assembly — Roles & Responsibilities", text: "I need to assemble a Mercury team — help me determine the right size and roles for our project" },
    { label: "Sandbox Environment Setup", text: "Help me plan a sandbox environment for rapid prototyping with obfuscated data" },
    { label: "Data Access Requirements", text: "Help me define data access requirements and establish data pipelines for our Mercury engagement" },
    { label: "Customer Panel Recruitment", text: "Help me recruit and set up a customer panel of 40+ participants for our Mercury engagement" },
    { label: "Champion Working Team Charter", text: "Help me build a champion working team of 4-5 key business representatives" },
    { label: "Project Plan & Guardrails", text: "Help me create a project plan with team structure and guardrails for our Mercury engagement" },
  ],
  discovery: [
    { label: "Customer Research Plan", text: "Help me plan customer research activities including ethnographic research and user testing" },
    { label: "Data Exploration & Analysis", text: "Help me structure data exploration and analysis activities for our discovery phase" },
    { label: "Prototyping Workshop Plan", text: "Help me plan a rapid prototyping workshop — we want to prototype multiple times per day" },
    { label: "Feedback Loops Setup", text: "Help me establish lightspeed feedback loops for our discovery phase" },
    { label: "Daily Showcase Agenda", text: "Help me structure daily showcases to demonstrate prototype progress and gather feedback" },
    { label: "Insights Report Template", text: "Help me create an insights report structure to capture discovery findings, personas, and journey maps" },
  ],
  delivery: [
    { label: "Sprint / Iteration Planning", text: "Help me plan sprints and iterations for our Mercury delivery phase (Weeks 4-12)" },
    { label: "Daily Playback Agenda", text: "Help me structure daily playbacks for our Mercury delivery team" },
    { label: "Weekly Value Showcase", text: "I need to structure a weekly value showcase to demonstrate progress to stakeholders" },
    { label: "Champion Team Validation", text: "Help me set up champion working team validation sessions for our delivery outputs" },
    { label: "Integration Testing Checklist", text: "Help me create an integration testing checklist for our Mercury delivery" },
    { label: "Risk Assessment & Mitigation", text: "Help me assess and mitigate risks during our Mercury delivery phase" },
  ],
  approval: [
    { label: "Final Showcase Presentation", text: "Help me prepare the final showcase presentation for our Mercury approval phase" },
    { label: "Value Validation Scorecard", text: "Help me create a value validation scorecard against our original success criteria" },
    { label: "Handover Documentation", text: "Help me prepare comprehensive handover documentation for our Mercury engagement" },
    { label: "Lessons Learned Report", text: "Help me facilitate and capture lessons learned from our Mercury engagement" },
    { label: "Next Steps & Roadmap", text: "Help me plan next steps and create a roadmap for continued delivery after Mercury" },
    { label: "Implementation Roadmap", text: "Help me create an implementation roadmap for scaling the Mercury outcomes" },
  ],
};

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const selectedAgent = agents.find(a => a.id === selectedPhase);
  const deliverables = selectedPhase ? PHASE_DELIVERABLES[selectedPhase] || [] : [];

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-6">
        <div className="text-center space-y-3">
          <img
            src={logoPath}
            alt="Reason Group"
            className="w-16 h-16 rounded-xl mx-auto object-cover"
            data-testid="img-welcome-logo"
          />
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-welcome-title">Mercury Copilot</h2>
            <p className="text-sm text-primary font-medium mt-1">by Reason Group</p>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Select a phase below to see the deliverables you can work on, or type a question directly.
          </p>
        </div>

        <div className="flex gap-4 min-h-[320px]">
          <div className="w-56 shrink-0 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Mercury Phases</p>
            {agents.map((agent) => {
              const isSelected = selectedPhase === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedPhase(isSelected ? null : agent.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isSelected
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-card border border-card-border hover:border-primary/20 hover:bg-card/80"
                  }`}
                  data-testid={`phase-button-${agent.id}`}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: agent.color + "15" }}
                  >
                    <AgentIcon icon={agent.icon} className="w-3.5 h-3.5" color={agent.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground">{agent.weekRange}</p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform text-muted-foreground ${isSelected ? "rotate-90 text-primary" : ""}`} />
                </button>
              );
            })}
          </div>

          <div className="flex-1 min-w-0">
            {selectedPhase && selectedAgent ? (
              <div className="space-y-3" data-testid={`deliverables-panel-${selectedPhase}`}>
                <div className="flex items-center gap-2 px-1">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ backgroundColor: selectedAgent.color + "15" }}
                  >
                    <AgentIcon icon={selectedAgent.icon} className="w-3.5 h-3.5" color={selectedAgent.color} />
                  </div>
                  <h3 className="text-sm font-semibold">{selectedAgent.name} Deliverables</h3>
                  <Badge variant="secondary" className="text-[10px]">{selectedAgent.weekRange}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {deliverables.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => onSuggestionClick(d.text)}
                      className="flex items-start gap-2.5 p-3 rounded-lg bg-card border border-card-border text-left hover:border-primary/30 hover:bg-primary/5 transition-all group"
                      data-testid={`deliverable-tile-${selectedPhase}-${i}`}
                    >
                      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-muted group-hover:bg-primary/10 transition-colors">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-medium leading-snug">{d.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center" data-testid="deliverables-placeholder">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Select a phase to see its deliverables</p>
                  <p className="text-xs text-muted-foreground/60">Each deliverable starts a focused conversation with the right specialist</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
