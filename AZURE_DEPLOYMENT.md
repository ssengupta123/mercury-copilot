# Mercury Copilot — Azure Deployment Guide

## Architecture

```
GitHub (main branch)
    ↓ push
GitHub Actions (CI/CD)
    ↓ build + deploy
Azure Web App (Node.js 20)
    ↓ connects to
Azure Database for PostgreSQL
```

## Prerequisites

1. **Azure Account** with an active subscription
2. **GitHub Repository** connected to this project
3. **Azure CLI** installed locally (optional, for setup)

## Step 1: Create Azure Resources

### Azure Database for PostgreSQL

1. Go to Azure Portal → Create a resource → Azure Database for PostgreSQL Flexible Server
2. Choose your subscription and resource group
3. Set server name, region, and admin credentials
4. Under Networking, allow Azure services to access the server
5. After creation, note the connection string:
   ```
   postgresql://<admin>:<password>@<server>.postgres.database.azure.com:5432/<database>?sslmode=require
   ```

### Azure Web App

1. Go to Azure Portal → Create a resource → Web App
2. Settings:
   - **Runtime**: Node 20 LTS
   - **OS**: Linux
   - **Region**: Same as your database
3. After creation, go to Configuration → Application settings and add:
   - `DATABASE_URL` = your PostgreSQL connection string from above
   - `DATABASE_SSL` = `true`
   - `SESSION_SECRET` = a random secure string (generate with `openssl rand -hex 32`)
   - `OPENAI_API_KEY` = your OpenAI API key (for AI features)
   - `NODE_ENV` = `production`
4. Under General settings:
   - Startup Command: `node index.cjs`

## Step 2: Configure GitHub Actions

### Get the Publish Profile

1. In Azure Portal, go to your Web App
2. Click **Get publish profile** (top toolbar) — downloads a `.publishsettings` file

### Add GitHub Secrets

1. In your GitHub repo, go to Settings → Secrets and variables → Actions
2. Add a new **repository secret**:
   - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Value: paste the entire contents of the `.publishsettings` file
3. Add a new **repository variable** (under Variables tab):
   - Name: `AZURE_WEBAPP_NAME`
   - Value: your Azure Web App name (e.g., `mercury-copilot`)

## Step 3: Initialize the Database

After creating the Azure PostgreSQL database, push the schema:

```bash
DATABASE_URL="your-azure-connection-string" DATABASE_SSL=true npm run db:push
```

Or connect to the database and run the SQL from the Drizzle migrations.

## Step 4: Deploy

Push to the `main` branch:

```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

GitHub Actions will automatically:
1. Install dependencies
2. Build the frontend (Vite) and backend (esbuild)
3. Deploy the `dist/` folder to Azure Web App

## Step 5: Verify

1. Visit `https://<your-app-name>.azurewebsites.net`
2. Check health: `https://<your-app-name>.azurewebsites.net/api/health`
3. Monitor logs in Azure Portal → Web App → Log stream

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DATABASE_SSL` | Yes (Azure) | Set to `true` for Azure PostgreSQL |
| `SESSION_SECRET` | Yes | Secret for session encryption |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Azure sets this automatically |

## Connecting Replit to GitHub

1. In Replit, click the Git icon in the left panel
2. Click "Connect to GitHub"
3. Create a new repo or connect to an existing one
4. Use the Replit Git panel to commit and push changes
5. Pushes to `main` will trigger the Azure deployment

## Troubleshooting

- **Database connection fails**: Check that `DATABASE_SSL=true` is set and the firewall allows Azure services
- **App won't start**: Check the startup command is `node index.cjs` in Azure configuration
- **Static files not served**: Ensure the build completed successfully in GitHub Actions logs
- **Health check**: Hit `/api/health` to verify the app and database are connected
