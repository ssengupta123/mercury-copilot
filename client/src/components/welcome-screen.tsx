import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AgentIcon } from "@/components/agent-icon";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import logoPath from "@assets/Reason_Group_Logo_Stacked_CMYK_(1)_1772514975025.png";
import { ChevronRight, FileText } from "lucide-react";
import type { Agent } from "@/lib/types";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

interface DeliverableGroup {
  subPhase: string;
  items: { label: string; text: string; optional?: boolean }[];
}

const PHASE_DELIVERABLES: Record<string, DeliverableGroup[]> = {
  mobilisation: [
    {
      subPhase: "Mobilisation",
      items: [
        { label: "Internal Job Plan — Identify Resources", text: "Help me create an internal job plan to identify and allocate the right resources for our Mercury engagement" },
      ],
    },
  ],
  planning: [
    {
      subPhase: "Initiation",
      items: [
        { label: "SOW (Statement of Work)", text: "Help me create a Statement of Work for our Mercury engagement" },
        { label: "Stakeholder Matrix — Project, Client, Mapping RG, Sign Off", text: "Help me build a stakeholder matrix covering project, client, RG mapping, and sign-off responsibilities" },
        { label: "Deliverables List", text: "Help me create a comprehensive deliverables list for our Mercury engagement" },
        { label: "Assumptions", text: "Help me document the key assumptions for our Mercury engagement" },
        { label: "Dependencies", text: "Help me identify and document all dependencies for our Mercury engagement" },
        { label: "RAID Log Ready", text: "Help me set up a RAID log (Risks, Assumptions, Issues, Dependencies) for our Mercury engagement" },
        { label: "Kick Off Deck / Mobilisation Plan", text: "Help me create a kick off deck covering ways of working, ceremonies, escalation, and org chart for our Mercury engagement" },
      ],
    },
    {
      subPhase: "Planning",
      items: [
        { label: "Customer Templates Request", text: "Help me prepare customer template requests for our Mercury engagement" },
        { label: "Confirmed Project Plan", text: "Help me create a confirmed project plan for our Mercury engagement" },
        { label: "Testing Strategy", text: "Help me define the testing strategy for our Mercury engagement" },
        { label: "Training Strategy", text: "Help me create a training strategy for our Mercury engagement" },
        { label: "Deployment Strategy", text: "Help me define the deployment strategy for our Mercury engagement" },
        { label: "Development Standards (Per Platform)", text: "Help me define development standards per platform for our Mercury engagement" },
        { label: "Deployment Plan", text: "Help me create a deployment plan for our Mercury engagement" },
        { label: "Workshop Schedule — Prep, PPT and Demos", text: "Help me build a workshop schedule with preparation, presentations, and demos for our Mercury engagement" },
        { label: "Waterfall or Agile?", text: "Help me decide whether to use a waterfall or agile approach for our Mercury engagement" },
      ],
    },
  ],
  discovery: [
    {
      subPhase: "Discovery & Design",
      items: [
        { label: "Requirements + Demo (Epic, Feature, User Story, Acceptance Criteria)", text: "Help me structure requirements as epics, features, user stories, and acceptance criteria for our Mercury engagement" },
        { label: "MoSCoW Prioritisation", text: "Help me apply MoSCoW prioritisation to our requirements" },
        { label: "Fit Gap Analysis (Before MoSCoW)", text: "Help me conduct a fit gap analysis for our Mercury engagement" },
        { label: "High Level Architecture Document", text: "Help me create a high level architecture document for our Mercury engagement" },
        { label: "Data Migration Plan", text: "Help me create a data migration plan for our Mercury engagement" },
        { label: "Integration Design", text: "Help me create an integration design for our Mercury engagement", optional: true },
        { label: "Change Management Plan (Communication)", text: "Help me create a change management and communication plan for our Mercury engagement" },
      ],
    },
    {
      subPhase: "Design",
      items: [
        { label: "Validate Job Plan with Known Scope", text: "Help me validate the job plan against known scope for our Mercury engagement" },
        { label: "Impact Assessment — Functional Design or Technical?", text: "Help me conduct an impact assessment to determine if we need functional or technical design" },
        { label: "Technical Design (Integrations, Architecture)", text: "Help me create a technical design document covering integrations and architecture" },
        { label: "Integration Design", text: "Help me create a detailed integration design for our Mercury engagement", optional: true },
        { label: "Traceability Matrix", text: "Help me build a traceability matrix linking requirements to design and testing" },
        { label: "Sprint Planning", text: "Help me set up sprint planning for our Mercury engagement" },
      ],
    },
  ],
  delivery: [
    {
      subPhase: "Build",
      items: [
        { label: "As Built Documentation", text: "Help me create as-built documentation for our Mercury delivery" },
        { label: "Showcases", text: "Help me structure showcases to demonstrate delivery progress" },
        { label: "Process Document", text: "Help me create a process document for our Mercury delivery", optional: true },
        { label: "Testing Plan", text: "Help me create a testing plan for our Mercury delivery" },
        { label: "Unit and SIT Cases — On Us", text: "Help me create unit test and SIT (System Integration Testing) cases for our Mercury delivery" },
        { label: "End to End Scenarios (Training)", text: "Help me build end to end test scenarios with training materials" },
        { label: "UAT Kick Off Pack — Supported by Training", text: "Help me create a UAT kick off pack with supporting training materials" },
        { label: "Test Evaluation Report", text: "Help me create a test evaluation report for our Mercury delivery" },
        { label: "Data Migration", text: "Help me plan and execute data migration for our Mercury delivery", optional: true },
      ],
    },
    {
      subPhase: "UAT Planning",
      items: [
        { label: "UAT Training", text: "Help me create UAT training materials for our Mercury delivery" },
        { label: "UAT Scenarios — On Customer, RG to Assist", text: "Help me define UAT scenarios where the customer leads and RG assists" },
        { label: "UAT Use Cases Developed by Customer", text: "Help me guide the customer in developing UAT use cases" },
      ],
    },
    {
      subPhase: "UAT",
      items: [
        { label: "Defect Management", text: "Help me set up defect management processes for UAT" },
        { label: "UAT Execution", text: "Help me plan and manage UAT execution for our Mercury delivery" },
      ],
    },
  ],
  approval: [
    {
      subPhase: "Deployment",
      items: [
        { label: "Release Management", text: "Help me set up release management for our Mercury deployment" },
        { label: "Release Checklist", text: "Help me create a release checklist for our Mercury deployment" },
        { label: "TVT (Technical Verification Testing)", text: "Help me plan TVT (Technical Verification Testing) for our Mercury deployment" },
        { label: "BVT (Build Verification Testing)", text: "Help me plan BVT (Build Verification Testing) for our Mercury deployment" },
      ],
    },
    {
      subPhase: "Hypercare",
      items: [
        { label: "Daily Standups", text: "Help me structure daily standups for the hypercare phase of our Mercury engagement" },
        { label: "Defect / Incident Status Meeting", text: "Help me set up defect and incident status meetings for hypercare" },
      ],
    },
  ],
};

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const selectedAgent = agents.find(a => a.id === selectedPhase);
  const groups = selectedPhase ? PHASE_DELIVERABLES[selectedPhase] || [] : [];

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-6">
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

        <div className="flex gap-4 min-h-[360px]">
          <div className="w-56 shrink-0 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Mercury Phases</p>
            {agents.map((agent) => {
              const isSelected = selectedPhase === agent.id;
              const groupCount = (PHASE_DELIVERABLES[agent.id] || []).reduce((sum, g) => sum + g.items.length, 0);
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
                    <p className="text-[10px] text-muted-foreground">{agent.weekRange} · {groupCount} steps</p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform text-muted-foreground ${isSelected ? "rotate-90 text-primary" : ""}`} />
                </button>
              );
            })}
          </div>

          <div className="flex-1 min-w-0">
            {selectedPhase && selectedAgent ? (
              <div className="h-full flex flex-col" data-testid={`deliverables-panel-${selectedPhase}`}>
                <div className="flex items-center gap-2 px-1 mb-3">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ backgroundColor: selectedAgent.color + "15" }}
                  >
                    <AgentIcon icon={selectedAgent.icon} className="w-3.5 h-3.5" color={selectedAgent.color} />
                  </div>
                  <h3 className="text-sm font-semibold">{selectedAgent.name} Deliverables</h3>
                  <Badge variant="secondary" className="text-[10px]">{selectedAgent.weekRange}</Badge>
                </div>
                <ScrollArea className="flex-1 max-h-[400px]">
                  <div className="space-y-4 pr-3">
                    {groups.map((group, gi) => (
                      <div key={gi}>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">{group.subPhase}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.items.map((d, i) => (
                            <button
                              key={i}
                              onClick={() => onSuggestionClick(d.text)}
                              className="flex items-start gap-2.5 p-3 rounded-lg bg-card border border-card-border text-left hover:border-primary/30 hover:bg-primary/5 transition-all group"
                              data-testid={`deliverable-tile-${selectedPhase}-${gi}-${i}`}
                            >
                              <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-muted group-hover:bg-primary/10 transition-colors">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
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
