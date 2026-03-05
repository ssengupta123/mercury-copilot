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

export function getRedirectUri(): string {
  return process.env.AZURE_REDIRECT_URI || "http://localhost:5000/api/auth/callback";
}
