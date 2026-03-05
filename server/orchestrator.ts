import { MERCURY_AGENTS, getAgentById, getAgentByKeyword, type AgentDefinition } from "./agents";

export interface RoutingResult {
  agentId: string;
  agent: AgentDefinition;
  reason: string;
  prerequisitesCheck: string[];
  greeting: string;
}

export async function routeMessage(
  userMessage: string,
  conversationHistory: { role: string; content: string; agentId?: string | null }[],
  currentAgent?: string | null
): Promise<RoutingResult> {
  const keywordMatch = getAgentByKeyword(userMessage);

  if (currentAgent && !keywordMatch) {
    const agent = getAgentById(currentAgent) || MERCURY_AGENTS[0];
    return {
      agentId: agent.id,
      agent,
      reason: "Continuing current phase conversation",
      prerequisitesCheck: [],
      greeting: `Connecting you with the ${agent.name} specialist.`,
    };
  }

  const matched = keywordMatch || MERCURY_AGENTS[0];
  return {
    agentId: matched.id,
    agent: matched,
    reason: keywordMatch ? "Keyword match" : "Default routing to Mobilisation",
    prerequisitesCheck: [],
    greeting: `Connecting you with the ${matched.name} specialist.`,
  };
}
