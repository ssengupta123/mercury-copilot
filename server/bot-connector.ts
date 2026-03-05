import { getMsalClient } from "./auth";

interface DirectLineToken {
  token: string;
  conversationId: string;
}

export async function getDirectLineToken(botSecret: string): Promise<DirectLineToken> {
  const response = await fetch(
    "https://directline.botframework.com/v3/directline/tokens/generate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${botSecret}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get Direct Line token: ${response.statusText}`);
  }

  return response.json();
}

export async function exchangeTokenForBot(
  userAccessToken: string,
  botClientId: string
): Promise<string> {
  const msalClient = getMsalClient();
  const result = await msalClient.acquireTokenOnBehalfOf({
    oboAssertion: userAccessToken,
    scopes: [`api://${botClientId}/access_as_user`],
  });

  if (!result?.accessToken) {
    throw new Error("Token exchange failed");
  }

  return result.accessToken;
}

export async function sendMessageToBot(
  directLineToken: string,
  conversationId: string,
  message: string,
  userToken?: string
): Promise<string> {
  let convId = conversationId;

  if (!convId) {
    const startResp = await fetch(
      "https://directline.botframework.com/v3/directline/conversations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${directLineToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const convData = await startResp.json();
    convId = convData.conversationId;
  }

  const activity: any = {
    type: "message",
    from: { id: "mercury-copilot-user" },
    text: message,
  };

  if (userToken) {
    activity.channelData = {
      authToken: userToken,
    };
  }

  const sendResp = await fetch(
    `https://directline.botframework.com/v3/directline/conversations/${convId}/activities`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${directLineToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activity),
    }
  );

  if (!sendResp.ok) {
    throw new Error(`Failed to send message: ${sendResp.statusText}`);
  }

  const botResponse = await pollBotResponse(directLineToken, convId);
  return botResponse;
}

async function pollBotResponse(
  token: string,
  conversationId: string,
  maxAttempts = 15
): Promise<string> {
  let watermark = "";

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const url = `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities${
      watermark ? `?watermark=${watermark}` : ""
    }`;

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await resp.json();
    watermark = data.watermark || watermark;

    const botMessages = data.activities?.filter(
      (a: any) => a.from.id !== "mercury-copilot-user" && a.type === "message"
    );

    if (botMessages?.length > 0) {
      return botMessages[botMessages.length - 1].text;
    }
  }

  return "The specialist bot did not respond in time. Please try again.";
}
