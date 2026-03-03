import OpenAI from "openai";
import { MERCURY_AGENTS, getAgentById, getAgentByKeyword, type AgentDefinition } from "./agents";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Mercury Copilot Orchestrator - an intelligent routing system for a 12-week delivery methodology called Mercury.

Your job is to analyze the user's message and determine which specialist agent should handle it. You have 12 specialist agents:

${MERCURY_AGENTS.map(a => `- **${a.id}**: ${a.name} (${a.weekRange}) - ${a.description}`).join("\n")}

ROUTING RULES:
1. Analyze the user's message for intent and topic
2. Return ONLY a JSON object with:
   - "agentId": the id of the best matching agent
   - "reason": brief explanation of why this agent was selected
   - "prerequisites_check": array of prerequisite agent IDs that should have been completed first
   - "greeting": a brief transition message to introduce the specialist agent

3. If the user's message is a general greeting or unclear, route to "discovery" as the default starting point
4. If the user asks about multiple topics spanning agents, route to the MOST RELEVANT one first
5. If the user is continuing a conversation with an agent, keep routing to the same agent unless they explicitly change topic

RESPONSE FORMAT (strict JSON only):
{"agentId": "business-analysis", "reason": "User asked about BRD template", "prerequisites_check": ["discovery"], "greeting": "I'll connect you with our Business Analysis specialist who can help with your BRD template."}`;

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

  const contextMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: ORCHESTRATOR_SYSTEM_PROMPT },
  ];

  if (currentAgent) {
    contextMessages.push({
      role: "system",
      content: `The user is currently talking to the "${currentAgent}" agent. Only re-route if the user's message clearly indicates a different topic area.`
    });
  }

  if (keywordMatch) {
    contextMessages.push({
      role: "system",
      content: `Keyword analysis suggests the "${keywordMatch.id}" agent might be relevant. Consider this but make your own judgment.`
    });
  }

  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    contextMessages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content.substring(0, 200),
    });
  }

  contextMessages.push({ role: "user", content: userMessage });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: contextMessages,
      max_completion_tokens: 256,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const agentId = parsed.agentId || currentAgent || "discovery";
    const agent = getAgentById(agentId) || MERCURY_AGENTS[0];

    return {
      agentId: agent.id,
      agent,
      reason: parsed.reason || "Routed to default agent",
      prerequisitesCheck: parsed.prerequisites_check || [],
      greeting: parsed.greeting || `Connecting you with the ${agent.name} specialist.`,
    };
  } catch (error) {
    console.error("Orchestrator routing error:", error);
    const fallback = keywordMatch || getAgentById(currentAgent || "") || MERCURY_AGENTS[0];
    return {
      agentId: fallback.id,
      agent: fallback,
      reason: "Fallback routing",
      prerequisitesCheck: [],
      greeting: `Connecting you with the ${fallback.name} specialist.`,
    };
  }
}

export async function* generateAgentResponse(
  agent: AgentDefinition,
  userMessage: string,
  conversationHistory: { role: string; content: string }[],
  prerequisiteWarning?: string
): AsyncGenerator<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${agent.systemPrompt}

FORMATTING GUIDELINES:
- Use markdown formatting for structure (headers, bold, lists)
- When providing templates, format them clearly with sections and placeholders
- Be conversational but professional
- Ask follow-up questions to gather context
- Reference other Mercury phases when relevant
- Keep responses focused and actionable

${prerequisiteWarning ? `\nIMPORTANT NOTE: ${prerequisiteWarning}` : ""}`
    },
  ];

  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: userMessage });

  const stream = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages,
    stream: true,
    max_completion_tokens: 8192,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      yield content;
    }
  }
}
