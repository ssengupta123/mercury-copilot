import { ConfidentialClientApplication } from "@azure/msal-node";

let _msalClient: ConfidentialClientApplication | null = null;

export function getMsalClient(): ConfidentialClientApplication {
  if (!_msalClient) {
    if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_SECRET) {
      throw new Error("Azure AD environment variables (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET) must be set for SSO.");
    }
    _msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
      },
    });
  }
  return _msalClient;
}

export const SCOPES = ["openid", "profile", "email", "User.Read"];

export const POWERPLATFORM_SCOPE = "https://api.powerplatform.com/.default";

export function getRedirectUri(): string {
  return process.env.AZURE_REDIRECT_URI || "http://localhost:5000/api/auth/callback";
}

export async function acquirePowerPlatformToken(userAccountId: string): Promise<string | null> {
  try {
    const client = getMsalClient();
    const accounts = await client.getTokenCache().getAllAccounts();
    const account = accounts.find(a => a.homeAccountId === userAccountId);
    if (!account) {
      console.warn("[auth] No cached account found for Power Platform token acquisition");
      return null;
    }
    const result = await client.acquireTokenSilent({
      scopes: [POWERPLATFORM_SCOPE],
      account,
    });
    return result?.accessToken || null;
  } catch (error) {
    console.warn("[auth] Failed to acquire Power Platform token silently:", error);
    return null;
  }
}

export async function acquirePowerPlatformTokenViaClientCredentials(): Promise<string | null> {
  try {
    const client = getMsalClient();
    const result = await client.acquireTokenByClientCredential({
      scopes: [POWERPLATFORM_SCOPE],
    });
    return result?.accessToken || null;
  } catch (error) {
    console.warn("[auth] Failed to acquire Power Platform token via client credentials:", error);
    return null;
  }
}
