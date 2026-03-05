# Copilot Studio SSO Integration Guide for Mercury Copilot

This guide walks through setting up Single Sign-On (SSO) between your Mercury Copilot web application (hosted on Azure App Service) and Microsoft Copilot Studio chatbots, so users authenticate once and their identity flows seamlessly to the Copilot bots.

---

## Architecture Overview

```
User Browser
    |
    v
Mercury Copilot (Azure Web App)
    |  (1) User signs in via Microsoft Entra ID (Azure AD)
    |  (2) App receives access token + ID token
    |  (3) When user needs specialist help, app calls Copilot Studio bot
    |  (4) Passes user's token to bot via Direct Line + token exchange
    v
Microsoft Copilot Studio Bot
    |  (5) Bot validates token via SSO token exchange
    |  (6) Bot responds with specialist knowledge
    v
Response streamed back to user
```

**Key Components:**
- **Microsoft Entra ID (Azure AD)** - Identity provider for SSO
- **Mercury Copilot App Registration** - Your web app's identity in Entra ID
- **Copilot Studio Bot** - Each registered bot with SSO enabled
- **Direct Line API** - Communication channel between your app and Copilot Studio

---

## Prerequisites

Before starting, ensure you have:
- An Azure subscription with admin access
- Microsoft Copilot Studio license (per-user or tenant-level)
- Azure App Service running Mercury Copilot
- Azure SQL Database connected and working
- Access to the Microsoft Entra admin centre (entra.microsoft.com)

---

## Step 1: Register Mercury Copilot in Microsoft Entra ID

### 1.1 Create the App Registration

1. Go to **Microsoft Entra admin centre** → **Applications** → **App registrations**
2. Click **New registration**
3. Configure:
   - **Name**: `Mercury Copilot`
   - **Supported account types**: "Accounts in this organizational directory only" (Single tenant)
   - **Redirect URI**: Select "Web" and enter:
     ```
     https://your-app-name.azurewebsites.net/api/auth/callback
     ```
4. Click **Register**
5. Note down:
   - **Application (client) ID** → you will set this as `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → you will set this as `AZURE_TENANT_ID`

### 1.2 Create a Client Secret

1. In the app registration, go to **Certificates & secrets** → **Client secrets**
2. Click **New client secret**
3. Add a description: `Mercury Copilot Secret`
4. Set expiry (recommended: 12 months)
5. Click **Add**
6. **Copy the secret value immediately** → you will set this as `AZURE_CLIENT_SECRET`

### 1.3 Configure API Permissions

1. Go to **API permissions** → **Add a permission**
2. Add the following **Microsoft Graph** delegated permissions:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
3. Click **Grant admin consent** for your organisation

### 1.4 Expose an API (for SSO token exchange)

This is required so Copilot Studio can exchange tokens with your app.

1. Go to **Expose an API**
2. Click **Set** next to "Application ID URI" and accept the default:
   ```
   api://<your-client-id>
   ```
3. Click **Add a scope**:
   - **Scope name**: `access_as_user`
   - **Who can consent**: Admins and users
   - **Admin consent display name**: "Access Mercury Copilot as a user"
   - **Admin consent description**: "Allows Copilot Studio bots to access Mercury Copilot on behalf of the signed-in user"
   - **State**: Enabled
4. Note the full scope URI:
   ```
   api://<your-client-id>/access_as_user
   ```

### 1.5 Add Copilot Studio as an Authorised Client

Still in **Expose an API**:

1. Click **Add a client application**
2. Enter the Copilot Studio client ID:
   ```
   ab3be6b7-f5df-413d-ac2d-abf1e3fd9c0b
   ```
   (This is Microsoft's well-known Copilot Studio application ID)
3. Tick the checkbox for your `access_as_user` scope
4. Click **Add application**

---

## Step 2: Configure Copilot Studio Bot for SSO

### 2.1 Enable SSO in Copilot Studio

1. Go to **Copilot Studio** (copilotstudio.microsoft.com)
2. Open your bot (or create a new one for a specific Mercury phase)
3. Go to **Settings** → **Security** → **Authentication**
4. Select **Authenticate with Microsoft**
5. Configure:
   - **Service provider**: Azure Active Directory v2
   - **Client ID**: Use the **same** Application (client) ID from Step 1.1
   - **Client secret**: Use the **same** secret from Step 1.2
   - **Tenant ID**: Your directory (tenant) ID
   - **Scopes**: `openid profile email`
   - **Token exchange URL (SSO)**: 
     ```
     api://<your-client-id>/access_as_user
     ```
6. Save the configuration

### 2.2 Publish the Bot and Get Direct Line Details

1. Go to **Settings** → **Channels** → **Direct Line**
2. Enable the Direct Line channel
3. Note down:
   - **Direct Line secret** (you will use this as the bot's `botSecret` in Mercury Copilot admin panel)
4. Also note the **Bot ID** from the bot's overview page
5. **Publish** the bot

### 2.3 Register the Bot in Mercury Copilot Admin Panel

1. Open Mercury Copilot → go to `/admin`
2. Click **Add Bot**
3. Fill in:
   - **Name**: e.g. "Discovery Business Analyst"
   - **Phase**: Discovery
   - **Skill Role**: Business Analyst
   - **Bot Endpoint**: 
     ```
     https://directline.botframework.com/v3/directline
     ```
   - **Bot Secret**: The Direct Line secret from Step 2.2
4. Save and ensure it shows as "Active"

---

## Step 3: Set Azure App Service Environment Variables

In your Azure Web App → **Configuration** → **Application settings**, add:

| Setting | Value |
|---------|-------|
| `AZURE_CLIENT_ID` | Application (client) ID from Step 1.1 |
| `AZURE_CLIENT_SECRET` | Client secret value from Step 1.2 |
| `AZURE_TENANT_ID` | Directory (tenant) ID from Step 1.1 |
| `AZURE_REDIRECT_URI` | `https://your-app-name.azurewebsites.net/api/auth/callback` |
| `AZURE_SQL_CONNECTION_STRING` | (already set) |
| `SESSION_SECRET` | (already set) |
| `OPENAI_API_KEY` | (already set) |

Save and restart the Web App.

---

## Step 4: Implement Authentication in Mercury Copilot Backend

### 4.1 Install Required Packages

Add these dependencies to the project:

```bash
npm install @azure/msal-node
```

### 4.2 Create Authentication Configuration

Create `server/auth.ts`:

```typescript
import { ConfidentialClientApplication } from "@azure/msal-node";

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET!,
  },
};

export const msalClient = new ConfidentialClientApplication(msalConfig);

export const SCOPES = ["openid", "profile", "email", "User.Read"];

export const REDIRECT_URI =
  process.env.AZURE_REDIRECT_URI ||
  "http://localhost:5000/api/auth/callback";
```

### 4.3 Add Authentication Routes

Add these routes in `server/routes.ts`:

```typescript
import { msalClient, SCOPES, REDIRECT_URI } from "./auth";

// Login - redirects user to Microsoft sign-in
app.get("/api/auth/login", async (req, res) => {
  try {
    const authUrl = await msalClient.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      prompt: "select_account",
    });
    res.redirect(authUrl);
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Failed to initiate login" });
  }
});

// Callback - handles the redirect from Microsoft
app.get("/api/auth/callback", async (req, res) => {
  try {
    const tokenResponse = await msalClient.acquireTokenByCode({
      code: req.query.code as string,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
    });

    // Store user info and tokens in session
    (req.session as any).user = {
      name: tokenResponse.account?.name,
      email: tokenResponse.account?.username,
      oid: tokenResponse.account?.homeAccountId,
    };
    (req.session as any).accessToken = tokenResponse.accessToken;
    (req.session as any).idToken = tokenResponse.idToken;

    // Redirect to the app
    res.redirect("/");
  } catch (error) {
    console.error("Callback error:", error);
    res.redirect("/?error=auth_failed");
  }
});

// Get current user info
app.get("/api/auth/me", (req, res) => {
  const user = (req.session as any)?.user;
  if (user) {
    res.json({ authenticated: true, user });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});
```

### 4.4 Add Authentication Middleware

Create middleware to protect API routes:

```typescript
// Add in server/routes.ts or a separate middleware file

function requireAuth(req: any, res: any, next: any) {
  if ((req.session as any)?.user) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

// Protect conversation routes
app.use("/api/conversations", requireAuth);
app.use("/api/admin", requireAuth);
```

---

## Step 5: Implement Direct Line Token Exchange (SSO to Copilot Bot)

### 5.1 Create the Bot Connector Service

Create `server/bot-connector.ts`:

```typescript
import { msalClient } from "./auth";

interface DirectLineToken {
  token: string;
  conversationId: string;
}

// Step A: Get a Direct Line token for a specific bot
export async function getDirectLineToken(
  botSecret: string
): Promise<DirectLineToken> {
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

// Step B: Exchange the user's AAD token for a bot-scoped token
export async function exchangeTokenForBot(
  userAccessToken: string,
  botClientId: string
): Promise<string> {
  const result = await msalClient.acquireTokenOnBehalfOf({
    oboAssertion: userAccessToken,
    scopes: [`api://${botClientId}/access_as_user`],
  });

  if (!result?.accessToken) {
    throw new Error("Token exchange failed");
  }

  return result.accessToken;
}

// Step C: Send a message to a Copilot Studio bot via Direct Line
export async function sendMessageToBot(
  directLineToken: string,
  conversationId: string,
  message: string,
  userToken?: string
): Promise<string> {
  // Start or continue conversation
  const convUrl = conversationId
    ? `https://directline.botframework.com/v3/directline/conversations/${conversationId}`
    : "https://directline.botframework.com/v3/directline/conversations";

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

  // Send the user's message with their token for SSO
  const activity: any = {
    type: "message",
    from: { id: "mercury-copilot-user" },
    text: message,
  };

  // Attach the user's Azure AD token for SSO token exchange
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

  // Poll for bot response
  const botResponse = await pollBotResponse(directLineToken, convId);
  return botResponse;
}

// Poll Direct Line for the bot's reply
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
```

### 5.2 Add Bot Forwarding Route

Add this route in `server/routes.ts` to allow the frontend to call a Copilot bot directly:

```typescript
import {
  getDirectLineToken,
  sendMessageToBot,
} from "./bot-connector";

// Forward a message to a specific Copilot Studio bot
app.post("/api/bots/:botId/message", requireAuth, async (req, res) => {
  try {
    const botId = parseInt(req.params.botId);
    const { message } = req.body;

    const bot = await storage.getCopilotBot(botId);
    if (!bot || !bot.isActive) {
      return res.status(404).json({ error: "Bot not found or inactive" });
    }

    if (!bot.botSecret) {
      return res
        .status(400)
        .json({ error: "Bot Direct Line secret not configured" });
    }

    // Get Direct Line token
    const dlToken = await getDirectLineToken(bot.botSecret);

    // Get user's access token from session for SSO
    const userToken = (req.session as any)?.accessToken;

    // Send message to bot with user's token
    const botResponse = await sendMessageToBot(
      dlToken.token,
      "",
      message,
      userToken
    );

    res.json({
      response: botResponse,
      botName: bot.name,
      skillRole: bot.skillRole,
    });
  } catch (error) {
    console.error("Error calling Copilot bot:", error);
    res.status(500).json({ error: "Failed to communicate with bot" });
  }
});
```

---

## Step 6: Update the Frontend for SSO

### 6.1 Add Authentication State Management

Create a hook `client/src/hooks/use-auth.ts`:

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface AuthUser {
  name: string;
  email: string;
}

interface AuthState {
  authenticated: boolean;
  user?: AuthUser;
}

export function useAuth() {
  const { data, isLoading } = useQuery<AuthState>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/";
    },
  });

  return {
    user: data?.user,
    isAuthenticated: data?.authenticated ?? false,
    isLoading,
    login: () => {
      window.location.href = "/api/auth/login";
    },
    logout: () => logout.mutate(),
  };
}
```

### 6.2 Add Login UI

In your main layout or welcome screen, add a login button for unauthenticated users:

```tsx
const { user, isAuthenticated, login, logout } = useAuth();

// In the sidebar header or top bar:
{isAuthenticated ? (
  <div className="flex items-center gap-2">
    <span className="text-sm">{user?.name}</span>
    <Button variant="ghost" size="sm" onClick={logout}>
      Sign out
    </Button>
  </div>
) : (
  <Button onClick={login}>
    Sign in with Microsoft
  </Button>
)}
```

### 6.3 Add "Ask Specialist" Button

In the chat interface, when the AI mentions a specialist bot is available, show a button to connect directly:

```tsx
// In the message component, when specialist bots are available:
<Button
  variant="outline"
  onClick={() => callSpecialistBot(bot.id, currentMessage)}
  data-testid={`button-ask-specialist-${bot.id}`}
>
  Ask {bot.name} ({bot.skillRole})
</Button>
```

---

## Step 7: Session Configuration for Production

Update your Express session configuration for Azure:

```typescript
// In server/index.ts, update session config:
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
    },
  })
);
```

---

## Step 8: Testing the SSO Flow

### 8.1 Local Testing

1. Set the environment variables locally:
   ```
   AZURE_CLIENT_ID=<your-client-id>
   AZURE_CLIENT_SECRET=<your-client-secret>
   AZURE_TENANT_ID=<your-tenant-id>
   AZURE_REDIRECT_URI=http://localhost:5000/api/auth/callback
   ```
2. Add `http://localhost:5000/api/auth/callback` as an additional redirect URI in your Entra app registration
3. Start the app and navigate to the login page
4. Sign in with your Microsoft account
5. Verify the session persists (check `/api/auth/me`)

### 8.2 End-to-End SSO Test

1. Sign into Mercury Copilot
2. Start a conversation about a topic matching a phase with a registered bot
3. When the AI mentions a specialist bot, click to connect
4. Verify the bot receives the message and responds
5. Confirm no additional login prompt appears (SSO working)

### 8.3 Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "AADSTS50011: Reply URL mismatch" | Redirect URI doesn't match | Ensure exact URL match in Entra app registration |
| "AADSTS700016: Application not found" | Wrong client ID | Verify `AZURE_CLIENT_ID` matches app registration |
| "Token exchange failed" | OBO flow not configured | Check "Expose an API" and authorised clients in Step 1.4-1.5 |
| "Login failed" for bot | Bot auth not configured | Verify bot authentication settings in Copilot Studio (Step 2.1) |
| "CORS error" on login redirect | Missing redirect URI | Add your domain to the app registration redirect URIs |
| Bot doesn't respond | Direct Line secret invalid | Regenerate the Direct Line secret in Copilot Studio |

---

## Step 9: Security Considerations

1. **Token Storage**: Access tokens are stored in server-side sessions only, never exposed to the frontend
2. **Token Refresh**: MSAL Node handles token caching and refresh automatically
3. **Secret Rotation**: Set a reminder to rotate `AZURE_CLIENT_SECRET` before it expires
4. **Role-Based Access**: Consider adding app roles in Entra ID to restrict admin panel access:
   - Create roles: `Admin`, `User` in the app registration manifest
   - Check role claims in the `requireAuth` middleware
5. **Bot Secret Encryption**: The `botSecret` field in the database should ideally be encrypted at rest (Azure SQL TDE handles this)

---

## Summary of Environment Variables

| Variable | Where to Set | Purpose |
|----------|-------------|---------|
| `AZURE_CLIENT_ID` | Azure App Service + Replit | Entra ID app client ID |
| `AZURE_CLIENT_SECRET` | Azure App Service + Replit | Entra ID app secret |
| `AZURE_TENANT_ID` | Azure App Service + Replit | Entra ID tenant ID |
| `AZURE_REDIRECT_URI` | Azure App Service + Replit | OAuth callback URL |
| `AZURE_SQL_CONNECTION_STRING` | Azure App Service only | Database connection |
| `SESSION_SECRET` | Both | Express session encryption |
| `OPENAI_API_KEY` | Both | AI orchestrator |

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `server/auth.ts` | Create | MSAL configuration and client |
| `server/bot-connector.ts` | Create | Direct Line + SSO token exchange |
| `server/routes.ts` | Modify | Add auth routes + bot forwarding |
| `client/src/hooks/use-auth.ts` | Create | Frontend auth state management |
| `client/src/components/chat-sidebar.tsx` | Modify | Add user info + sign out |
| `client/src/components/welcome-screen.tsx` | Modify | Add sign-in prompt |

---

## Next Steps After SSO is Working

1. **Role-based admin access** - Only users with "Admin" role can access `/admin`
2. **Per-user conversation history** - Filter conversations by authenticated user
3. **Audit logging** - Log which user called which bot and when
4. **Multi-bot routing** - Automatically forward to the correct specialist bot without user clicking
5. **Bot response integration** - Stream bot responses inline in the Mercury Copilot chat rather than a separate call
