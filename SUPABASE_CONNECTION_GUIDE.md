# 🔌 Connect Supabase - Complete Setup Guide

## ✅ Current Status

Your project **already has Supabase configured**! Here's what's set up:

- **Project ID**: `aruwsimxdrprerjqgqvc`
- **Supabase URL**: `https://aruwsimxdrprerjqgqvc.supabase.co`
- **Frontend Connection**: ✅ Already configured in `.env`

---

## 🎯 What You Need to Do

You need to **link the Supabase CLI** to deploy Edge Functions (like the AI Assistant backend).

---

## 📋 Step-by-Step Connection Guide

### Step 1: Link Your Supabase Project

Open PowerShell/Terminal in your project directory and run:

```powershell
npx supabase link --project-ref aruwsimxdrprerjqgqvc
```

**What this does:**
- Connects your local project to your Supabase cloud project
- Allows you to deploy Edge Functions
- Enables you to manage secrets

**Expected prompt:**
```
Enter your database password (or leave blank to skip):
```

**What to do:**
- If you know your database password, enter it
- If you don't know it, **press Enter to skip** (you can still deploy functions)

**Expected output:**
```
Finished supabase link.
```

---

### Step 2: Set the Gemini API Key

```powershell
npx supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

**Get your Gemini API key:**
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (format: `AIzaSyC...`)

**Example:**
```powershell
npx supabase secrets set GEMINI_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
```

**Expected output:**
```
Finished supabase secrets set.
```

---

### Step 3: Deploy the AI Assistant Function

```powershell
npx supabase functions deploy chat-assistant
```

**Expected output:**
```
Deploying chat-assistant (project ref: aruwsimxdrprerjqgqvc)
...
Deployed Function chat-assistant
```

---

### Step 4: Deploy the Alert Function (Optional)

```powershell
npx supabase functions deploy send-alert
```

**Expected output:**
```
Deployed Function send-alert
```

---

### Step 5: Verify Everything is Connected

```powershell
# Check deployed functions
npx supabase functions list

# Check secrets
npx supabase secrets list
```

**Expected output:**
```
Functions:
- chat-assistant
- send-alert

Secrets:
- GEMINI_API_KEY
```

---

## 🚀 Quick Commands (Copy & Paste)

```powershell
# Navigate to project directory
cd "c:\Users\deepa\Downloads\road-guardian-main updated-1\road-guardian-main"

# Link Supabase project
npx supabase link --project-ref aruwsimxdrprerjqgqvc

# Set Gemini API key (replace with your actual key)
npx supabase secrets set GEMINI_API_KEY=YOUR_KEY_HERE

# Deploy AI Assistant
npx supabase functions deploy chat-assistant

# Deploy Alert System (optional)
npx supabase functions deploy send-alert

# Verify
npx supabase functions list
npx supabase secrets list
```

---

## 🔍 Troubleshooting

### Issue 1: "Project not found"

**Error:**
```
Error: Project ref not found
```

**Solution:**
Check your project is active in Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Find project: `aruwsimxdrprerjqgqvc`
3. Make sure it's not paused
4. If paused, click "Restore"

---

### Issue 2: "Authentication required"

**Error:**
```
Error: You need to login first
```

**Solution:**
```powershell
npx supabase login
```

This will open a browser to authenticate with Supabase.

---

### Issue 3: "Database password required"

**If you don't know your database password:**

**Option A: Skip it (for Edge Functions only)**
- Just press Enter when prompted
- Edge Functions will still deploy

**Option B: Reset password**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → Database
4. Click "Reset Database Password"
5. Save the new password

---

### Issue 4: "Function deployment failed"

**Check function logs:**
```powershell
npx supabase functions logs chat-assistant
```

**Common fixes:**
- Ensure you're in the correct directory
- Check internet connection
- Verify project is not paused

---

## ✅ How to Verify Connection

### Test 1: Check Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select project: `aruwsimxdrprerjqgqvc`
3. Go to **Edge Functions** section
4. You should see:
   - `chat-assistant`
   - `send-alert` (if deployed)

### Test 2: Check in Your App

1. Open http://localhost:5173
2. Go to **Assistant** page
3. Type: "How many obstacles are detected?"
4. **Success if:**
   - ✅ No "Using Offline Mode" toast
   - ✅ Response streams in word-by-word
   - ✅ Intelligent, detailed answer

### Test 3: Check Secrets

```powershell
npx supabase secrets list
```

Should show:
```
GEMINI_API_KEY
```

---

## 📊 Your Supabase Configuration

### Frontend (.env file)
```env
VITE_SUPABASE_PROJECT_ID="aruwsimxdrprerjqgqvc"
VITE_SUPABASE_URL="https://aruwsimxdrprerjqgqvc.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."
```
✅ **Already configured!**

### Backend (Edge Functions)
- `chat-assistant` - AI Assistant backend
- `send-alert` - Alert notification system

**Status:** ⏳ Needs deployment (follow steps above)

### Database
- Tables: obstacles, alerts, profiles, user_roles, alert_recipients
- RLS Policies: ✅ Configured
- Migrations: ✅ Applied

**Status:** ✅ Already set up

---

## 🎯 What Each Component Does

### Frontend Connection (Already Working)
```typescript
// src/integrations/supabase/client.ts
const supabase = createClient(
  VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY
)
```
- Connects your React app to Supabase
- Handles authentication
- Manages real-time data
- **Status:** ✅ Working

### Edge Functions (Needs Deployment)
```
supabase/functions/
  ├── chat-assistant/    # AI Assistant backend
  └── send-alert/        # Alert notifications
```
- Run on Supabase servers
- Handle AI processing
- Send notifications
- **Status:** ⏳ Needs deployment

---

## 🔐 Security Notes

### API Keys in .env
✅ **Safe** - These are public/publishable keys
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Safe to expose in frontend
- `VITE_SUPABASE_URL` - Public URL

### Secrets in Supabase
🔒 **Secure** - These are server-side only
- `GEMINI_API_KEY` - Never exposed to frontend
- Stored securely in Supabase
- Only accessible by Edge Functions

---

## 📱 Complete Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (React + Vite)                    │
│  - Uses .env for Supabase connection        │
│  - Already configured ✅                    │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│  Supabase Cloud                             │
│  Project: aruwsimxdrprerjqgqvc              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Database                           │   │
│  │  - Tables ✅                        │   │
│  │  - RLS Policies ✅                  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Edge Functions                     │   │
│  │  - chat-assistant ⏳                │   │
│  │  - send-alert ⏳                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Secrets                            │   │
│  │  - GEMINI_API_KEY ⏳                │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Legend:**
- ✅ Already configured
- ⏳ Needs setup (follow guide above)

---

## 🎓 Understanding Supabase CLI

### What is Supabase CLI?
- Command-line tool for managing Supabase projects
- Allows you to deploy Edge Functions
- Manage secrets and configurations
- Run migrations

### Do I need it installed?
**No!** Using `npx` automatically downloads and runs it:
```powershell
npx supabase [command]
```

### Common Commands
```powershell
# Link project
npx supabase link --project-ref YOUR_REF

# Deploy function
npx supabase functions deploy FUNCTION_NAME

# Set secret
npx supabase secrets set KEY=VALUE

# View logs
npx supabase functions logs FUNCTION_NAME

# List functions
npx supabase functions list

# List secrets
npx supabase secrets list
```

---

## 🚀 Next Steps After Connection

Once connected, you can:

1. **Use AI Assistant**
   - Get intelligent responses
   - Real-time data analysis
   - Maintenance recommendations

2. **Set Up Alerts**
   - Configure email notifications
   - Set up SMS alerts (Twilio)
   - Customize alert rules

3. **Monitor System**
   - View function logs
   - Track API usage
   - Monitor performance

---

## 📞 Support Resources

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Your Project**: https://supabase.com/dashboard/project/aruwsimxdrprerjqgqvc
- **Supabase Docs**: https://supabase.com/docs
- **Edge Functions Guide**: https://supabase.com/docs/guides/functions

---

## ✨ Summary

**What's Already Done:**
✅ Supabase project created  
✅ Frontend connected  
✅ Database set up  
✅ Tables and policies configured  

**What You Need to Do:**
1. Link Supabase CLI: `npx supabase link --project-ref aruwsimxdrprerjqgqvc`
2. Get Gemini API key: https://makersuite.google.com/app/apikey
3. Set secret: `npx supabase secrets set GEMINI_API_KEY=...`
4. Deploy functions: `npx supabase functions deploy chat-assistant`
5. Test in your app!

**Time Required:** ~5 minutes

---

**Ready to connect? Follow the steps above!** 🎉

---

**Last Updated:** February 4, 2026  
**Project ID:** aruwsimxdrprerjqgqvc
