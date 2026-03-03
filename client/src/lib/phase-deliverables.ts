export interface DeliverableItem {
  label: string;
  text: string;
  optional?: boolean;
}

export interface DeliverableGroup {
  subPhase: string;
  items: DeliverableItem[];
}

export const PHASE_DELIVERABLES: Record<string, DeliverableGroup[]> = {
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
