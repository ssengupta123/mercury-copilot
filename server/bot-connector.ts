const DIRECTLINE_BASE = "https://directline.botframework.com/v3/directline";

interface DirectLineConversation {
  conversationId: string;
  token: string;
}

const USER_ID = "mercury-copilot-user";

function isCopilotStudioDTE(endpoint: string): boolean {
  return endpoint.includes("/copilotstudio/") || endpoint.includes("/conversations?api-version=");
}

function deriveDLTokenUrl(dteEndpoint: string): string | null {
  const botIdMatch = dteEndpoint.match(/\/bots\/([^/]+)\//);
  const baseMatch = dteEndpoint.match(/^(https:\/\/[^/]+)/);
  const apiVersionMatch = dteEndpoint.match(/api-version=([^&]+)/);
  if (!botIdMatch || !baseMatch) return null;
  const apiVersion = apiVersionMatch ? apiVersionMatch[1] : "2022-03-01-preview";
  return `${baseMatch[1]}/powervirtualagents/botsbyschema/${botIdMatch[1]}/directline/token?api-version=${apiVersion}`;
}

async function callViaCopilotStudioDTE(endpoint: string, message: string, accessToken?: string): Promise<string> {
  console.log(`[bot-connector] Using Copilot Studio Conversations API (DTE), hasToken=${!!accessToken}...`);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const convResp = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });

  if (!convResp.ok) {
    const errorText = await convResp.text();
    throw new Error(`Failed to start DTE conversation: ${convResp.status} ${errorText}`);
  }

  const convData = await convResp.json();
  const conversationId = convData.conversationId;
  console.log(`[bot-connector] DTE conversation started: ${conversationId}`);

  const baseUrl = endpoint.split("/conversations")[0];
  const apiVersionMatch = endpoint.match(/api-version=([^&]+)/);
  const apiVersion = apiVersionMatch ? apiVersionMatch[1] : "2022-03-01-preview";

  const activityUrl = `${baseUrl}/conversations/${conversationId}/activities?api-version=${apiVersion}`;

  const actHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) {
    actHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  const actResp = await fetch(activityUrl, {
    method: "POST",
    headers: actHeaders,
    body: JSON.stringify({
      type: "message",
      text: message,
    }),
  });

  if (!actResp.ok) {
    const errorText = await actResp.text();
    throw new Error(`Failed to send DTE activity: ${actResp.status} ${errorText}`);
  }

  const actData = await actResp.json();
  console.log(`[bot-connector] DTE activity response received`);

  if (actData.activities && Array.isArray(actData.activities)) {
    const botMessages = actData.activities.filter(
      (a: any) => a.type === "message" && a.from?.role === "bot"
    );
    if (botMessages.length > 0) {
      const lastMsg = botMessages[botMessages.length - 1];
      return extractTextFromActivity(lastMsg);
    }
  }

  if (actData.type === "message" && actData.text) {
    return actData.text;
  }

  const pollUrl = `${baseUrl}/conversations/${conversationId}/activities?api-version=${apiVersion}`;
  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pollHeaders: Record<string, string> = { Accept: "application/json" };
    if (accessToken) {
      pollHeaders["Authorization"] = `Bearer ${accessToken}`;
    }

    const pollResp = await fetch(pollUrl, {
      method: "GET",
      headers: pollHeaders,
    });

    if (!pollResp.ok) continue;

    const pollData = await pollResp.json();
    const activities = pollData.activities || [];
    const botMessages = activities.filter(
      (a: any) => a.type === "message" && a.from?.role === "bot"
    );

    if (botMessages.length > 0) {
      const lastMsg = botMessages[botMessages.length - 1];
      console.log(`[bot-connector] DTE poll ${i}: got bot response`);
      return extractTextFromActivity(lastMsg);
    }
  }

  return "The specialist bot did not respond in time. Please try again.";
}

function extractTextFromActivity(activity: any): string {
  const text = activity.text || "";
  const attachmentText = (activity.attachments || [])
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
    if (knownError && knownError.userMessage) {
      return knownError.userMessage;
    }
  }
  return fullText || "The specialist bot returned an empty response.";
}

async function startConversationWithSecret(secret: string): Promise<DirectLineConversation> {
  console.log(`[bot-connector] Starting conversation with Direct Line secret...`);
  const response = await fetch(`${DIRECTLINE_BASE}/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to start DirectLine conversation with secret: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    conversationId: data.conversationId,
    token: data.token || secret,
  };
}

async function startConversationWithTokenEndpoint(botEndpoint: string): Promise<DirectLineConversation> {
  console.log(`[bot-connector] Getting token from endpoint...`);
  const tokenResp = await fetch(botEndpoint, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!tokenResp.ok) {
    const errorText = await tokenResp.text();
    throw new Error(`Failed to get DirectLine token: ${tokenResp.status} ${errorText}`);
  }

  const tokenData = await tokenResp.json();
  console.log(`[bot-connector] Got token, starting conversation...`);

  const convResp = await fetch(`${DIRECTLINE_BASE}/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.token}`,
      "Content-Type": "application/json",
    },
  });

  if (!convResp.ok) {
    const errorText = await convResp.text();
    throw new Error(`Failed to start DirectLine conversation: ${convResp.status} ${errorText}`);
  }

  const data = await convResp.json();
  return {
    conversationId: data.conversationId,
    token: data.token || tokenData.token,
  };
}

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
        console.log(`[bot-connector]   activity id=${a.id} type=${a.type} from.id=${a.from?.id} from.role=${a.from?.role} text=${(a.text || "").substring(0, 80)}`);
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
      return extractTextFromActivity(lastMessage);
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
  if (text.includes("usage limit") || text.includes("currently unavailable")) {
    return {
      code: "UsageLimitReached",
      userMessage: "",
    };
  }
  return null;
}

export async function callCopilotBot(
  botEndpoint: string,
  message: string,
  userAccessToken?: string,
  botSecret?: string | null
): Promise<string> {
  console.log(`[bot-connector] Calling Copilot bot, hasSecret=${!!botSecret}, hasToken=${!!userAccessToken}, endpoint=${botEndpoint.substring(0, 80)}...`);

  if (isCopilotStudioDTE(botEndpoint)) {
    try {
      return await callViaCopilotStudioDTE(botEndpoint, message, userAccessToken);
    } catch (dteError: any) {
      const errMsg = dteError?.message || "";
      const isAuthError = errMsg.includes("401") || errMsg.includes("403");
      if (isAuthError) {
        if (botSecret) {
          console.warn(`[bot-connector] DTE auth failed, falling back to DirectLine with secret...`);
          const conversation = await startConversationWithSecret(botSecret);
          console.log(`[bot-connector] DirectLine fallback conversation started: ${conversation.conversationId}`);
          const sentActivityId = await sendDirectLineActivity(conversation.conversationId, conversation.token, message);
          console.log(`[bot-connector] Sent message (activityId: ${sentActivityId}), polling for response...`);
          const response = await pollDirectLineActivities(conversation.conversationId, conversation.token, sentActivityId);
          console.log(`[bot-connector] Got response (${response.length} chars)`);
          return response;
        }
        const dlTokenUrl = deriveDLTokenUrl(botEndpoint);
        if (dlTokenUrl) {
          console.warn(`[bot-connector] DTE auth failed, falling back to DirectLine token endpoint...`);
          const conversation = await startConversationWithTokenEndpoint(dlTokenUrl);
          console.log(`[bot-connector] DirectLine fallback conversation started: ${conversation.conversationId}`);
          const sentActivityId = await sendDirectLineActivity(conversation.conversationId, conversation.token, message);
          console.log(`[bot-connector] Sent message (activityId: ${sentActivityId}), polling for response...`);
          const response = await pollDirectLineActivities(conversation.conversationId, conversation.token, sentActivityId);
          console.log(`[bot-connector] Got response (${response.length} chars)`);
          return response;
        }
      }
      throw dteError;
    }
  }

  let conversation: DirectLineConversation;

  if (botSecret) {
    conversation = await startConversationWithSecret(botSecret);
  } else {
    conversation = await startConversationWithTokenEndpoint(botEndpoint);
  }

  console.log(`[bot-connector] Conversation started: ${conversation.conversationId}`);

  const sentActivityId = await sendDirectLineActivity(conversation.conversationId, conversation.token, message);
  console.log(`[bot-connector] Sent message (activityId: ${sentActivityId}), polling for response...`);

  const response = await pollDirectLineActivities(conversation.conversationId, conversation.token, sentActivityId);
  console.log(`[bot-connector] Got response (${response.length} chars)`);

  return response;
}
