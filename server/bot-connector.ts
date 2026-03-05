import { getMsalClient } from "./auth";

interface CopilotConversation {
  conversationId: string;
}

export async function getAccessTokenForCopilot(
  userAccessToken: string
): Promise<string> {
  try {
    const msalClient = getMsalClient();
    const result = await msalClient.acquireTokenOnBehalfOf({
      oboAssertion: userAccessToken,
      scopes: ["https://api.powerplatform.com/.default"],
    });
    if (!result?.accessToken) {
      throw new Error("OBO token exchange failed");
    }
    return result.accessToken;
  } catch (error) {
    console.error("Token exchange error:", error);
    throw error;
  }
}

export async function startCopilotConversation(
  botEndpoint: string,
  accessToken: string
): Promise<CopilotConversation> {
  const response = await fetch(botEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to start conversation: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return { conversationId: data.conversationId };
}

export async function sendMessageToBot(
  botEndpoint: string,
  conversationId: string,
  message: string,
  accessToken: string
): Promise<string> {
  const activitiesUrl = `${botEndpoint}/${conversationId}/activities`;

  const activity = {
    type: "message",
    text: message,
  };

  const sendResp = await fetch(activitiesUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(activity),
  });

  if (!sendResp.ok) {
    const errorText = await sendResp.text();
    throw new Error(`Failed to send message: ${sendResp.status} ${errorText}`);
  }

  const botResponse = await pollCopilotResponse(botEndpoint, conversationId, accessToken);
  return botResponse;
}

async function pollCopilotResponse(
  botEndpoint: string,
  conversationId: string,
  accessToken: string,
  maxAttempts = 20
): Promise<string> {
  const activitiesUrl = `${botEndpoint}/${conversationId}/activities`;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const resp = await fetch(activitiesUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) continue;

    const data = await resp.json();
    const activities = data.activities || data.value || [];

    const botMessages = activities.filter(
      (a: any) => a.type === "message" && a.from?.role === "bot"
    );

    if (botMessages.length > 0) {
      const lastMessage = botMessages[botMessages.length - 1];
      return lastMessage.text || lastMessage.content || "Bot responded without text content.";
    }
  }

  return "The specialist bot did not respond in time. Please try again.";
}

export async function callCopilotBot(
  botEndpoint: string,
  message: string,
  userAccessToken?: string
): Promise<string> {
  let accessToken: string;

  if (userAccessToken) {
    accessToken = await getAccessTokenForCopilot(userAccessToken);
  } else {
    throw new Error("User must be authenticated to call Copilot Studio bots");
  }

  const conversation = await startCopilotConversation(botEndpoint, accessToken);
  const response = await sendMessageToBot(
    botEndpoint,
    conversation.conversationId,
    message,
    accessToken
  );

  return response;
}
