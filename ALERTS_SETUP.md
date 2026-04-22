# Alert System Setup Guide

RoadWatch AI uses Supabase Edge Functions to send real-time alerts.

## 1. Prerequisites

- A [Supabase](https://supabase.com) project connected to this codebase.
- A [Twilio](https://twilio.com) account (for SMS).
- A [Gmail](https://gmail.com) account (for Email) OR a [Resend](https://resend.com) API Key.

## 2. Environment Variables

You must set the following secrets in your Supabase project using the dashboard or CLI.

### Required
- `SUPABASE_URL`: Your Supabase URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Service Role Key (found in Project Settings > API).

### For Gmail (Email)
- `GMAIL_USER`: Your full Gmail address (e.g. `your.name@gmail.com`).
- `GMAIL_APP_PASSWORD`: An App Password generated from your Google Account Security settings (NOT your login password).
  - Go to Google Account > Security > 2-Step Verification > App passwords to generate one.

### For SMS (Twilio)
- `TWILIO_ACCOUNT_SID`: Your Account SID.
- `TWILIO_AUTH_TOKEN`: Your Auth Token.
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number (e.g. `+1234567890`).

### Alternative Email (Resend)
If you prefer Resend over Gmail:
- `RESEND_API_KEY`: Your Resend API Key.

## 3. Deployment

Deploy the functions using the Supabase CLI:

```bash
npx supabase functions deploy send-alert --no-verify-jwt
```

## 4. Testing

Once deployed, the `ObstacleContext.tsx` in the frontend will automatically invoke this function whenever a new High Severity obstacle is mocked/detected.

You can verify it by checking the browser console logs: `[ALERT SYSTEM] Alert sent successfully`.
