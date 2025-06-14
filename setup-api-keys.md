# 🔑 API Key Setup Guide

Follow this guide to configure all API keys for the Web App Generator. You can copy the environment variables template at the bottom to your `.env.local` file.

## 📋 Overview

- **Required**: GitHub + Vercel (minimum to deploy apps)
- **Optional**: MongoDB Atlas, Clerk, DNS providers (unlock additional features)

---

## 🔥 **Step 1: Vercel** (Required)

**What it does**: Hosts and deploys your generated applications

1. Go to [Vercel Dashboard → Settings → Tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Token name: `Web App Generator`
4. Scope: **Full Account** (recommended) or specific scope
5. Copy the token (starts with `vercel_`)

**Environment Variables**:
```bash
VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx # Optional if using team
```

---

## 🗄️ **Step 2: MongoDB Atlas** (Optional)

**What it does**: Creates databases for your applications

1. Go to [MongoDB Atlas Organization Settings](https://cloud.mongodb.com/v2/organization/settings/api)
2. Navigate to **API Keys** tab
3. Click **"Create API Key"**
4. Set permissions: **Organization Project Creator**
5. Copy both **Public Key** and **Private Key**
6. Add your IP address to the access list
7. Get your **Organization ID** from the organization settings

**Environment Variables**:
```bash
MONGODB_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MONGODB_PRIVATE_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MONGODB_ORG_ID=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🔐 **Step 3: Clerk** (Optional)

**What it does**: Provides authentication for your applications

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click **"Create Application"** or use existing
3. Select: **"I'm building a platform"**
4. Go to **API Keys** section
5. Copy the **Secret Key** (starts with `sk_live_` or `sk_test_`)

**Environment Variables**:
```bash
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🌐 **Step 4: DNS Provider** (Optional)

Choose **ONE** of these DNS providers for custom domain management:

### Option A: Namecheap

1. Go to [Namecheap API Access](https://ap.www.namecheap.com/settings/tools/apiaccess/)
2. Enable **API Access** (may require account verification)
3. Add your server IP to **whitelist**
4. Copy **API Key** and **Username**

**Environment Variables**:
```bash
NAMECHEAP_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NAMECHEAP_USERNAME=yourusername
```

### Option B: Cloudflare

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use **"Custom token"** template
4. **Permissions**: Zone:Zone:Read, Zone:DNS:Edit
5. **Zone Resources**: Include All zones (or specific zones)
6. Copy the token

**Environment Variables**:
```bash
CLOUDFLARE_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📁 Environment Variables Template

Create a `.env.local` file in your project root and add these variables:

```bash
# Required API Keys
# GitHub Personal Access Token (already configured)
GITHUB_PAT=your_actual_github_pat
GITHUB_USERNAME=your_github_username

# Vercel API Token (required)
VERCEL_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=your_team_id_here # Optional

# Optional API Keys
# MongoDB Atlas (optional - for database features)
MONGODB_API_KEY=your_mongodb_api_key_here
MONGODB_PRIVATE_KEY=your_mongodb_private_key_here
MONGODB_ORG_ID=your_mongodb_org_id_here

# Clerk Authentication (optional - for auth features)
CLERK_SECRET_KEY=your_clerk_secret_key_here

# DNS Providers (optional - for custom domain features)
# Choose ONE of these:

# Namecheap
NAMECHEAP_API_KEY=your_namecheap_api_key_here
NAMECHEAP_USERNAME=your_namecheap_username_here

# OR Cloudflare
CLOUDFLARE_TOKEN=your_cloudflare_token_here
```

---

## ✅ **Testing Your Setup**

After adding your API keys:

1. **Restart your development server**: `npm run dev`
2. **Check the API Setup tab** in your application
3. **Green checkmarks** indicate successful configuration
4. **Red X marks** show what still needs setup

---

## 🚀 **Ready to Deploy!**

Once you have **GitHub + Vercel** configured (minimum required), you can:

1. Switch to the **"Deploy App"** tab
2. Fill out the deployment form
3. Click **"Deploy Application"**
4. Watch your app get created automatically!

---

## 🛟 **Troubleshooting**

### Common Issues:

**"Invalid API Key Format"**
- Double-check you copied the complete key
- Ensure no extra spaces or characters

**"Connection Failed"**
- Verify your internet connection
- Check if the service is experiencing downtime
- Confirm the API key has proper permissions

**"GitHub PAT Issues"**
- Ensure scopes include: `repo`, `user`, `delete_repo`
- Token must be "classic" personal access token

**"Vercel Deployment Fails"**
- Check your Vercel token has deployment permissions
- Verify you have available project slots in your account

### Need Help?

1. Check the API Setup tab for real-time status
2. Use the "Test Connection" feature (when available)
3. Verify environment variables are saved correctly
4. Restart your development server after changes

---

## 💡 **Pro Tips**

- **Start with minimum**: Just GitHub + Vercel for basic deployments
- **Add features gradually**: Enable MongoDB, Clerk, DNS as needed
- **Use test keys first**: Most services offer test/sandbox environments
- **Keep keys secure**: Never commit `.env.local` to version control
- **Rotate regularly**: Update API keys periodically for security 