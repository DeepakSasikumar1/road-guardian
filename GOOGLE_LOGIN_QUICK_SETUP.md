# ✅ Gmail Login - Quick Setup Checklist

## Good News! 🎉
Your app **already has the Google Sign-In button** implemented! You just need to configure the backend.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/

2. **Create/Select Project**:
   - Create new project: "RoadWatch AI"
   - Or use existing project

3. **Enable Google+ API**:
   - Go to: APIs & Services → Library
   - Search: "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**:
   - Go to: APIs & Services → Credentials
   - Click: "Create Credentials" → "OAuth client ID"
   
5. **Configure OAuth Consent Screen** (if prompted):
   - User Type: **External**
   - App name: **RoadWatch AI**
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue" through all steps

6. **Create OAuth Client**:
   - Application type: **Web application**
   - Name: **RoadWatch AI Web**
   
7. **Add Authorized Redirect URIs**:
   ```
   https://fcqxuqhddsuxiycdnvwa.supabase.co/auth/v1/callback
   http://localhost:5173
   ```

8. **Copy Credentials**:
   - ✅ Client ID (save this)
   - ✅ Client Secret (save this)

---

### Step 2: Configure Supabase

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/fcqxuqhddsuxiycdnvwa/auth/providers

2. **Enable Google Provider**:
   - Find "Google" in the providers list
   - Toggle it **ON**

3. **Enter Credentials**:
   - Paste **Client ID** from Google Console
   - Paste **Client Secret** from Google Console
   - Click **"Save"**

---

### Step 3: Test It!

1. **Open your app**: http://localhost:5173/login

2. **Click "Continue with Google"** button

3. **Select your Google account**

4. **Grant permissions**

5. **You'll be logged in!** ✅

---

## 🎯 What You'll See

Your login page already has:

```
┌─────────────────────────────────────┐
│         Welcome Back                │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  🔵 Continue with Google      │ │ ← Already there!
│  └───────────────────────────────┘ │
│                                     │
│  ────── Or continue with email ──  │
│                                     │
│  Email: [________________]          │
│  Password: [________________]       │
│                                     │
│  [Sign In]                          │
└─────────────────────────────────────┘
```

---

## 📋 Exact Redirect URIs to Add

Copy these **exactly** into Google Cloud Console:

**Production:**
```
https://fcqxuqhddsuxiycdnvwa.supabase.co/auth/v1/callback
```

**Development:**
```
http://localhost:5173
```

---

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch"

**Solution:**
- Go to Google Cloud Console → Credentials
- Edit your OAuth client
- Make sure both URIs above are added
- Wait 5 minutes for changes to propagate

---

### Error: "Access blocked"

**Solution:**
- Go to OAuth consent screen
- Add your email to "Test users"
- Or publish the app (if ready for production)

---

### User logs in but profile not created

**Solution:**
- Check: Supabase → Authentication → Users
- User should appear automatically
- Profile is created by database trigger

---

## ✅ Verification Steps

After setup:

1. ✅ Google OAuth client created
2. ✅ Redirect URIs added
3. ✅ Supabase Google provider enabled
4. ✅ Client ID & Secret entered in Supabase
5. ✅ Test login successful

---

## 🎓 How It Works

```
User clicks "Continue with Google"
         ↓
Redirects to Google login
         ↓
User selects account
         ↓
Google redirects to Supabase
         ↓
Supabase creates session
         ↓
User redirected to dashboard
         ↓
Profile auto-created in database
```

---

## 📊 Current Status

**Frontend:** ✅ Already implemented  
**Backend:** ⏳ Needs configuration (Steps 1-2 above)  
**Database:** ✅ Auto-profile creation ready  

---

## 🔗 Quick Links

**Google Cloud Console:**
https://console.cloud.google.com/apis/credentials

**Supabase Auth Settings:**
https://supabase.com/dashboard/project/fcqxuqhddsuxiycdnvwa/auth/providers

**Your Login Page:**
http://localhost:5173/login

---

## 💡 Pro Tips

1. **Test Users**: Add your email to test users in Google Console
2. **Multiple Accounts**: Users can have both email/password AND Google login
3. **Profile Sync**: Name and email auto-populate from Google account
4. **Security**: OAuth is more secure than password-only login

---

## 📱 What Users Will Experience

1. Click "Continue with Google"
2. See familiar Google login screen
3. Select their Google account
4. Grant permissions (one-time)
5. Instantly logged into RoadWatch AI
6. Profile auto-created with their Google info

**No password to remember!** 🎉

---

## 🚀 Ready to Enable?

**Time Required:** 5 minutes  
**Difficulty:** Easy  
**Steps:** 2 (Google Console + Supabase)  

**Follow Steps 1-2 above to enable Google login!**

---

**Last Updated:** February 4, 2026  
**Status:** Frontend Ready ✅ | Backend Needs Config ⏳
