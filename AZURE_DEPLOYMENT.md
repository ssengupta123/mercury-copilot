# Mercury Copilot — Azure Deployment Guide

## Architecture

```
Replit (dev) ──→ PostgreSQL (Replit built-in)
    ↓ git push
GitHub (main branch)
    ↓ GitHub Actions
Azure Web App (Node.js 20) ──→ Azure SQL Database
```

## Prerequisites

1. **Azure Account** with an active subscription
2. **GitHub Repository** connected to this Replit project

## Step 1: Create Azure SQL Database

1. Go to Azure Portal → **Create a resource** → search **SQL Database**
2. Click **Create** and fill in:
   - **Subscription**: your subscription
   - **Resource group**: create new (e.g., `mercury-copilot-rg`)
   - **Database name**: e.g., `mercury-copilot-db`
   - **Server**: click **Create new**
     - **Server name**: e.g., `mercury-copilot-sql`
     - **Location**: pick a region close to your users
     - **Authentication**: SQL authentication
     - **Admin login**: e.g., `mercuryadmin`
     - **Password**: create a strong password — save it
   - **Compute + storage**: click Configure → choose **Basic** or **Standard S0** to start
3. Click **Next: Networking**
   - **Connectivity method**: Public endpoint
   - **Allow Azure services**: Yes
   - Optionally add your IP for direct access
4. Click **Review + Create** → **Create**
5. Once created, go to the resource → **Connection strings** → copy the **ADO.NET** string. It looks like:
   ```
   Server=tcp:mercury-copilot-sql.database.windows.net,1433;Initial Catalog=mercury-copilot-db;Persist Security Info=False;User ID=mercuryadmin;Password=YOUR_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   ```

## Step 2: Initialize the Database Tables

1. In Azure Portal, go to your SQL Database
2. Click **Query editor** in the left menu
3. Log in with your admin credentials
4. Copy and paste the contents of `scripts/azure-sql-init.sql` from this project
5. Click **Run** — this creates the conversations, messages, and copilot_bots tables

## Step 3: Create the Azure Web App

1. Go to **Create a resource** → search **Web App**
2. Fill in:
   - **Subscription**: same as above
   - **Resource group**: `mercury-copilot-rg`
   - **Name**: e.g., `mercury-copilot` (becomes `mercury-copilot.azurewebsites.net`)
   - **Runtime stack**: Node 20 LTS
   - **Operating System**: Linux
   - **Region**: same as your database
   - **Pricing plan**: Free (F1) to start, or Basic (B1) for production
3. Click **Review + Create** → **Create**

## Step 4: Configure the Web App Environment

1. Go to your Web App → **Settings → Environment variables**
2. Add these application settings:

   | Name | Value |
   |------|-------|
   | `AZURE_SQL_CONNECTION_STRING` | your Azure SQL connection string from Step 1 |
   | `SESSION_SECRET` | any random string (30+ characters) |
   | `OPENAI_API_KEY` | your OpenAI API key |
   | `NODE_ENV` | `production` |

3. Click **Apply** and confirm
4. Go to **Settings → Configuration → General settings**
   - Set **Startup Command** to: `node index.cjs`
   - Click **Save**

## Step 5: Set Up GitHub Actions Deployment

1. In your Azure Web App, click **Get publish profile** (top toolbar) — downloads a file
2. In your GitHub repo → **Settings → Secrets and variables → Actions**:
   - **New repository secret**:
     - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
     - Value: entire contents of the downloaded `.publishsettings` file
   - **New repository variable** (Variables tab):
     - Name: `AZURE_WEBAPP_NAME`
     - Value: your web app name (e.g., `mercury-copilot`)

## Step 6: Connect Replit to GitHub and Deploy

1. In Replit, click the **Git** icon in the left panel
2. Connect to your GitHub repository
3. Commit all changes and push to `main`
4. Go to **GitHub → Actions** tab — the deployment will run automatically
5. Once complete (~2-3 minutes), visit `https://your-app-name.azurewebsites.net`

## Step 7: Verify

- Visit your app URL
- Check health: `https://your-app-name.azurewebsites.net/api/health`
- Monitor logs: Azure Portal → Web App → **Log stream**

## How It Works

The app automatically detects which database to use:
- **If `AZURE_SQL_CONNECTION_STRING` is set** → uses Azure SQL (MSSQL) via the `mssql` package
- **If not set** → uses PostgreSQL via `pg` and Drizzle ORM (Replit dev environment)

This means you can develop locally on Replit with PostgreSQL and deploy to Azure with Azure SQL — no code changes needed.

## Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Replit (dev) | PostgreSQL connection string (auto-set by Replit) |
| `AZURE_SQL_CONNECTION_STRING` | Azure (prod) | Azure SQL connection string |
| `SESSION_SECRET` | Both | Secret for session encryption |
| `OPENAI_API_KEY` | Both | OpenAI API key for AI features |
| `NODE_ENV` | Azure | Set to `production` |

## Troubleshooting

- **Database connection fails**: Check the connection string and that Azure services are allowed through the firewall
- **Tables don't exist**: Run `scripts/azure-sql-init.sql` in the Azure SQL Query editor
- **App won't start**: Verify startup command is `node index.cjs`
- **Health check**: Hit `/api/health` to verify connectivity
- **Logs**: Azure Portal → Web App → Diagnose and solve problems → Application Logs
