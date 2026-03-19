const DIRECTLINE_BASE = "https://directline.botframework.com/v3/directline";

interface DirectLineTokenResponse {
  token: string;
  expires_in: number;
  conversationId: string;
}

interface DirectLineConversation {
  conversationId: string;
  token: string;
}

async function getDirectLineToken(botEndpoint: string): Promise<DirectLineTokenResponse> {
  const response = await fetch(botEndpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get DirectLine token: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<DirectLineTokenResponse>;
}

async function startDirectLineConversation(token: string): Promise<DirectLineConversation> {
  const response = await fetch(`${DIRECTLINE_BASE}/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to start DirectLine conversation: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    conversationId: data.conversationId,
    token: data.token || token,
  };
}

const USER_ID = "mercury-copilot-user";

async function sendDirectLineActivity(
  conversationId: string,
  token: string,
  message: string
): Promise<string> {
  const response = await fetch(
    `${DIRECTLINE_BASE}/conversations/${conversationId}/activities`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "message",
        from: { id: USER_ID, name: "User" },
        text: message,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send activity: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.id || "";
}

async function pollDirectLineActivities(
  conversationId: string,
  token: string,
  sentActivityId: string,
  maxAttempts = 30
): Promise<string> {
  let watermark: string | undefined;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const url = watermark
      ? `${DIRECTLINE_BASE}/conversations/${conversationId}/activities?watermark=${watermark}`
      : `${DIRECTLINE_BASE}/conversations/${conversationId}/activities`;

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!resp.ok) continue;

    const data = await resp.json();
    watermark = data.watermark;
    const activities = data.activities || [];

    if (i === 0) {
      console.log(`[bot-connector] Poll ${i}: ${activities.length} activities, sentId=${sentActivityId}`);
      for (const a of activities) {
        console.log(`[bot-connector]   activity id=${a.id} type=${a.type} from.id=${a.from?.id} from.role=${a.from?.role} text=${(a.text || "").substring(0, 60)}`);
      }
    }

    const botMessages = activities.filter(
      (a: any) =>
        a.type === "message" &&
        a.from?.id !== USER_ID &&
        a.id !== sentActivityId
    );

    if (botMessages.length > 0) {
      const lastMessage = botMessages[botMessages.length - 1];
      console.log(`[bot-connector] Bot message from: ${lastMessage.from?.id}, role: ${lastMessage.from?.role}`);
      const text = lastMessage.text || "";
      const attachmentText = (lastMessage.attachments || [])
        .map((att: any) => {
          if (att.contentType === "application/vnd.microsoft.card.adaptive" && att.content?.body) {
            return att.content.body
              .filter((b: any) => b.type === "TextBlock")
              .map((b: any) => b.text)
              .join("\n");
          }
          if (att.contentType === "text/plain") return att.content;
          return "";
        })
        .filter(Boolean)
        .join("\n");

      const fullText = [text, attachmentText].filter(Boolean).join("\n\n");
      if (fullText.trim()) {
        const knownError = parseCopilotError(fullText);
        if (knownError) {
          console.warn(`[bot-connector] Copilot Studio error detected: ${knownError.code}`);
          return knownError.userMessage;
        }
        return fullText;
      }
    }
  }

  return "The specialist bot did not respond in time. Please try again.";
}

function parseCopilotError(text: string): { code: string; userMessage: string } | null {
  if (text.includes("IntegratedAuthenticationNotSupportedInChannel")) {
    return {
      code: "IntegratedAuthenticationNotSupportedInChannel",
      userMessage: "This Copilot Studio bot requires authentication to be disabled or set to \"No authentication\" for the DirectLine channel. Please update the bot's authentication settings in Copilot Studio (Settings → Security → Authentication → select \"No authentication\"), then try again.",
    };
  }
  if (text.includes("EnableS2SAuthFeature")) {
    return {
      code: "EnableS2SAuthFeature",
      userMessage: "Server-to-server authentication is not enabled for this Copilot Studio environment. Please enable it in Power Platform Admin Center (Environments → Settings → Features → enable S2S auth), then try again.",
    };
  }
  if (text.includes("BotNotFound") || text.includes("ResourceNotFound")) {
    return {
      code: "BotNotFound",
      userMessage: "The configured Copilot Studio bot could not be found. Please verify the bot endpoint URL in the admin panel is correct and that the bot is published.",
    };
  }
  return null;
}

export async function callCopilotBot(
  botEndpoint: string,
  message: string,
  _userAccessToken?: string
): Promise<string> {
  console.log(`[bot-connector] Calling Copilot bot at: ${botEndpoint.substring(0, 80)}...`);

  const tokenData = await getDirectLineToken(botEndpoint);
  console.log(`[bot-connector] Got DirectLine token, conversationId: ${tokenData.conversationId}`);

  const conversation = await startDirectLineConversation(tokenData.token);
  console.log(`[bot-connector] Started conversation: ${conversation.conversationId}`);

  const sentActivityId = await sendDirectLineActivity(conversation.conversationId, conversation.token, message);
  console.log(`[bot-connector] Sent message (activityId: ${sentActivityId}), polling for response...`);

  const response = await pollDirectLineActivities(conversation.conversationId, conversation.token, sentActivityId);
  console.log(`[bot-connector] Got response (${response.length} chars)`);

  return response;
}
